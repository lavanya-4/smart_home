"""
AWS IoT MQTT Client using AWS IoT SDK
Properly handles AWS IoT Core communication for receiving device messages
"""
import json
import logging
import asyncio
import uuid
from datetime import datetime
from typing import Optional
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from awscrt import mqtt
from awsiot import mqtt_connection_builder

from core.websocket_manager import manager as connection_manager
from core.database import get_table, Tables
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread pool for async task execution
executor = ThreadPoolExecutor(max_workers=10)


class AWSIoTMQTTClient:
    """
    AWS IoT MQTT Client for receiving device messages and broadcasting via WebSocket
    Uses AWS IoT SDK for proper AWS IoT Core integration
    """
    
    def __init__(
        self,
        endpoint: str,
        cert_path: str,
        key_path: str,
        ca_path: str,
        client_id: str = "smart_home_backend",
        event_loop = None
    ):
        """
        Initialize AWS IoT MQTT Client
        
        Args:
            endpoint: AWS IoT endpoint (e.g., xxxxx.iot.us-east-2.amazonaws.com)
            cert_path: Path to client certificate
            key_path: Path to private key
            ca_path: Path to root CA certificate
            client_id: MQTT client ID
            event_loop: Asyncio event loop for scheduling async tasks
        """
        self.endpoint = endpoint
        self.cert_path = str(Path(cert_path).resolve())
        self.key_path = str(Path(key_path).resolve())
        self.ca_path = str(Path(ca_path).resolve())
        self.client_id = client_id
        self.mqtt_connection = None
        self.is_connected = False
        self.event_loop = event_loop or asyncio.get_event_loop()
        
        # Topics to subscribe to
        self.topics = [
            "house/+/+/camera",      # house/{house_id}/{location}/camera
            "house/+/+/microphone",  # house/{house_id}/{location}/microphone
            "house/+/+/incidents",   # house/{house_id}/{location}/incidents
            "device/+/data",         # device/{device_id}/data
        ]
        
        logger.info(f"AWS IoT MQTT Client initialized")
        logger.info(f"  Endpoint: {self.endpoint}")
        logger.info(f"  Client ID: {self.client_id}")
        logger.info(f"  Certificate: {self.cert_path}")
        logger.info(f"  Private Key: {self.key_path}")
        logger.info(f"  Root CA: {self.ca_path}")
    
    def on_connection_interrupted(self, connection, error, **kwargs):
        """Callback when connection is interrupted"""
        logger.warning(f"⚠️ Connection interrupted. Error: {error}")
        self.is_connected = False
    
    def on_connection_resumed(self, connection, return_code, session_present, **kwargs):
        """Callback when connection is resumed"""
        logger.info(f"✅ Connection resumed. Return code: {return_code}, Session present: {session_present}")
        self.is_connected = True
        
        # Re-subscribe to topics
        if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
            logger.info("Re-subscribing to topics...")
            for topic in self.topics:
                self.subscribe(topic)
    
    def on_message_received(self, topic, payload, dup, qos, retain, **kwargs):
        """
        Callback when message is received
        
        Args:
            topic: MQTT topic
            payload: Message payload (bytes)
            dup: Duplicate delivery flag
            qos: Quality of Service
            retain: Retain flag
        """
        try:
            # Decode payload
            payload_str = payload.decode('utf-8')
            
            # logger.info(f"📨 Received message on topic: {topic}")
            # logger.info(f"📦 Payload size: {len(payload_str)} bytes")
            
            # Parse JSON
            try:
                message_data = json.loads(payload_str)
                # logger.info(f"✅ Parsed JSON. Keys: {list(message_data.keys())}")
                
                # Extract device_id
                device_id = message_data.get('device_id')
                
                if not device_id:
                    # Try to extract from topic (e.g., device/{device_id}/data)
                    topic_parts = topic.split('/')
                    if len(topic_parts) >= 2 and topic_parts[0] == 'device':
                        device_id = topic_parts[1]
                    else:
                        logger.warning(f"No device_id found in message or topic: {topic}")
                        return
                
                # Process message - schedule async task in the event loop
                asyncio.run_coroutine_threadsafe(
                    self.process_device_message(device_id, message_data, topic),
                    self.event_loop
                )
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON payload: {e}")
                logger.error(f"Payload preview: {payload_str[:200]}")
                
        except Exception as e:
            logger.error(f"Error in on_message_received: {e}", exc_info=True)
    
    async def process_device_message(self, device_id: str, message_data: dict, topic: str):
        """
        Process device message: update database and broadcast via WebSocket
        
        Args:
            device_id: Device ID
            message_data: Parsed message data
            topic: MQTT topic
        """
        try:
            # Extract data from message
            image_data = message_data.get('image') or message_data.get('frame') or message_data.get('data')
            timestamp = message_data.get('timestamp', datetime.now().isoformat())
            message_type = message_data.get('type', 'frame')
            metadata = message_data.get('metadata', {})
            
            # logger.info(f"🔄 Processing message for device: {device_id}, type: {message_type}, has_image: {image_data is not None}")
            
            # Update device status in database
            await self.update_device_status(device_id)
            
            # Prepare WebSocket message
            websocket_message = {
                'device_id': device_id,
                'type': message_type,
                'timestamp': timestamp,
                'metadata': metadata,
                'status': 'online',  # Mark device as online when receiving data
                'last_seen': timestamp
            }
            
            # Add image data if present
            if image_data:
                websocket_message['image'] = image_data
                # logger.info(f"📷 Image data included, length: {len(image_data)} chars")
            
            # Add audio data if present
            if message_data.get('audio'):
                websocket_message['audio'] = message_data['audio']
                logger.info(f"🔊 Audio data included")
            
            # Handle incident data from Lambda
            if 'incidents' in topic or message_data.get('event_type'):
                # This is incident data from Lambda - convert to alert format
                alert_data = await self.convert_incident_to_alert(message_data, topic)
                
                if alert_data:
                    # Save alert to DynamoDB
                    try:
                        alerts_table = get_table(Tables.ALERTS)
                        alerts_table.put_item(Item=alert_data)
                        logger.info(f"💾 Saved incident as alert {alert_data.get('alert_id')} to DynamoDB")
                    except Exception as e:
                        logger.error(f"Failed to save incident alert to DynamoDB: {e}")

                    websocket_message['alert'] = alert_data
                    websocket_message['type'] = 'alert'
            
            # Add any other alert information
            elif message_data.get('alert') or message_type == 'alert':
                # Handle direct alert payload or nested alert
                alert_data = message_data if message_type == 'alert' else message_data.get('alert')
                
                # Save alert to DynamoDB
                try:
                    alerts_table = get_table(Tables.ALERTS)
                    # Ensure all required fields are present
                    if 'alert_id' in alert_data:
                        alerts_table.put_item(Item=alert_data)
                        logger.info(f"💾 Saved alert {alert_data.get('alert_id')} to DynamoDB")
                except Exception as e:
                    logger.error(f"Failed to save alert to DynamoDB: {e}")

                websocket_message['alert'] = alert_data
                websocket_message['type'] = 'alert' # Ensure frontend knows it's an alert
            
            # Broadcast to WebSocket subscribers
            if message_type == 'alert' or websocket_message.get('alert'):
                # Alerts should be broadcast to ALL connected clients
                await connection_manager.broadcast_all(websocket_message)
                logger.info(f"✅ Broadcasted ALERT for device {device_id} to ALL clients")
            else:
                # Normal data (frames, etc.) only goes to subscribers
                await connection_manager.broadcast_to_device(device_id, websocket_message)
                # logger.info(f"✅ Broadcasted message for device {device_id} to WebSocket subscribers")
            
        except Exception as e:
            logger.error(f"Error processing device message for {device_id}: {e}", exc_info=True)
    
    async def convert_incident_to_alert(self, incident_data: dict, topic: str) -> dict:
        """
        Convert incident data from Lambda to alert format for storage and display
        
        Args:
            incident_data: Raw incident data from Lambda
            topic: MQTT topic (e.g., house/house-123/living-room/incidents)
            
        Returns:
            Dict in alert format
        """
        try:
            # Extract house_id and location from topic
            topic_parts = topic.split('/')
            house_id = topic_parts[1] if len(topic_parts) > 1 else 'unknown'
            location = topic_parts[2] if len(topic_parts) > 2 else 'unknown'
            
            # Get event details
            event_type = incident_data.get('event_type', 'Unknown Event')
            confidence = incident_data.get('confidence', 0.0)
            device_id = incident_data.get('device_id')
            timestamp = incident_data.get('timestamp', datetime.now().isoformat())
            
            # Determine severity based on confidence and event type
            severity = 'info'
            if confidence > 0.8:
                severity = 'critical'
            elif confidence > 0.5:
                severity = 'warning'
            
            # Create alert message
            message = f"{event_type} detected in {location}"
            if confidence:
                message += f" (confidence: {confidence:.1%})"
            
            # Generate unique alert ID
            alert_id = str(uuid.uuid4())
            
            alert_data = {
                'alert_id': alert_id,
                'house_id': house_id,
                'device_id': device_id,
                'severity': severity,
                'message': message,
                'timestamp': timestamp,
                'is_read': False,
                'metadata': {
                    'event_type': event_type,
                    'confidence': confidence,
                    'location': location,
                    'source': 'lambda_incident'
                }
            }
            
            logger.info(f"🔄 Converted incident to alert: {event_type} -> {severity} alert")
            return alert_data
            
        except Exception as e:
            logger.error(f"Error converting incident to alert: {e}")
            return None
    
    async def update_device_status(self, device_id: str):
        """Update device status in database"""
        try:
            devices_table = get_table(Tables.DEVICES)
            
            # Check if device exists
            response = devices_table.get_item(Key={'device_id': device_id})
            
            if 'Item' not in response:
                logger.warning(f"Device {device_id} not found in database")
                return
            
            # Update device status
            now = datetime.now().isoformat()
            devices_table.update_item(
                Key={'device_id': device_id},
                UpdateExpression='SET #status = :status, last_seen = :last_seen, updated_at = :updated_at',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'online',
                    ':last_seen': now,
                    ':updated_at': now
                }
            )
            
            logger.debug(f"Updated device {device_id} status to online")
            
        except ClientError as e:
            logger.error(f"DynamoDB error updating device {device_id}: {e}")
        except Exception as e:
            logger.error(f"Error updating device status for {device_id}: {e}")
    
    def connect(self):
        """Connect to AWS IoT Core"""
        try:
            logger.info("🔌 Building MQTT connection to AWS IoT Core...")
            
            # Build MQTT connection
            self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
                endpoint=self.endpoint,
                cert_filepath=self.cert_path,
                pri_key_filepath=self.key_path,
                ca_filepath=self.ca_path,
                client_id=self.client_id,
                clean_session=False,
                keep_alive_secs=30,
                on_connection_interrupted=self.on_connection_interrupted,
                on_connection_resumed=self.on_connection_resumed
            )
            
            logger.info("🔄 Connecting to AWS IoT Core...")
            connect_future = self.mqtt_connection.connect()
            
            # Wait for connection
            connect_future.result(timeout=10)
            self.is_connected = True
            
            logger.info("✅ Connected to AWS IoT Core!")
            
            # Subscribe to topics
            for topic in self.topics:
                self.subscribe(topic)
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to AWS IoT Core: {e}", exc_info=True)
            raise
    
    def subscribe(self, topic: str):
        """Subscribe to MQTT topic"""
        try:
            logger.info(f"📡 Subscribing to topic: {topic}")
            
            subscribe_future, packet_id = self.mqtt_connection.subscribe(
                topic=topic,
                qos=mqtt.QoS.AT_LEAST_ONCE,
                callback=self.on_message_received
            )
            
            # Wait for subscription
            subscribe_result = subscribe_future.result(timeout=5)
            logger.info(f"✅ Subscribed to {topic} (QoS: {subscribe_result['qos']})")
            
        except Exception as e:
            logger.error(f"❌ Failed to subscribe to {topic}: {e}")
    
    def disconnect(self):
        """Disconnect from AWS IoT Core"""
        try:
            if self.mqtt_connection and self.is_connected:
                logger.info("🔌 Disconnecting from AWS IoT Core...")
                disconnect_future = self.mqtt_connection.disconnect()
                disconnect_future.result(timeout=5)
                self.is_connected = False
                logger.info("✅ Disconnected from AWS IoT Core")
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")


# Global AWS IoT MQTT client
aws_mqtt_client: Optional[AWSIoTMQTTClient] = None


def initialize_aws_mqtt_client(
    endpoint: str,
    cert_path: str,
    key_path: str,
    ca_path: str,
    client_id: str = "smart_home_backend"
):
    """
    Initialize and connect AWS IoT MQTT client
    
    Args:
        endpoint: AWS IoT endpoint
        cert_path: Path to client certificate
        key_path: Path to private key
        ca_path: Path to root CA
        client_id: MQTT client ID
    """
    global aws_mqtt_client
    
    # Get the current event loop
    try:
        event_loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop, create a new one
        event_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(event_loop)
    
    aws_mqtt_client = AWSIoTMQTTClient(
        endpoint=endpoint,
        cert_path=cert_path,
        key_path=key_path,
        ca_path=ca_path,
        client_id=client_id,
        event_loop=event_loop
    )
    
    aws_mqtt_client.connect()
    
    logger.info("✅ AWS IoT MQTT client initialized and connected")
    
    return aws_mqtt_client


def shutdown_aws_mqtt_client():
    """Shutdown AWS IoT MQTT client"""
    global aws_mqtt_client
    
    if aws_mqtt_client:
        aws_mqtt_client.disconnect()
        logger.info("✅ AWS IoT MQTT client shut down")
