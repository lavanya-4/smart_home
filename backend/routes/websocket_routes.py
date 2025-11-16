"""
WebSocket Routes for Real-time Device Communication
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from core.websocket_manager import manager
import json
import logging
from datetime import datetime

router = APIRouter(tags=["WebSocket"])

logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time device communication
    
    Supports:
    - Subscribe to device updates: {"action": "subscribe", "device_id": "device-123"}
    - Unsubscribe from device: {"action": "unsubscribe", "device_id": "device-123"}
    - Ping/pong for keepalive: {"action": "ping"}
    """
    # Accept the connection
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connection established",
            "timestamp": datetime.now().isoformat(),
            "stats": manager.get_stats()
        })
        
        # Main message loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                
                try:
                    # Parse JSON message
                    message = json.loads(data)
                    action = message.get("action")
                    
                    if not action:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Missing 'action' field in message",
                            "timestamp": datetime.now().isoformat()
                        })
                        continue
                    
                    # Handle subscribe action
                    if action == "subscribe":
                        device_id = message.get("device_id")
                        
                        if not device_id:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Missing 'device_id' for subscribe action",
                                "timestamp": datetime.now().isoformat()
                            })
                            continue
                        
                        await manager.subscribe(websocket, device_id)
                        logger.info(f"Client subscribed to device: {device_id}")
                    
                    # Handle unsubscribe action
                    elif action == "unsubscribe":
                        device_id = message.get("device_id")
                        
                        if not device_id:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Missing 'device_id' for unsubscribe action",
                                "timestamp": datetime.now().isoformat()
                            })
                            continue
                        
                        await manager.unsubscribe(websocket, device_id)
                        logger.info(f"Client unsubscribed from device: {device_id}")
                    
                    # Handle ping action (keepalive)
                    elif action == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.now().isoformat()
                        })
                    
                    # Handle stats request
                    elif action == "stats":
                        # Client sending performance metrics
                        device_id = message.get("device_id")
                        metrics = message.get("metrics")
                        
                        if device_id and metrics:
                            # Log client performance metrics
                            logger.info(
                                f"Client metrics for device {device_id}: "
                                f"FPS={metrics.get('currentFps', 0):.1f}, "
                                f"Latency={metrics.get('averageLatency', 0)}ms, "
                                f"Frames={metrics.get('totalFrames', 0)}, "
                                f"Dropped={metrics.get('droppedFrames', 0)}"
                            )
                            
                            # Could store metrics in database for analytics
                            # await store_client_metrics(device_id, metrics)
                            
                            # Acknowledge receipt
                            await websocket.send_json({
                                "type": "stats_ack",
                                "device_id": device_id,
                                "message": "Metrics received",
                                "timestamp": datetime.now().isoformat()
                            })
                        else:
                            # Client requesting server stats
                            stats = manager.get_stats()
                            await websocket.send_json({
                                "type": "stats",
                                "data": stats,
                                "timestamp": datetime.now().isoformat()
                            })
                            logger.info(f"Stats requested: {stats}")
                    
                    # Unknown action
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Unknown action: {action}",
                            "supported_actions": ["subscribe", "unsubscribe", "ping", "stats"],
                            "timestamp": datetime.now().isoformat()
                        })
                        logger.warning(f"Unknown action received: {action}")
                
                except json.JSONDecodeError as e:
                    # Invalid JSON
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Invalid JSON format: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    })
                    logger.error(f"JSON decode error: {e}")
                
                except Exception as e:
                    # Other errors
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error processing message: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    })
                    logger.error(f"Error processing message: {e}")
            
            except WebSocketDisconnect:
                # Client disconnected normally
                logger.info("Client disconnected normally")
                break
            
            except Exception as e:
                # Unexpected error in message loop
                logger.error(f"Unexpected error in WebSocket loop: {e}")
                break
    
    except WebSocketDisconnect:
        # Connection closed during initial setup
        logger.info("Client disconnected during connection setup")
    
    except Exception as e:
        # Unexpected error during connection
        logger.error(f"Unexpected error in WebSocket endpoint: {e}")
    
    finally:
        # Always disconnect and clean up
        manager.disconnect(websocket)
        logger.info("WebSocket connection cleaned up")


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    Get current WebSocket connection statistics
    
    Returns:
        Statistics about active connections and subscriptions
    """
    return {
        "status": "active",
        "stats": manager.get_stats(),
        "timestamp": datetime.now().isoformat()
    }


@router.post("/ws/broadcast/{device_id}")
async def broadcast_to_device(device_id: str, message: dict):
    """
    Broadcast a message to all subscribers of a specific device
    (For testing/admin purposes)
    
    Args:
        device_id: Device ID to broadcast to
        message: Message payload to send
    """
    await manager.broadcast_to_device(device_id, {
        "device_id": device_id,
        "timestamp": datetime.now().isoformat(),
        **message
    })
    
    return {
        "status": "broadcasted",
        "device_id": device_id,
        "subscriber_count": manager.get_device_subscriber_count(device_id),
        "timestamp": datetime.now().isoformat()
    }


@router.post("/ws/broadcast/all")
async def broadcast_to_all(message: dict):
    """
    Broadcast a message to all active connections
    (For testing/admin purposes)
    
    Args:
        message: Message payload to send
    """
    await manager.broadcast_all({
        "timestamp": datetime.now().isoformat(),
        **message
    })
    
    return {
        "status": "broadcasted",
        "connection_count": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }
