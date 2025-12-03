"""
WebSocket Connection Manager for Smart Home IoT System
Handles WebSocket connections, device subscriptions, and message broadcasting
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, List
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections and device subscriptions
    """
    
    def __init__(self):
        # List of all active WebSocket connections
        self.active_connections: List[WebSocket] = []
        
        # Maps device_id to set of WebSocket connections subscribed to that device
        self.device_subscriptions: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket):
        """
        Accept and register a new WebSocket connection
        
        Args:
            websocket: WebSocket connection to register
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove WebSocket from all subscriptions and active connections
        
        Args:
            websocket: WebSocket connection to remove
        """
        # Remove from active connections
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from all device subscriptions
        devices_to_remove = []
        for device_id, subscribers in self.device_subscriptions.items():
            if websocket in subscribers:
                subscribers.discard(websocket)
                # Mark empty subscription sets for removal
                if len(subscribers) == 0:
                    devices_to_remove.append(device_id)
        
        # Clean up empty subscription sets
        for device_id in devices_to_remove:
            del self.device_subscriptions[device_id]
        
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def subscribe(self, websocket: WebSocket, device_id: str):
        """
        Subscribe a WebSocket connection to a specific device
        
        Args:
            websocket: WebSocket connection to subscribe
            device_id: Device ID to subscribe to
        """
        if device_id not in self.device_subscriptions:
            self.device_subscriptions[device_id] = set()
        
        self.device_subscriptions[device_id].add(websocket)
        
        logger.info(
            f"WebSocket subscribed to device: {device_id}. "
            f"Total subscribers for this device: {len(self.device_subscriptions[device_id])}"
        )
        
        # Send confirmation to client
        await websocket.send_json({
            "type": "subscription_confirmed",
            "device_id": device_id,
            "timestamp": datetime.now().isoformat()
        })
    
    async def unsubscribe(self, websocket: WebSocket, device_id: str):
        """
        Unsubscribe a WebSocket connection from a specific device
        
        Args:
            websocket: WebSocket connection to unsubscribe
            device_id: Device ID to unsubscribe from
        """
        if device_id in self.device_subscriptions:
            self.device_subscriptions[device_id].discard(websocket)
            
            # Clean up empty subscription set
            if len(self.device_subscriptions[device_id]) == 0:
                del self.device_subscriptions[device_id]
            
            logger.info(f"WebSocket unsubscribed from device: {device_id}")
            
            # Send confirmation to client
            await websocket.send_json({
                "type": "unsubscription_confirmed",
                "device_id": device_id,
                "timestamp": datetime.now().isoformat()
            })
    
    async def broadcast_to_device(self, device_id: str, message: dict):
        """
        Broadcast message to all subscribers of a specific device
        
        Args:
            device_id: Device ID to broadcast to
            message: Message to broadcast (will be JSON serialized)
        """
        if device_id not in self.device_subscriptions:
            # logger.warning(f"⚠️  No subscribers for device: {device_id} (Available devices: {list(self.device_subscriptions.keys())})")
            return
        
        # Get subscribers for this device
        subscribers = self.device_subscriptions[device_id].copy()
        # logger.info(f"📡 Broadcasting to device {device_id}: {len(subscribers)} subscriber(s)")
        
        # Track failed connections to remove them
        failed_connections = []
        
        for websocket in subscribers:
            try:
                await websocket.send_json(message)
                logger.debug(f"  ✓ Sent to subscriber")
            except Exception as e:
                logger.error(f"  ✗ Error broadcasting to device {device_id}: {e}")
                failed_connections.append(websocket)
        
        # Clean up failed connections
        for websocket in failed_connections:
            self.disconnect(websocket)
        
        # logger.info(
        #     f"✅ Broadcasted to device {device_id}: "
        #     f"{len(subscribers) - len(failed_connections)}/{len(subscribers)} successful"
        # )
    
    async def broadcast_all(self, message: dict):
        """
        Broadcast message to all active connections
        
        Args:
            message: Message to broadcast (will be JSON serialized)
        """
        # Track failed connections to remove them
        failed_connections = []
        
        for websocket in self.active_connections.copy():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to all: {e}")
                failed_connections.append(websocket)
        
        # Clean up failed connections
        for websocket in failed_connections:
            self.disconnect(websocket)
        
        logger.info(
            f"Broadcasted to all: "
            f"{len(self.active_connections) - len(failed_connections)}/{len(self.active_connections)} successful"
        )
    
    def get_device_subscriber_count(self, device_id: str) -> int:
        """
        Get the number of subscribers for a device
        
        Args:
            device_id: Device ID to check
            
        Returns:
            Number of subscribers
        """
        return len(self.device_subscriptions.get(device_id, set()))
    
    def get_stats(self) -> dict:
        """
        Get statistics about connections and subscriptions
        
        Returns:
            Dictionary with connection statistics
        """
        return {
            "total_connections": len(self.active_connections),
            "total_devices_with_subscribers": len(self.device_subscriptions),
            "device_subscriptions": {
                device_id: len(subscribers)
                for device_id, subscribers in self.device_subscriptions.items()
            }
        }


# Create global ConnectionManager instance
manager = ConnectionManager()
