"""
Provision AWS IoT certificates for the backend MQTT client
This allows the backend to subscribe to device topics
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from core.aws_iot import AWSIoTManager
from core.config import settings

def provision_backend_certificates():
    """Create AWS IoT Thing and certificates for the backend"""
    
    print("=" * 70)
    print("🔐 Backend Certificate Provisioning")
    print("=" * 70)
    print()
    
    # Initialize AWS IoT Manager
    print("📡 Connecting to AWS IoT Core...")
    print(f"   Region: {settings.AWS_REGION}")
    print(f"   Endpoint: {settings.AWS_IOT_ENDPOINT}")
    print()
    
    iot_manager = AWSIoTManager()
    
    # Backend thing name
    thing_name = "smart_home_backend_subscriber"
    
    try:
        # Create thing and certificates
        print(f"🔧 Creating IoT Thing: {thing_name}")
        result = iot_manager.create_device_with_certificates(thing_name)
        
        # Create certs directory
        certs_dir = Path(__file__).parent / "certs" / "backend"
        certs_dir.mkdir(parents=True, exist_ok=True)
        
        # Save certificate files
        cert_file = certs_dir / f"{result['certificate_id']}-certificate.pem.crt"
        key_file = certs_dir / f"{result['certificate_id']}-private.pem.key"
        public_key_file = certs_dir / f"{result['certificate_id']}-public.pem.key"
        
        print()
        print("💾 Saving certificate files...")
        
        with open(cert_file, 'w') as f:
            f.write(result['certificate_pem'])
        print(f"   ✅ Certificate: {cert_file.name}")
        
        with open(key_file, 'w') as f:
            f.write(result['private_key'])
        print(f"   ✅ Private Key: {key_file.name}")
        
        with open(public_key_file, 'w') as f:
            f.write(result['public_key'])
        print(f"   ✅ Public Key: {public_key_file.name}")
        
        # Download Root CA if it doesn't exist
        root_ca_file = certs_dir / "AmazonRootCA1.pem"
        if not root_ca_file.exists():
            import urllib.request
            print()
            print("📥 Downloading Amazon Root CA...")
            root_ca_url = "https://www.amazontrust.com/repository/AmazonRootCA1.pem"
            urllib.request.urlretrieve(root_ca_url, root_ca_file)
            print(f"   ✅ Root CA: {root_ca_file.name}")
        
        # Update .env file
        env_file = Path(__file__).parent / ".env"
        print()
        print("📝 Updating .env file...")
        
        # Read existing .env
        env_content = ""
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()
        
        # Update or add certificate paths
        cert_path_line = f"AWS_IOT_CERT_PATH=certs/backend/{cert_file.name}\n"
        key_path_line = f"AWS_IOT_KEY_PATH=certs/backend/{key_file.name}\n"
        root_ca_line = f"AWS_IOT_ROOT_CA_PATH=certs/backend/AmazonRootCA1.pem\n"
        
        # Simple replacement - replace old paths if they exist
        lines = env_content.split('\n')
        new_lines = []
        cert_added = False
        key_added = False
        root_ca_added = False
        
        for line in lines:
            if line.startswith('AWS_IOT_CERT_PATH='):
                new_lines.append(cert_path_line.strip())
                cert_added = True
            elif line.startswith('AWS_IOT_KEY_PATH='):
                new_lines.append(key_path_line.strip())
                key_added = True
            elif line.startswith('AWS_IOT_ROOT_CA_PATH='):
                new_lines.append(root_ca_line.strip())
                root_ca_added = True
            else:
                new_lines.append(line)
        
        # Add if not found
        if not cert_added:
            new_lines.append(cert_path_line.strip())
        if not key_added:
            new_lines.append(key_path_line.strip())
        if not root_ca_added:
            new_lines.append(root_ca_line.strip())
        
        with open(env_file, 'w') as f:
            f.write('\n'.join(new_lines))
        
        print(f"   ✅ Updated certificate paths in .env")
        
        print()
        print("=" * 70)
        print("✅ Backend certificates provisioned successfully!")
        print("=" * 70)
        print()
        print("📋 Next steps:")
        print("   1. Restart your backend server")
        print("   2. Backend will now receive messages from IoT devices")
        print("   3. Messages will be forwarded to frontend via WebSocket")
        print()
        print("🔧 Files created:")
        print(f"   • {cert_file}")
        print(f"   • {key_file}")
        print(f"   • {public_key_file}")
        print(f"   • {root_ca_file}")
        print()
        
    except Exception as e:
        print()
        print("=" * 70)
        print("❌ Error provisioning backend certificates")
        print("=" * 70)
        print(f"Error: {str(e)}")
        print()
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    provision_backend_certificates()
