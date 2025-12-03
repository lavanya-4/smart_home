# Debug IoT Rule - Check CloudWatch Metrics

Go to AWS Console and check these:

## 1. CloudWatch Metrics for IoT Rule
- Open CloudWatch Console
- Go to "Metrics" → "All metrics"
- Search for "AWS/IoT"
- Look for your rule name "smart_home"
- Check these metrics:
  - **RuleMessageThrottled** - Should be 0
  - **RuleNotFound** - Should be 0
  - **ParseError** - Should be 0
  - **Success** - Should be increasing
  - **Failure** - Should be 0

## 2. Enable CloudWatch Logs for IoT Rules
If not already enabled:
- Go to AWS IoT Core Console
- Settings (left sidebar)
- Logs section
- Set level to "Debug" or "Info"
- Enable logs
- Check CloudWatch Logs → Log group: `AWSIotLogsV2`

## 3. Check Lambda Permissions
The IoT Rule needs permission to invoke your Lambda:
- Go to Lambda Console
- Open your function
- Configuration → Permissions
- Resource-based policy statements should show:
  - Principal: `iot.amazonaws.com`
  - Action: `lambda:InvokeFunction`

## 4. Test the Rule Manually
- Go to IoT Core Console → Rules → Your rule
- Click "Edit"
- Scroll to bottom → "Test rule"
- Use this test payload:
```json
{
  "device_id": "test-device",
  "audio": {
    "data": "dGVzdA==",
    "sample_rate": 16000,
    "channels": 1,
    "format": "pcm16"
  },
  "house_id": "house-123",
  "location": "living-room"
}
```
- Click "Test SQL statement"
- Check if the output shows the expected fields

## 5. Common Issues:

### Issue: SQL Query Mismatch
Your current SQL:
```sql
SELECT device_id, audio.data as audio_base64, house_id, location FROM 'house/+/+/microphone'
```

The payload structure from your device is:
```json
{
  "device_id": "...",
  "audio": {
    "data": "base64..."
  },
  "house_id": "...",
  "location": "..."
}
```

**Solution:** Change SQL to:
```sql
SELECT * FROM 'house/+/+/microphone'
```

This passes the entire payload to Lambda, then access it in Lambda as:
```python
audio_base64 = event.get('audio', {}).get('data')
```

### Issue: Lambda Timeout
- Check Lambda timeout setting (should be at least 30 seconds for ML models)
- Configuration → General configuration → Timeout

### Issue: Lambda Memory
- ML models need more memory (at least 512MB, preferably 1024MB+)
- Configuration → General configuration → Memory
