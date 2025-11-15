"""
MQTT Client for IoT Device Communication
Receives messages from IoT devices and broadcasts via WebSocket
Supports both local MQTT brokers and AWS IoT Core
"""
import json
import logging
import asyncio
from datetime import datetime
from typing import Optional
from pathlib import Path
import paho.mqtt.client as mqtt
import ssl

from core.websocket_manager import manager as connection_manager
from core.database import get_table, Tables
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MQTTClient:
    """
    MQTT Client for receiving IoT device messages and broadcasting via WebSocket
    Supports both local MQTT brokers and AWS IoT Core
    """
    
    def __init__(
        self, 
        broker_host: str = "localhost", 
        broker_port: int = 1883,
        use_tls: bool = False,
        cert_path: Optional[str] = None,
        key_path: Optional[str] = None,
        ca_path: Optional[str] = None,
        client_id: str = "smart_home_backend"
    ):
        """
        Initialize MQTT Client
        
        Args:
            broker_host: MQTT broker hostname (e.g., AWS IoT endpoint)
            broker_port: MQTT broker port (1883 for local, 8883 for AWS IoT)
            use_tls: Whether to use TLS/SSL (required for AWS IoT Core)
            cert_path: Path to client certificate (for AWS IoT Core)
            key_path: Path to private key (for AWS IoT Core)
            ca_path: Path to root CA certificate (for AWS IoT Core)
            client_id: MQTT client ID
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.use_tls = use_tls
        self.cert_path = cert_path
        self.key_path = key_path
        self.ca_path = ca_path
        self.client_id = client_id
        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        
        # Topics to subscribe to
        self.topics = [
            "house/+/+/camera",  # house/{house_id}/{location}/camera
            "house/+/+/audio",   # house/{house_id}/{location}/audio
            "device/+/data",     # device/{device_id}/data
        ]
    
    def setup(self):
        """Setup MQTT client with callbacks and TLS if needed"""
        self.client = mqtt.Client(client_id=self.client_id)
        
        # Set callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        
        # Configure TLS for AWS IoT Core if specified
        if self.use_tls:
            if not all([self.cert_path, self.key_path, self.ca_path]):
                raise ValueError("TLS enabled but certificate paths not provided")
            
            # Verify certificate files exist
            cert_file = Path(self.cert_path)
            key_file = Path(self.key_path)
            ca_file = Path(self.ca_path)
            
            if not cert_file.exists():
                raise FileNotFoundError(f"Certificate file not found: {self.cert_path}")
            if not key_file.exists():
                raise FileNotFoundError(f"Private key file not found: {self.key_path}")
            if not ca_file.exists():
                raise FileNotFoundError(f"Root CA file not found: {self.ca_path}")
            
            # Configure TLS
            self.client.tls_set(
                ca_certs=str(ca_file),
                certfile=str(cert_file),
                keyfile=str(key_file),
                cert_reqs=ssl.CERT_REQUIRED,
                tls_version=ssl.PROTOCOL_TLSv1_2,
                ciphers=None
            )
            
            logger.info(f"MQTT Client configured with TLS for AWS IoT Core: {self.broker_host}:{self.broker_port}")
        else:
            logger.info(f"MQTT Client configured for broker: {self.broker_host}:{self.broker_port}")
    
    def on_connect(self, client, userdata, flags, rc):
        """
        Callback when connected to MQTT broker
        
        Args:
            client: MQTT client instance
            userdata: User data
            flags: Connection flags
            rc: Result code
        """
        if rc == 0:
            self.is_connected = True
            logger.info("✅ Connected to MQTT broker")
            logger.info(f"🔍 Connection flags: {flags}")
            
            # Subscribe to all topics
            for topic in self.topics:
                result, mid = client.subscribe(topic)
                logger.info(f"Subscribed to topic: {topic} (result: {result}, mid: {mid})")
        else:
            logger.error(f"❌ Failed to connect to MQTT broker. Result code: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """
        Callback when disconnected from MQTT broker
        
        Args:
            client: MQTT client instance
            userdata: User data
            rc: Result code
        """
        self.is_connected = False
        logger.warning(f"⚠️ Disconnected from MQTT broker. Result code: {rc}")
        
        if rc != 0:
            logger.info("Attempting to reconnect...")
    
    def on_message(self, client, userdata, msg):
        """
        Callback when message is received from MQTT broker
        
        Args:
            client: MQTT client instance
            userdata: User data
            msg: MQTT message
        """
        try:
            # Parse topic
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            logger.info(f"📨 Received message on topic: {topic}")
            logger.info(f"📦 Payload size: {len(payload)} bytes")
            logger.info(f"📝 Payload preview: {payload[:100]}...")
            
            # Parse JSON payload
            try:
                message_data = json.loads(payload)
                logger.info(f"✅ Parsed JSON successfully. Keys: {list(message_data.keys())}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON payload: {e}")
                return
            
            # Extract device_id from message or topic
            device_id = message_data.get('device_id')
            
            if not device_id:
                # Try to extract from topic (e.g., device/{device_id}/data)
                topic_parts = topic.split('/')
                if len(topic_parts) >= 2 and topic_parts[0] == 'device':
                    device_id = topic_parts[1]
                else:
                    logger.warning(f"No device_id found in message or topic: {topic}")
                    return
            
            # Process the message asynchronously
            asyncio.create_task(self.process_device_message(device_id, message_data, topic))
            
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}", exc_info=True)
    
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
            
            logger.info(f"Processing message for device: {device_id}, type: {message_type}")
            
            # Update device status in database
            await self.update_device_status(device_id)
            
            # Create device event record
            await self.create_device_event(device_id, message_type, message_data)
            
            # Prepare WebSocket message
            websocket_message = {
                'device_id': device_id,
                'type': message_type,
                'timestamp': timestamp,
                'metadata': metadata
            }
            
            # Add image data if present
            if image_data:
                websocket_message['image'] = image_data
            
            # Add any alert information
            if message_data.get('alert'):
                websocket_message['alert'] = message_data['alert']
            
            # Broadcast to WebSocket subscribers
            await connection_manager.broadcast_to_device(device_id, websocket_message)
            
            logger.info(f"✅ Broadcasted message for device {device_id} to WebSocket subscribers")
            
        except Exception as e:
            logger.error(f"Error processing device message for {device_id}: {e}", exc_info=True)
    
    async def update_device_status(self, device_id: str):
        """
        Update device status in database (set online, update last_seen)
        
        Args:
            device_id: Device ID to update
        """
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
    
    async def create_device_event(self, device_id: str, event_type: str, event_data: dict):
        """
        Create device event record in database
        
        Args:
            device_id: Device ID
            event_type: Type of event (frame, alert, etc.)
            event_data: Event data
        """
        try:
            # You can create a DeviceEvents table or use Alerts table
            # For now, we'll log significant events as alerts
            
            if event_type == 'alert' or event_data.get('alert'):
                alerts_table = get_table(Tables.ALERTS)
                
                alert_data = {
                    'alert_id': f"{device_id}_{datetime.now().timestamp()}",
                    'device_id': device_id,
                    'house_id': event_data.get('house_id', 'unknown'),
                    'severity': event_data.get('severity', 'info'),
                    'message': event_data.get('alert') or event_data.get('message', 'Device event'),
                    'timestamp': datetime.now().isoformat(),
                    'is_read': False,
                    'event_type': event_type,
                    'metadata': event_data.get('metadata', {})
                }
                
                alerts_table.put_item(Item=alert_data)
                logger.info(f"Created alert for device {device_id}")
        
        except ClientError as e:
            logger.error(f"DynamoDB error creating device event: {e}")
        except Exception as e:
            logger.error(f"Error creating device event for {device_id}: {e}")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            logger.info(f"Connecting to MQTT broker at {self.broker_host}:{self.broker_port}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            raise
    
    def start_loop(self):
        """Start MQTT client loop in background"""
        try:
            self.client.loop_start()
            logger.info("MQTT client loop started")
        except Exception as e:
            logger.error(f"Failed to start MQTT loop: {e}")
            raise
    
    def stop_loop(self):
        """Stop MQTT client loop"""
        try:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT client stopped")
        except Exception as e:
            logger.error(f"Error stopping MQTT client: {e}")
    
    def publish(self, topic: str, payload: dict, qos: int = 1):
        """
        Publish message to MQTT topic
        
        Args:
            topic: MQTT topic
            payload: Message payload (will be JSON serialized)
            qos: Quality of Service level (0, 1, or 2)
        """
        try:
            if not self.is_connected:
                logger.warning("MQTT client not connected, cannot publish")
                return False
            
            message = json.dumps(payload)
            result = self.client.publish(topic, message, qos=qos)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published to topic {topic}")
                return True
            else:
                logger.error(f"Failed to publish to topic {topic}: {result.rc}")
                return False
        
        except Exception as e:
            logger.error(f"Error publishing message: {e}")
            return False


# Global MQTT client instance
mqtt_client = MQTTClient()


def initialize_mqtt_client(
    broker_host: str = "localhost", 
    broker_port: int = 1883,
    use_tls: bool = False,
    cert_path: Optional[str] = None,
    key_path: Optional[str] = None,
    ca_path: Optional[str] = None,
    client_id: str = "smart_home_backend"
):
    """
    Initialize and start MQTT client
    
    Args:
        broker_host: MQTT broker hostname (e.g., AWS IoT endpoint)
        broker_port: MQTT broker port (1883 for local, 8883 for AWS IoT)
        use_tls: Whether to use TLS/SSL (required for AWS IoT Core)
        cert_path: Path to client certificate (for AWS IoT Core)
        key_path: Path to private key (for AWS IoT Core)
        ca_path: Path to root CA certificate (for AWS IoT Core)
        client_id: MQTT client ID
    """
    global mqtt_client
    
    mqtt_client = MQTTClient(
        broker_host=broker_host,
        broker_port=broker_port,
        use_tls=use_tls,
        cert_path=cert_path,
        key_path=key_path,
        ca_path=ca_path,
        client_id=client_id
    )
    mqtt_client.setup()
    mqtt_client.connect()
    mqtt_client.start_loop()
    
    logger.info("✅ MQTT client initialized and started")
    
    return mqtt_client


def shutdown_mqtt_client():
    """Shutdown MQTT client"""
    global mqtt_client
    
    if mqtt_client:
        mqtt_client.stop_loop()
        logger.info("✅ MQTT client shut down")
