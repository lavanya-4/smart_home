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
    
    def on_connection_interrupted(self, connection, error, **kwargs):
        print(f"❌ [Camera] Connection interrupted: {error}")

    def on_connection_resumed(self, connection, return_code, session_present, **kwargs):
        print(f"✅ [Camera] Connection resumed")
    
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
                print(f"❌ [Camera] {name} not found: {path}")
                return False
        
        try:
            self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
                endpoint=self.config['aws_iot_endpoint'],
                cert_filepath=str(cert_filepath),
                pri_key_filepath=str(key_filepath),
                ca_filepath=str(ca_filepath),
                client_id=self.config['thing_name'],
                clean_session=False,
                keep_alive_secs=30,
                on_connection_interrupted=self.on_connection_interrupted,
                on_connection_resumed=self.on_connection_resumed
            )
            
            connect_future = self.mqtt_connection.connect()
            connect_future.result()
            
            print("✅ [Camera] Connected to AWS IoT Core!")
            return True
            
        except Exception as e:
            print(f"❌ [Camera] MQTT connection failed: {e}")
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
        """Publish video frame to AWS IoT Core (DISABLED)"""
        # The code below is commented out to disable sending camera info.
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
        payload_text = json.dumps(payload)
        
        # Check payload size
        payload_size_kb = len(payload_text) / 1024
        if len(payload_text) > 128 * 1024:
            print(f"❌ [Camera] Payload too large: {payload_size_kb:.1f} KB (max 128 KB)")
            return False
        
        try:
            print(f"[Camera] Sending frame #{self.frame_count + 1} -> {self.config['mqtt_topic']} ({payload_size_kb:.1f} KB)")
        
            self.mqtt_connection.publish(
                topic=self.config['mqtt_topic'],
                payload=payload_text,
                qos=mqtt.QoS.AT_LEAST_ONCE
            )
        
            self.frame_count += 1
            print(f"✅ [Camera] Sent frame #{self.frame_count}")
            return True
        
        except Exception as e:
            print(f"❌ [Camera] Failed to publish frame: {e}")
            return False
    
    def run(self):
        """Main camera loop"""
        if not self.initialize_camera():
            print("❌ [Camera] Failed to initialize camera")
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
            print(f"❌ [Camera] Error in run loop: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        print("\n🧹 [Camera] Cleaning up...")
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
        print(f"\n🎤 [Microphone] Initializing...")
        
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
    
    def on_connection_interrupted(self, connection, error, **kwargs):
        print(f"❌ [Microphone] Connection interrupted: {error}")

    def on_connection_resumed(self, connection, return_code, session_present, **kwargs):
        print(f"✅ [Microphone] Connection resumed")
    
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
                print(f"❌ [Microphone] {name} not found: {path}")
                return False
        
        try:
            self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
                endpoint=self.config['aws_iot_endpoint'],
                cert_filepath=str(cert_filepath),
                pri_key_filepath=str(key_filepath),
                ca_filepath=str(ca_filepath),
                client_id=self.config['thing_name'],
                clean_session=False,
                keep_alive_secs=30,
                on_connection_interrupted=self.on_connection_interrupted,
                on_connection_resumed=self.on_connection_resumed
            )
            
            connect_future = self.mqtt_connection.connect()
            connect_future.result()
            
            print("✅ [Microphone] Connected to AWS IoT Core!")
            return True
            
        except Exception as e:
            print(f"❌ [Microphone] MQTT connection failed: {e}")
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
                amplified = (audio_array * amplify).astype(np.int16)
                amplified = np.clip(amplified, -32768, 32767)
                audio_data = amplified.tobytes()
            
            # Limit to 90KB to leave room for base64 encoding + JSON overhead
            max_bytes = 90 * 1024
            if len(audio_data) > max_bytes:
                print(f"⚠️ Audio truncated from {len(audio_data)} to {max_bytes} bytes")
                audio_data = audio_data[:max_bytes]
                
            return base64.b64encode(audio_data).decode('utf-8')
            
        except Exception as e:
            print(f"❌ [Microphone] Capture error: {e}")
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
        payload_text = json.dumps(payload)
        
        # Check payload size
        payload_size_kb = len(payload_text) / 1024
        print(f"📊 [Microphone] Payload size: {payload_size_kb:.1f} KB")
        
        if len(payload_text) > 128 * 1024:
            print(f"❌ [Microphone] Payload exceeds 128KB limit! ({payload_size_kb:.1f} KB)")
            return False

        try:
            print(f"[Microphone] Sending audio #{self.audio_count + 1} -> {self.config['mqtt_topic']}")

            self.mqtt_connection.publish(
                topic=self.config['mqtt_topic'],
                payload=payload_text,
                qos=mqtt.QoS.AT_LEAST_ONCE
            )

            self.audio_count += 1
            print(f"✅ [Microphone] Sent audio #{self.audio_count}")
            return True

        except Exception as e:
            print(f"❌ [Microphone] Failed to publish audio: {e}")
            return False
    
    def run(self):
        """Main microphone loop - Sends files from audioFiles directory"""
        if not self.connect_mqtt():
            self.cleanup()
            return
        
        self.running = True
        audio_files_dir = Path("audioFiles")
        
        if not audio_files_dir.exists():
            print(f"❌ [Microphone] 'audioFiles' directory not found!")
            self.cleanup()
            return

        # Get all files (ignoring hidden files)
        files = sorted([f for f in audio_files_dir.iterdir() if f.is_file() and not f.name.startswith('.')])
        
        if not files:
            print(f"❌ [Microphone] No files found in 'audioFiles'!")
            self.cleanup()
            return

        print(f"✅ [Microphone] Found {len(files)} audio files to stream")

        try:
            import random
            import wave
            
            while self.running:
                # Pick a random file
                file_path = random.choice(files)
                
                print(f"\n📄 [Microphone] Reading file: {file_path.name}")
                try:
                    # Open WAV file and extract raw PCM data
                    with wave.open(str(file_path), 'rb') as wav_file:
                        # Read all frames (raw PCM data)
                        pcm_data = wav_file.readframes(wav_file.getnframes())
                        
                        # Limit to 90KB to account for base64 (33% increase) + JSON overhead
                        max_bytes = 90 * 1024
                        if len(pcm_data) > max_bytes:
                            print(f"⚠️ Truncating audio from {len(pcm_data)} to {max_bytes} bytes")
                            pcm_data = pcm_data[:max_bytes]
                            
                        encoded_data = base64.b64encode(pcm_data).decode('utf-8')
                        
                        print(f"   Extracted {len(pcm_data)} bytes of PCM data from WAV")
                        print(f"   Base64 encoded size: {len(encoded_data)} bytes")
                        
                        self.publish_audio(encoded_data)
                        
                except Exception as e:
                    print(f"❌ [Microphone] Error reading file {file_path.name}: {e}")

                # Wait 1 minute before sending next file
                print(f"\n⏳ Waiting 60 seconds before next audio file...")
                time.sleep(60)
                
        except KeyboardInterrupt:
            pass
        except Exception as e:
            print(f"❌ [Microphone] Error in run loop: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        print("\n🧹 [Microphone] Cleaning up...")
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
        print("🚀 Starting devices...")
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
