# IoT Device - Camera & Microphone

This IoT device connects your camera and microphone to AWS IoT Core, streaming data to your smart home backend.

## 🚀 Quick Start

### 1. Download Certificates from Backend

Before running the device, you need to provision it and download certificates:

1. **Start your backend server** (if not already running)
   ```bash
   cd ../backend
   python main.py
   ```

2. **Open the web interface** in your browser
   - Usually at: `http://localhost:8000` or `http://localhost:5173`

3. **Add a new device**
   - Go to Devices page
   - Click "Add Device"
   - Fill in device details
   - Click "Provision Device" button
   - Click "Download Certificates" button

4. **Extract certificates**
   - You'll get a ZIP file named `device_<id>_certificates.zip`
   - Extract it to this folder (`iot_device/`)
   - The extracted `certs/` folder should contain:
     - `device-certificate.pem.crt`
     - `private-key.pem.key`
     - `public-key.pem.key`
     - `AmazonRootCA1.pem`
     - `config.json`

### 2. Install Dependencies

**For macOS:**
```bash
brew install portaudio
pip install -r requirements.txt
```

**For Linux:**
```bash
sudo apt-get install portaudio19-dev python3-pyaudio
pip install -r requirements.txt
```

**For Windows:**
```bash
pip install -r requirements.txt
```

### 3. Run the Device

```bash
python device.py
```

## 📁 Folder Structure

```
iot_device/
├── device.py              # Main device script
├── requirements.txt       # Python dependencies
├── README.md             # This file
└── certs/                # Certificate folder (create after downloading)
    ├── device-certificate.pem.crt
    ├── private-key.pem.key
    ├── public-key.pem.key
    ├── AmazonRootCA1.pem
    └── config.json       # Auto-generated configuration
```

## 🔧 What It Does

1. **Loads Configuration** from `certs/config.json`
2. **Connects to AWS IoT Core** using certificates
3. **Initializes Camera** (webcam)
4. **Initializes Microphone** (default audio input)
5. **Captures & Publishes Data** every 5 seconds:
   - 📹 Video frame (base64 encoded JPEG)
   - 🎤 Audio chunk (base64 encoded PCM)
6. **Publishes to MQTT Topic**: `house/{house_id}/{location}/{device_type}`

## 📊 Data Format

The device publishes JSON messages:

```json
{
  "device_id": "device-uuid",
  "thing_name": "device_device-uuid",
  "house_id": "house-uuid",
  "location": "Living Room",
  "timestamp": "2025-11-14T10:30:00.123456",
  "device_type": "camera",
  "video": {
    "image": "base64-encoded-jpeg...",
    "resolution": "640x480",
    "format": "jpeg"
  },
  "audio": {
    "data": "base64-encoded-pcm...",
    "sample_rate": 16000,
    "channels": 1,
    "format": "pcm16"
  }
}
```

## ⚙️ Configuration

Edit these values in `device.py`:

```python
# Camera settings
CAMERA_INDEX = 0          # 0 for default camera
FRAME_WIDTH = 640         # Resolution width
FRAME_HEIGHT = 480        # Resolution height
CAPTURE_INTERVAL = 5      # Seconds between captures

# Audio settings
AUDIO_RATE = 16000        # Sample rate (Hz)
AUDIO_CHANNELS = 1        # 1=Mono, 2=Stereo
AUDIO_CHUNK = 1024        # Buffer size
```

## 🔐 Security Notes

- **Keep certificates secure!** Never commit them to git
- The private key is sensitive - protect it
- Each device has unique certificates
- Certificates are used for authentication with AWS IoT

## 🐛 Troubleshooting

### "Configuration file not found"
- You need to download certificates from the backend first
- Follow the Quick Start guide above

### "Failed to open camera"
- Make sure your camera is connected
- Check if another application is using it
- Try changing `CAMERA_INDEX` (0, 1, 2, etc.)

### "Microphone initialization error"
- Check system audio settings
- Grant microphone permissions (especially on macOS)
- The device will continue with just video if mic fails

### "Connection failed"
- Verify certificates are in the correct location
- Check that AWS IoT endpoint is correct
- Ensure AWS IoT policy allows connections

### Permission Issues (macOS)
- Go to: System Preferences → Security & Privacy
- Allow Terminal/Python to access:
  - Camera
  - Microphone

## 📝 Next Steps

Once the device is running and publishing data:

1. Check AWS IoT Core console to see messages
2. View device status in your web interface
3. Monitor real-time video/audio streams
4. Set up alerts and automation rules

## 🔗 Related

- Backend API: `../backend/`
- Frontend UI: `../frontend/`
- AWS IoT Documentation: https://docs.aws.amazon.com/iot/

---

**Need help?** Check the main project README or raise an issue.
