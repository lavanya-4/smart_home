# IoT Device - Smart Camera & Microphone Manager

This script intelligently manages camera and microphone devices as separate AWS IoT devices, each with their own certificates and MQTT connections.

## Features

- ✅ **Automatic Device Detection**: Runs only the devices that have valid configurations
- ✅ **Separate Connections**: Each device (camera/microphone) has its own AWS IoT connection
- ✅ **Independent Certificates**: Each device uses its own certificate set
- ✅ **Concurrent Operation**: Both devices run simultaneously in separate threads
- ✅ **Individual Topics**: Camera and microphone publish to their own MQTT topics

## Directory Structure

```
iot_device/
├── device.py              # Main script
├── requirements.txt       # Dependencies
├── test_microphone.py    # Microphone test utility
└── certs/                # Certificates directory
    ├── camera/           # Camera device certificates
    │   ├── config.json
    │   ├── device-certificate.pem.crt
    │   ├── private-key.pem.key
    │   ├── public-key.pem.key
    │   ├── AmazonRootCA1.pem
    │   └── README.txt
    └── microphone/       # Microphone device certificates
        ├── config.json
        ├── device-certificate.pem.crt
        ├── private-key.pem.key
        ├── public-key.pem.key
        ├── AmazonRootCA1.pem
        └── README.txt
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd iot_device
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Provision Devices in Web Interface

1. Go to the web interface (http://localhost:5173)
2. Navigate to **Devices** page
3. Add a **Camera** device:
   - Name: "Laptop Cam" (or any name)
   - Device Type: **Camera**
   - Location: "Living room" (or any location)
   - Click **Add Device**
4. Add a **Microphone** device:
   - Name: "Laptop Mic" (or any name)
   - Device Type: **Microphone**
   - Location: "Living room" (or any location)
   - Click **Add Device**

### 4. Download Certificates

For **each device**:

1. Click **"Provision Device"** button
2. Wait for provisioning to complete
3. Click **"Download Certificates"** button
4. A ZIP file will be downloaded

### 5. Extract Certificates

1. **Camera certificates**:
   ```bash
   # Extract the camera ZIP to certs/camera/
   mkdir -p certs/camera
   unzip device_<camera-device-id>_certificates.zip -d certs/camera/
   ```

2. **Microphone certificates**:
   ```bash
   # Extract the microphone ZIP to certs/microphone/
   mkdir -p certs/microphone
   unzip device_<microphone-device-id>_certificates.zip -d certs/microphone/
   ```

### 6. Verify Certificate Structure

```bash
# Check camera certificates
ls -la certs/camera/
# Should show: config.json, device-certificate.pem.crt, private-key.pem.key, etc.

# Check microphone certificates
ls -la certs/microphone/
# Should show: config.json, device-certificate.pem.crt, private-key.pem.key, etc.
```

## Running the Script

### Run Both Devices (if both are configured)

```bash
python device.py
```

### Run Only Camera (if only camera is configured)

Just set up camera certificates in `certs/camera/` and run:

```bash
python device.py
```

### Run Only Microphone (if only microphone is configured)

Just set up microphone certificates in `certs/microphone/` and run:

```bash
python device.py
```

## How It Works

1. **Automatic Detection**: The script checks which configurations exist:
   - Looks for `certs/camera/config.json`
   - Looks for `certs/microphone/config.json`

2. **Smart Execution**:
   - If **both** configs exist → Runs both camera and microphone
   - If **only camera** config exists → Runs only camera
   - If **only microphone** config exists → Runs only microphone
   - If **no configs** exist → Shows setup instructions and exits

3. **Separate Threads**: Each device runs in its own thread with:
   - Independent MQTT connection
   - Separate AWS IoT Thing
   - Individual certificates
   - Own MQTT topic

4. **Topics**:
   - Camera: `house/{house_id}/{location}/camera`
   - Microphone: `house/{house_id}/{location}/microphone`

## Output Example

```
======================================================================
🎥🎤 Smart IoT Device Manager
======================================================================

📋 Checking device configurations...
✅ Found camera configuration
✅ Found microphone configuration

✅ Found 2 configured device(s)
   📹 Camera device ready
   🎤 Microphone device ready

======================================================================
🚀 Starting devices...
   Press Ctrl+C to stop all devices
======================================================================

📷 [Camera] Initializing...
✅ [Camera] Initialized: 640x480

🔌 [Camera] Connecting to AWS IoT Core...
   Endpoint: xxxxx.iot.us-east-2.amazonaws.com
   Device: Laptop Cam
✅ [Camera] Connected to AWS IoT Core!

🎤 [Microphone] Initializing...
   Using: MacBook Pro Microphone
✅ [Microphone] Initialized - 16000Hz, 1 channel(s)

🔌 [Microphone] Connecting to AWS IoT Core...
   Endpoint: xxxxx.iot.us-east-2.amazonaws.com
   Device: Laptop Mic
✅ [Microphone] Connected to AWS IoT Core!

🎥 [Camera] Started - Publishing every 1s
🎙️  [Microphone] Started - Publishing every 1s

✅ [Camera] [15:30:45] Published frame #1 → house/house-123/Living room/camera
✅ [Microphone] [15:30:45] Published audio #1 → house/house-123/Living room/microphone
```

## Troubleshooting

### No configurations found

**Error**: `❌ No device configurations found!`

**Solution**: 
1. Make sure you've provisioned devices in the web interface
2. Download certificates for each device
3. Extract to correct folders: `certs/camera/` and/or `certs/microphone/`

### Certificate not found

**Error**: `❌ [Camera] Certificate not found: certs/camera/device-certificate.pem.crt`

**Solution**: 
1. Check that you extracted the ZIP file correctly
2. Ensure all files are in the right folder
3. Verify file permissions

### Connection failed

**Error**: `❌ [Camera] Connection failed`

**Solution**:
1. Check your internet connection
2. Verify the endpoint in config.json is correct
3. Ensure certificates match the Thing in AWS IoT
4. Check AWS IoT policy allows connections

### Microphone not capturing audio

**Solution**:
1. Run `python test_microphone.py` to test microphone
2. Check macOS permissions: System Settings → Privacy & Security → Microphone
3. Grant permission to Terminal or your IDE

## Stop the Script

Press `Ctrl+C` to gracefully stop all devices. The script will:
1. Stop all device threads
2. Release camera
3. Close audio stream
4. Disconnect from AWS IoT
5. Show summary statistics

## Advanced Usage

### Adjust Audio Amplification

Edit `device.py` and change the `amplify` parameter in `MicrophoneDevice.run()`:

```python
audio_data = self.capture_audio(duration_sec=1, amplify=5.0)  # Change 5.0 to desired value
```

### Change Capture Interval

Edit the `CAPTURE_INTERVAL` constant at the top of `device.py`:

```python
CAPTURE_INTERVAL = 1  # seconds (change to 0.5 for 2fps, 2 for 0.5fps, etc.)
```

### Change Video Resolution

Edit the resolution constants:

```python
FRAME_WIDTH = 640   # Change to 1280, 1920, etc.
FRAME_HEIGHT = 480  # Change to 720, 1080, etc.
```
