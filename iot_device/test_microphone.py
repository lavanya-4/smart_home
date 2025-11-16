#!/usr/bin/env python3
"""
Test microphone permissions and audio capture
"""
import pyaudio
import numpy as np
import sys

def test_microphone():
    """Test if microphone is working and capturing audio"""
    print("🎤 Testing Microphone")
    print("=" * 60)
    
    try:
        audio = pyaudio.PyAudio()
        
        # List devices
        print("\n📋 Available audio input devices:")
        default_input = audio.get_default_input_device_info()
        print(f"   Default: {default_input['name']} (index: {default_input['index']})")
        
        # Try to open microphone
        print("\n🎙️  Opening microphone...")
        stream = audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            input_device_index=default_input['index'],
            frames_per_buffer=1024
        )
        
        print("✅ Microphone opened successfully!")
        print("\n🧪 Recording 3 seconds... MAKE SOME NOISE (talk, clap, tap)!")
        print()
        
        # Record for 3 seconds
        frames = []
        for i in range(int(16000 / 1024 * 3)):
            data = stream.read(1024, exception_on_overflow=False)
            frames.append(data)
            
            # Convert to numpy array and check level
            audio_data = np.frombuffer(data, dtype=np.int16)
            rms = np.sqrt(np.mean(audio_data.astype(np.float64)**2))
            max_val = np.max(np.abs(audio_data))
            
            # Visual indicator (handle NaN)
            if np.isnan(rms):
                rms = 0
            bars = int(rms / 100)
            print(f"  [{i+1:2d}/47] RMS: {rms:6.0f} Max: {max_val:6d} {'█' * min(bars, 50)}", end='\r')
        
        print("\n")
        
        # Analyze full recording
        all_audio = np.frombuffer(b''.join(frames), dtype=np.int16)
        overall_rms = np.sqrt(np.mean(all_audio.astype(np.float64)**2))
        overall_max = np.max(np.abs(all_audio))
        
        # Handle NaN
        if np.isnan(overall_rms):
            overall_rms = 0
        
        print("=" * 60)
        print("📊 Results:")
        print(f"   Overall RMS: {overall_rms:.0f}")
        print(f"   Overall Max: {overall_max}")
        print(f"   Samples: {len(all_audio)}")
        print()
        
        if overall_max == 0:
            print("❌ PROBLEM: No audio detected (all zeros)")
            print()
            print("Possible causes:")
            print("  1. Microphone permissions not granted to Terminal")
            print("     → Go to System Settings → Privacy & Security → Microphone")
            print("     → Enable Terminal/iTerm")
            print()
            print("  2. Wrong microphone selected")
            print("     → Check System Settings → Sound → Input")
            print()
            print("  3. Microphone muted or input volume is 0")
            print("     → Check input volume slider in Sound settings")
        elif overall_rms < 100:
            print("⚠️  WARNING: Audio detected but VERY quiet")
            print(f"   Current level: {overall_rms:.0f}")
            print(f"   Recommended: > 200")
            print()
            print("Try:")
            print("  - Speak louder or closer to microphone")
            print("  - Increase input volume in System Settings → Sound")
        else:
            print("✅ SUCCESS: Microphone is working!")
            print(f"   Audio level is good: {overall_rms:.0f}")
        
        print("=" * 60)
        
        # Cleanup
        stream.stop_stream()
        stream.close()
        audio.terminate()
        
        return overall_max > 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_microphone()
    sys.exit(0 if success else 1)
