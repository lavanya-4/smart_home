# 🏠 Smart Home IoT Device Setup Guide

## 📋 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVICE PROVISIONING FLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. WEB INTERFACE (Frontend)
   ├─ Add Device Form
   │  ├─ House: Select house
   │  ├─ Name: "Living Room Camera"
   │  ├─ Type: Camera
   │  └─ Location: "Living Room"
   │
   └─ Click "Add Device" ✅

2. DEVICE CARD APPEARS
   ├─ [Provision Device] Button (Yellow) 🔑
   │  ├─ Calls: POST /devices/{id}/provision
   │  ├─ Backend creates AWS IoT Thing
   │  ├─ Generates X.509 certificates
   │  └─ Stores certificate_arn in DB
   │
   └─ Button turns green ✅ "Provisioned"

3. DOWNLOAD CERTIFICATES
   ├─ [Download Certificates] Button (Green) 📥
   │  ├─ Calls: GET /devices/{id}/download-certificates
   │  ├─ Backend generates ZIP file with:
   │  │  ├─ device-certificate.pem.crt
   │  │  ├─ private-key.pem.key
   │  │  ├─ public-key.pem.key
   │  │  ├─ AmazonRootCA1.pem
   │  │  ├─ config.json (auto-configured)
   │  │  └─ README.txt
   │  │
   │  └─ Browser downloads: device_{id}_certificates.zip

4. IOT DEVICE SETUP
   ├─ Extract ZIP to: iot_device/certs/
   ├─ Install dependencies: pip install -r requirements.txt
   └─ Run: python device.py

5. DEVICE CONNECTS
   ├─ Reads config.json
   ├─ Connects to AWS IoT Core
   ├─ Captures camera + microphone
   └─ Publishes to MQTT topic every 5 seconds
```

## 🎯 What You Have Now

### Backend API Endpoints
- ✅ `POST /api/v1/devices/add` - Create device in database
- ✅ `POST /api/v1/devices/{id}/provision` - Create AWS IoT Thing & certificates
- ✅ `GET /api/v1/devices/{id}/download-certificates` - Download ZIP with certs
- ✅ `DELETE /api/v1/devices/{id}` - Delete device & cleanup AWS IoT

### Frontend UI Components
- ✅ **Info Banner** - Step-by-step setup instructions
- ✅ **Device Form** - Add new devices
- ✅ **Device Card** with:
  - 🔑 "Provision Device" button (Yellow → Green when done)
  - 📥 "Download Certificates" button
  - 📺 "Show Live Feed" button
  - �� Device status and metadata

### IoT Device Files
- ✅ `device.py` - Main script with camera + microphone
- ✅ `requirements.txt` - AWS IoT SDK, OpenCV, PyAudio
- ✅ `README.md` - Complete setup instructions
- ✅ `.gitignore` - Prevents committing certificates

## 🚀 Quick Start

### 1. Setup AWS (One-time)

**Create IoT Policy in AWS Console:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect",
        "iot:Publish",
        "iot:Subscribe",
        "iot:Receive"
      ],
      "Resource": "*"
    }
  ]
}
```

**Name it:** `CameraDevicePolicy`

**Configure Backend .env:**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_IOT_ENDPOINT=xxxxx.iot.us-east-1.amazonaws.com
```

### 2. Start Backend

```bash
cd backend
python main.py
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

### 4. Add & Provision Device

1. Go to Devices page
2. Fill device form and click "Add Device"
3. Click **"Provision Device"** (Yellow button)
4. Wait for success message
5. Click **"Download Certificates"** (Green button)
6. Save the ZIP file

### 5. Setup IoT Device

```bash
cd iot_device

# Extract certificates (from downloads)
unzip ~/Downloads/device_*_certificates.zip

# Install dependencies
pip install -r requirements.txt

# Run device
python device.py
```

### 6. Verify Connection

You should see:
```
✅ Connected to AWS IoT Core!
✅ Camera initialized: 640x480
✅ Microphone initialized
✅ [10:30:00] Published: 📹 Video + 🎤 Audio → house/xxx/Living Room/camera
```

## 📦 Certificate ZIP Contents

```
device_xxx_certificates.zip
├── device-certificate.pem.crt    # Device certificate
├── private-key.pem.key           # Private key (KEEP SECURE!)
├── public-key.pem.key            # Public key
├── AmazonRootCA1.pem             # Amazon Root CA
├── config.json                   # Auto-configured settings
└── README.txt                    # Setup instructions
```

## 🔐 Security Notes

- ⚠️ **Never commit certificates to git** (already in .gitignore)
- 🔒 Keep private keys secure
- 🔑 Each device has unique certificates
- 🚫 Don't share certificates between devices

## 🎨 UI Features

### Device Card Buttons

1. **🔑 Provision Device** (Yellow)
   - Creates AWS IoT Thing
   - Generates certificates
   - One-time setup per device
   - Turns green when done ✅

2. **📥 Download Certificates** (Emerald)
   - Downloads ZIP file
   - Can download multiple times
   - Contains all needed files

3. **�� Show Live Feed** (Indigo)
   - View real-time video stream
   - Shows device metrics
   - Toggle on/off

### Info Banner

- Step-by-step instructions
- Color-coded buttons
- Setup tips
- Dismissible (X button)

## 🔧 Configuration

### Camera Settings (device.py)
```python
CAMERA_INDEX = 0          # 0, 1, 2 for multiple cameras
FRAME_WIDTH = 640         # Resolution
FRAME_HEIGHT = 480
CAPTURE_INTERVAL = 5      # Seconds between captures
```

### Audio Settings
```python
AUDIO_RATE = 16000        # Sample rate
AUDIO_CHANNELS = 1        # Mono
AUDIO_CHUNK = 1024        # Buffer size
```

### MQTT Topic Format
```
house/{house_id}/{location}/{device_type}
```
Example: `house/abc123/Living Room/camera`

## 📊 Data Format

### Published JSON Message
```json
{
  "device_id": "uuid",
  "thing_name": "device_uuid",
  "house_id": "house_uuid",
  "location": "Living Room",
  "timestamp": "2025-11-14T10:30:00.123456",
  "device_type": "camera",
  "video": {
    "image": "base64-jpeg-data...",
    "resolution": "640x480",
    "format": "jpeg"
  },
  "audio": {
    "data": "base64-pcm-data...",
    "sample_rate": 16000,
    "channels": 1,
    "format": "pcm16"
  }
}
```

## 🐛 Troubleshooting

### Backend Issues

**"Missing certificate files"**
- Ensure AWS credentials in .env
- Check AWS_IOT_ENDPOINT is set

**"Failed to provision device"**
- Verify AWS IoT policy exists: `CameraDevicePolicy`
- Check AWS IAM permissions

### Frontend Issues

**"Failed to download certificates"**
- Device must be provisioned first
- Check browser allows downloads

### IoT Device Issues

**"Configuration file not found"**
- Download certificates from frontend
- Extract to `iot_device/certs/`

**"Failed to open camera"**
- Check camera permissions
- Try different CAMERA_INDEX (0, 1, 2)

**"Connection failed"**
- Verify certificates in certs/ folder
- Check config.json has correct endpoint

## 📚 File Structure

```
smart_home/
├── backend/
│   ├── core/
│   │   └── aws_iot.py          # AWS IoT manager
│   └── routes/
│       └── device_routes.py    # Provision & download endpoints
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Device/
│   │   │       └── DeviceCard.jsx  # Provision/download UI
│   │   ├── pages/
│   │   │   └── DevicesPage.jsx     # Info banner
│   │   └── services/
│   │       └── api.js              # API methods
│
└── iot_device/
    ├── device.py               # Main IoT device script
    ├── requirements.txt        # Dependencies
    ├── README.md              # Device setup guide
    ├── .gitignore             # Exclude certificates
    └── certs/                 # Certificates go here (gitignored)
        ├── device-certificate.pem.crt
        ├── private-key.pem.key
        ├── public-key.pem.key
        ├── AmazonRootCA1.pem
        └── config.json
```

## 🎉 Success Indicators

### Frontend
- ✅ Device card shows "Provisioned" (green)
- ✅ ZIP file downloaded
- ✅ Success notifications appear

### IoT Device Console
- ✅ "Connected to AWS IoT Core!"
- ✅ "Camera initialized"
- ✅ "Microphone initialized"
- ✅ "Published: 📹 Video + 🎤 Audio"

### AWS IoT Core Console
- ✅ Thing appears in Things list
- ✅ Certificate is active
- ✅ Messages appear in MQTT test client

## 🆘 Need Help?

1. Check console logs (browser & terminal)
2. Verify AWS credentials and permissions
3. Ensure IoT policy exists
4. Test camera/mic permissions
5. Check network connectivity

---

**Built with:** FastAPI • React • AWS IoT Core • OpenCV • PyAudio
