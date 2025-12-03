# IoT Audio Analysis & Incident Reporting Plan

This plan outlines how to connect your audio-analyzing Lambda function to the IoT audio stream and display the results in the "Incidents" section of your application.

## Architecture Overview

1.  **IoT Device (Microphone)**: Captures audio and publishes it to AWS IoT Core.
2.  **AWS IoT Rule**: Intercepts the audio stream and triggers your Lambda function.
3.  **Lambda Function**: Analyzes the audio, generates a prediction, and **publishes** the result back to a new MQTT topic.
4.  **Backend**: Subscribes to the result topic, saves the incident to the database, and broadcasts it to the frontend via WebSocket.
5.  **Frontend**: Displays real-time and historical incidents on the Incidents page.

---

## Step 1: AWS Configuration (Using Lambda UI)

You can use the **Add trigger** button in the Lambda console, which is easier than the IoT console. However, you **cannot** use the "Add destination" button to send data back to the IoT topic (it doesn't support MQTT). You must use the code in Step 2 for that.

### 1.1 Add Trigger (Input)
1.  Open your function in the **AWS Lambda Console**.
2.  Click the **+ Add trigger** button on the left side of the designer.
3.  Select **AWS IoT** from the source list.
4.  Select **Create a new rule**.
5.  **Rule name**: `AudioAnalysisTrigger`
6.  **Rule query statement**:
    ```sql
    SELECT device_id, audio.data as audio_base64, house_id, location FROM 'house/+/+/microphone'
    ```
7.  Click **Add**.

### 1.2 Permission Check
*   The "Add trigger" step automatically gives permission for IoT to invoke your Lambda.
*   **Crucial**: You still need to give your Lambda permission to **publish** results back to IoT Core.
    1.  Go to **Configuration** > **Permissions**.
    2.  Click the Role name to open IAM.
    3.  Add permission: `iot:Publish` on resource `*` (or specific topic ARN).

---

## Step 2: Update Lambda Function Code

Modify your Lambda function to publish the result instead of just returning it.

```python
import os, json, time, uuid, numpy as np, boto3, tensorflow as tf, tensorflow_hub as hub
from datetime import datetime
from .audio_utils import decode_audio_base64_to_mono16k

IOT_DATA_ENDPOINT = os.environ.get("IOT_DATA_ENDPOINT")
RESULTS_TOPIC_FMT = "house/predictions/{device_id}"
MODEL_PATH = "/var/task/model/my_yamnet_human_model.keras"
LABEL_MAP_PATH = "/var/task/model/label_map.json"
YAMNET_HANDLE = "https://tfhub.dev/google/yamnet/1"  # load at runtime
os.environ.setdefault("TFHUB_CACHE_DIR", "/tmp/tfhub")  # cache across warm invocations

iot = yamnet = clf = labels = None

def _load_once():
    global iot, yamnet, clf, labels
    if iot is None:
        iot = boto3.client("iot-data", endpoint_url=f"https://{IOT_DATA_ENDPOINT}")
    if yamnet is None:
        t = time.time()
        yamnet = hub.load(YAMNET_HANDLE)  # first cold start downloads to /tmp/tfhub
        print(f"[Lambda] YAMNet loaded in {time.time()-t:.2f}s (cached in /tmp)")
    if clf is None:
        t = time.time()
        clf = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print(f"[Lambda] Classifier loaded in {time.time()-t:.2f}s")
    if labels is None:
        with open(LABEL_MAP_PATH, "r") as f:
            _labels = json.load(f)
        labels_clean = [str(s).strip() for s in (_labels["labels"] if isinstance(_labels, dict) and "labels" in _labels else _labels)]
        globals()["labels"] = labels_clean

def _wave_to_embedding(y):
    wave = tf.convert_to_tensor(y, dtype=tf.float32)
    _, embeddings, _ = yamnet(wave)           # [T,1024]
    emb = tf.reduce_mean(embeddings, axis=0)  # [1024]
    return emb.numpy().reshape(1,1024).astype("float32")

def _postprocess(logits):
    arr = np.array(logits).squeeze()
    if arr.ndim == 1:
        idx = int(arr.argmax()); conf = float(arr[idx])
    else:
        m = arr.mean(axis=0); idx = int(m[idx])
    return idx, conf

def lambda_handler(event, context):
    _load_once()
    # 1. Process Input (Modified for SELECT * payload)
    device_id = event.get("device_id", "unknown")
    house_id = event.get("house_id", "unknown")
    location = event.get("location", "unknown")
    
    # Extract audio data from nested structure
    # Payload from SELECT * is: { "device_id": "...", "audio": { "data": "..." }, ... }
    audio_obj = event.get("audio", {})
    if isinstance(audio_obj, dict):
        audio_base64 = audio_obj.get("data")
    else:
        # Fallback if using the old alias query
        audio_base64 = event.get("audio_base64")

    if not audio_base64:
        print("[Lambda] No audio data found in event")
        return {"statusCode": 400, "error": "No audio data"}

    try:
        # 2. Existing Logic (Prediction)
        # We need to pass the base64 string directly or construct an event object that decode_audio_base64_to_mono16k expects
        # Assuming decode_audio_base64_to_mono16k handles the event dict or we modify it:
        
        # Create a temporary event structure that matches what decode_audio_base64_to_mono16k expects
        # If the utility expects 'audio_base64' key:
        decoding_event = {"audio_base64": audio_base64}
        
        # OR if decode_audio_base64_to_mono16k parses 'audio.data' from the raw event, we can pass 'event'
        # Let's assume we need to pass the event. 
        # IMPORTANT: You might need to check your audio_utils.py to see what it expects.
        # For now, let's assume we can pass the base64 string if we modify the call, 
        # but to be safe with your existing utils, let's mock the expected structure if needed.
        
        # Let's try passing the event as is, but ensure audio_base64 is accessible if the util looks for it
        event['audio_base64'] = audio_base64 
        
        y = decode_audio_base64_to_mono16k(event)
        x = _wave_to_embedding(y)
        logits = clf.predict(x, verbose=0)
        idx, conf = _postprocess(logits)
        label = labels[idx] if labels and 0 <= idx < len(labels) else f"class_{idx}"
        
        # 3. Construct Incident Payload
        incident_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        payload = {
            "alert_id": incident_id,
            "house_id": house_id,
            "device_id": device_id,
            "severity": "info", 
            "message": f"Sound detected: {label} ({int(conf * 100)}%)",
            "timestamp": timestamp,
            "is_read": False,
            "type": "alert"
        }
        
        # 4. Publish to MQTT Topic
        topic = f"house/{house_id}/{location}/incidents"
        
        iot.publish(topic=topic, qos=1, payload=json.dumps(payload))
        print(f"Published incident to {topic}")
        
        return {
            "statusCode": 200, 
            "body": json.dumps(payload)
        }

    except Exception as e:
        print("[Lambda] ERROR:", repr(e))
        return {"statusCode":500, "device_id":device_id, "error":str(e)}
```

---

## Step 3: Backend Implementation (I will do this)

I will modify the backend to:
1.  Subscribe to `house/+/+/incidents`.
2.  Process incoming "alert" messages.
3.  Save them to the `Alerts` DynamoDB table.
4.  Broadcast them to the frontend.

## Step 4: Frontend Implementation (I will do this)

I will modify the frontend to:
1.  Fetch historical incidents from the API.
2.  Listen for real-time incidents via WebSocket.
3.  Display them in the `IncidentsPage`.
