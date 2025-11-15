#!/usr/bin/env python3
"""
Smart IoT Device Manager - Camera & Microphone
Automatically detects and runs available devices (camera/microphone) as separate MQTT connections
Each device can have its own certificates and publish to separate topics
"""

import cv2
import pyaudio
import sys
import time
import json
import base64
import threading
import signal
import atexit
from datetime import datetime
from pathlib import Path
from awscrt import mqtt
from awsiot import mqtt_connection_builder

# Global device instances for cleanup
camera_device = None
microphone_device = None

def cleanup_all():
    """Cleanup all devices on exit"""
    global camera_device, microphone_device
    if camera_device:
        camera_device.cleanup()
    if microphone_device:
        microphone_device.cleanup()

def signal_handler(sig, frame):
    """Handle Ctrl+C and termination signals"""
    cleanup_all()
    sys.exit(0)

# Register cleanup handlers
atexit.register(cleanup_all)
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Configuration directories
CAMERA_CONFIG = Path("certs/camera/config.json")
MICROPHONE_CONFIG = Path("certs/microphone/config.json")

def load_config(config_path):
    """Load device configuration from config.json"""
    if not config_path.exists():
        return None
    
    try:
        with open(config_path) as f:
            return json.load(f)
    except Exception as e:
        return None

def check_available_devices():
    """Check which devices have valid configurations"""
    devices = {}
    
    # Check camera
    camera_config = load_config(CAMERA_CONFIG)
    if camera_config:
        devices['camera'] = camera_config
    
    # Check microphone
    mic_config = load_config(MICROPHONE_CONFIG)
    if mic_config:
        devices['microphone'] = mic_config
    
    if not devices:
        print("\n❌ No device configurations found!")
        print("\n📥 Setup Instructions:")
        print("   1. Go to the web interface")
        print("   2. Add devices (camera and/or microphone)")
        print("   3. Click 'Provision Device' for each")
        print("   4. Download certificates for each device")
        print("   5. Extract camera certificates to 'certs/camera/' folder")
        print("   6. Extract microphone certificates to 'certs/microphone/' folder")
        sys.exit(1)
    
    return devices

# Configuration
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
CAPTURE_INTERVAL = 1  # seconds - 1 FPS for smooth updates without overwhelming system

# Audio Configuration
AUDIO_FORMAT = pyaudio.paInt16
AUDIO_CHANNELS = 1
AUDIO_RATE = 16000
AUDIO_CHUNK = 1024


class CameraDevice:
    """Camera device handler"""
    
    def __init__(self, config):
        self.config = config
        self.camera = None
        self.mqtt_connection = None
        self.running = False
        self.frame_count = 0
        
    def initialize_camera(self):
        """Initialize camera"""
        try:
            camera = cv2.VideoCapture(0)
            
            if not camera.isOpened():
                return False
            
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
            
            ret, frame = camera.read()
            if not ret:
                camera.release()
                return False
            
            self.camera = camera
            return True
            
        except Exception as e:
            return False
    
    def connect_mqtt(self):
        """Connect to AWS IoT Core"""
        certs_path = Path("certs/camera")
        cert_files = self.config['certificate_files']
        
        cert_filepath = certs_path / cert_files['certificate']
        key_filepath = certs_path / cert_files['private_key']
        ca_filepath = certs_path / cert_files['root_ca']
        
        for name, path in [
            ("Certificate", cert_filepath),
            ("Private Key", key_filepath),
            ("Root CA", ca_filepath)
        ]:
            if not path.exists():
                return False
        
        try:
            self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
                endpoint=self.config['aws_iot_endpoint'],
                cert_filepath=str(cert_filepath),
                pri_key_filepath=str(key_filepath),
                ca_filepath=str(ca_filepath),
                client_id=self.config['thing_name'],
                clean_session=False,
                keep_alive_secs=30
            )
            
            connect_future = self.mqtt_connection.connect()
            connect_future.result()
            
            print("✅ [Camera] Connected to AWS IoT Core!")
            return True
            
        except Exception as e:
            return False
    
    def capture_and_encode_frame(self):
        """Capture frame and encode to base64"""
        ret, frame = self.camera.read()
        
        if not ret:
            return None
        
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
        success, encoded_image = cv2.imencode('.jpg', frame, encode_param)
        
        if not success:
            return None
        
        return base64.b64encode(encoded_image.tobytes()).decode('utf-8')
    
    def publish_frame(self, video_data):
        """Publish video frame to AWS IoT Core"""
        payload = {
            "device_id": self.config['device_id'],
            "thing_name": self.config['thing_name'],
            "house_id": self.config['house_id'],
            "location": self.config['location'],
            "timestamp": datetime.now().isoformat(),
            "device_type": "camera",
            "type": "frame",
            "image": video_data,
            "metadata": {
                "resolution": f"{FRAME_WIDTH}x{FRAME_HEIGHT}",
                "format": "jpeg"
            }
        }
        
        try:
            self.mqtt_connection.publish(
                topic=self.config['mqtt_topic'],
                payload=json.dumps(payload),
                qos=mqtt.QoS.AT_LEAST_ONCE
            )
            
            self.frame_count += 1
            return True
            
        except Exception as e:
            return False
    
    def run(self):
        """Main camera loop"""
        if not self.initialize_camera():
            return
        
        if not self.connect_mqtt():
            self.cleanup()
            return
        
        self.running = True
        
        try:
            while self.running:
                video_data = self.capture_and_encode_frame()
                if video_data:
                    self.publish_frame(video_data)
                time.sleep(CAPTURE_INTERVAL)
                
        except KeyboardInterrupt:
            pass
        except Exception as e:
            pass
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        if self.camera is not None:
            self.camera.release()
        
        if self.mqtt_connection is not None:
            try:
                disconnect_future = self.mqtt_connection.disconnect()
                disconnect_future.result()
            except:
                pass


class MicrophoneDevice:
    """Microphone device handler"""
    
    def __init__(self, config):
        self.config = config
        self.audio = None
        self.stream = None
        self.mqtt_connection = None
        self.running = False
        self.audio_count = 0
        
    def initialize_microphone(self):
        """Initialize microphone"""
        print(f"\n� [Microphone] Initializing...")
        
        try:
            audio = pyaudio.PyAudio()
            
            default_input = audio.get_default_input_device_info()
            print(f"   Using: {default_input['name']}")
            
            stream = audio.open(
                format=AUDIO_FORMAT,
                channels=AUDIO_CHANNELS,
                rate=AUDIO_RATE,
                input=True,
                input_device_index=default_input['index'],
                frames_per_buffer=AUDIO_CHUNK
            )
            
            # Test recording
            test_data = stream.read(AUDIO_CHUNK, exception_on_overflow=False)
            print(f"   Test: captured {len(test_data)} bytes")
            
            self.audio = audio
            self.stream = stream
            print(f"✅ [Microphone] Initialized - {AUDIO_RATE}Hz, {AUDIO_CHANNELS} channel(s)")
            return True
            
        except Exception as e:
            print(f"❌ [Microphone] Initialization error: {e}")
            if 'audio' in locals():
                audio.terminate()
            return False
    
    def connect_mqtt(self):
        """Connect to AWS IoT Core"""
        certs_path = Path("certs/microphone")
        cert_files = self.config['certificate_files']
        
        cert_filepath = certs_path / cert_files['certificate']
        key_filepath = certs_path / cert_files['private_key']
        ca_filepath = certs_path / cert_files['root_ca']
        
        for name, path in [
            ("Certificate", cert_filepath),
            ("Private Key", key_filepath),
            ("Root CA", ca_filepath)
        ]:
            if not path.exists():
                return False
        
        try:
            self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
                endpoint=self.config['aws_iot_endpoint'],
                cert_filepath=str(cert_filepath),
                pri_key_filepath=str(key_filepath),
                ca_filepath=str(ca_filepath),
                client_id=self.config['thing_name'],
                clean_session=False,
                keep_alive_secs=30
            )
            
            connect_future = self.mqtt_connection.connect()
            connect_future.result()
            
            print("✅ [Microphone] Connected to AWS IoT Core!")
            return True
            
        except Exception as e:
            return False
    
    def capture_audio(self, duration_sec=1, amplify=5.0):
        """Capture audio for specified duration with amplification"""
        try:
            frames = []
            chunks_to_record = int(AUDIO_RATE / AUDIO_CHUNK * duration_sec)
            
            for _ in range(chunks_to_record):
                data = self.stream.read(AUDIO_CHUNK, exception_on_overflow=False)
                frames.append(data)
            
            audio_data = b''.join(frames)
            
            # Amplify audio
            if amplify != 1.0:
                import numpy as np
                audio_array = np.frombuffer(audio_data, dtype=np.int16)
                
                rms = np.sqrt(np.mean(audio_array**2))
                max_val = np.max(np.abs(audio_array))
                
                amplified = (audio_array * amplify).astype(np.int16)
                amplified = np.clip(amplified, -32768, 32767)
                
                audio_data = amplified.tobytes()
            
            return base64.b64encode(audio_data).decode('utf-8')
            
        except Exception as e:
            return None
    
    def publish_audio(self, audio_data):
        """Publish audio to AWS IoT Core"""
        payload = {
            "device_id": self.config['device_id'],
            "thing_name": self.config['thing_name'],
            "house_id": self.config['house_id'],
            "location": self.config['location'],
            "timestamp": datetime.now().isoformat(),
            "device_type": "microphone",
            "type": "frame",
            "audio": {
                "data": audio_data,
                "sample_rate": AUDIO_RATE,
                "channels": AUDIO_CHANNELS,
                "format": "pcm16"
            }
        }
        
        try:
            self.mqtt_connection.publish(
                topic=self.config['mqtt_topic'],
                payload=json.dumps(payload),
                qos=mqtt.QoS.AT_LEAST_ONCE
            )
            
            self.audio_count += 1
            return True
            
        except Exception as e:
            return False
    
    def run(self):
        """Main microphone loop"""
        if not self.initialize_microphone():
            return
        
        if not self.connect_mqtt():
            self.cleanup()
            return
        
        self.running = True
        
        try:
            while self.running:
                # Record 3 seconds of audio
                audio_data = self.capture_audio(duration_sec=3, amplify=5.0)
                if audio_data:
                    self.publish_audio(audio_data)
                
                # Ignore the next 2 seconds (don't record)
                time.sleep(2)
                
        except KeyboardInterrupt:
            pass
        except Exception as e:
            pass
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        if self.stream is not None:
            self.stream.stop_stream()
            self.stream.close()
        
        if self.audio is not None:
            self.audio.terminate()
        
        if self.mqtt_connection is not None:
            try:
                disconnect_future = self.mqtt_connection.disconnect()
                disconnect_future.result()
            except:
                pass


def main():
    """Main function - Starts all available devices"""
    print("=" * 70)
    print("🎥🎤 Smart IoT Device Manager")
    print("=" * 70)
    
    try:
        # Check which devices are configured
        print("\n📋 Checking device configurations...")
        available_devices = check_available_devices()
        
        print(f"\n✅ Found {len(available_devices)} configured device(s)")
        
        threads = []
        devices = []
        
        # Start camera device if configured
        if 'camera' in available_devices:
            global camera_device
            camera_device = CameraDevice(available_devices['camera'])
            devices.append(camera_device)
            cam_thread = threading.Thread(target=camera_device.run, name="Camera")
            cam_thread.daemon = True
            threads.append(cam_thread)
            print(f"   📹 Camera device ready")
        
        # Start microphone device if configured
        if 'microphone' in available_devices:
            global microphone_device
            microphone_device = MicrophoneDevice(available_devices['microphone'])
            devices.append(microphone_device)
            mic_thread = threading.Thread(target=microphone_device.run, name="Microphone")
            mic_thread.daemon = True
            threads.append(mic_thread)
            print(f"   🎤 Microphone device ready")
        
        # Start all device threads
        print("\n" + "=" * 70)
        print("� Starting devices...")
        print("   Press Ctrl+C to stop all devices")
        print("=" * 70 + "\n")
        
        for thread in threads:
            thread.start()
            time.sleep(0.5)  # Small delay between starts
        
        # Wait for all threads
        try:
            while True:
                # Check if any thread is still alive
                alive = any(t.is_alive() for t in threads)
                if not alive:
                    print("\n⚠️  All device threads stopped")
                    break
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Shutdown signal received")
            
            # Stop all devices
            for device in devices:
                device.running = False
            
            # Wait for threads to finish
            print("⏳ Waiting for devices to stop...")
            for thread in threads:
                thread.join(timeout=5)
        
        print("\n" + "=" * 70)
        print("✅ All devices stopped successfully")
        print("=" * 70)
        return 0
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
