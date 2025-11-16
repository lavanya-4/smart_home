import boto3
from core.config import settings
from typing import Dict

class AWSIoTManager:
    def __init__(self):
        self.iot_client = boto3.client(
            'iot',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
    
    def create_device_with_certificates(self, thing_name: str) -> Dict:
        """
        Complete device registration:
        1. Create Thing
        2. Generate certificates
        3. Attach policy
        4. Attach certificate to thing
        """
        try:
            # 1. Create Thing
            print(f"Creating thing: {thing_name}")
            thing_response = self.iot_client.create_thing(
                thingName=thing_name
            )
            
            # 2. Create certificates
            print(f"Creating certificates for: {thing_name}")
            cert_response = self.iot_client.create_keys_and_certificate(
                setAsActive=True
            )
            
            certificate_arn = cert_response['certificateArn']
            certificate_id = cert_response['certificateId']
            certificate_pem = cert_response['certificatePem']
            private_key = cert_response['keyPair']['PrivateKey']
            public_key = cert_response['keyPair']['PublicKey']
            
            # 3. Attach policy to certificate
            print(f"Attaching policy to certificate")
            self.iot_client.attach_policy(
                policyName='CameraMicDevicePolicy',
                target=certificate_arn
            )
            
            # 4. Attach certificate to thing
            print(f"Attaching certificate to thing")
            self.iot_client.attach_thing_principal(
                thingName=thing_name,
                principal=certificate_arn
            )
            
            print(f"✅ Device {thing_name} created successfully!")
            
            return {
                'thing_name': thing_name,
                'thing_arn': thing_response['thingArn'],
                'certificate_arn': certificate_arn,
                'certificate_id': certificate_id,
                'certificates': {
                    'certificatePem': certificate_pem,
                    'privateKey': private_key,
                    'publicKey': public_key,
                    'endpoint': settings.AWS_IOT_ENDPOINT
                }
            }
            
        except Exception as e:
            print(f"❌ Error creating device: {str(e)}")
            raise e
    
    def delete_device(self, thing_name: str, certificate_arn: str):
        """
        Delete device and cleanup all AWS IoT resources
        Steps:
        1. Detach certificate from thing
        2. Detach policy from certificate
        3. Deactivate certificate
        4. Delete certificate
        5. Delete thing
        """
        try:
            certificate_id = certificate_arn.split('/')[-1]
            
            print(f"🗑️  Starting deletion of device: {thing_name}")
            
            # 1. Detach certificate from thing
            try:
                print(f"   1/5 Detaching certificate from thing...")
                self.iot_client.detach_thing_principal(
                    thingName=thing_name,
                    principal=certificate_arn
                )
                print(f"   ✅ Certificate detached from thing")
            except self.iot_client.exceptions.ResourceNotFoundException:
                print(f"   ⚠️  Thing or attachment not found, continuing...")
            
            # 2. Detach policy from certificate
            try:
                print(f"   2/5 Detaching policy from certificate...")
                self.iot_client.detach_policy(
                    policyName='CameraMicDevicePolicy',
                    target=certificate_arn
                )
                print(f"   ✅ Policy detached from certificate")
            except self.iot_client.exceptions.ResourceNotFoundException:
                print(f"   ⚠️  Policy or attachment not found, continuing...")
            
            # 3. Update certificate to inactive
            try:
                print(f"   3/5 Deactivating certificate...")
                self.iot_client.update_certificate(
                    certificateId=certificate_id,
                    newStatus='INACTIVE'
                )
                print(f"   ✅ Certificate deactivated")
            except self.iot_client.exceptions.ResourceNotFoundException:
                print(f"   ⚠️  Certificate not found, continuing...")
            
            # 4. Delete certificate
            try:
                print(f"   4/5 Deleting certificate...")
                self.iot_client.delete_certificate(
                    certificateId=certificate_id,
                    forceDelete=True
                )
                print(f"   ✅ Certificate deleted")
            except self.iot_client.exceptions.ResourceNotFoundException:
                print(f"   ⚠️  Certificate already deleted, continuing...")
            
            # 5. Delete thing
            try:
                print(f"   5/5 Deleting thing...")
                self.iot_client.delete_thing(
                    thingName=thing_name
                )
                print(f"   ✅ Thing deleted")
            except self.iot_client.exceptions.ResourceNotFoundException:
                print(f"   ⚠️  Thing already deleted")
            
            print(f"✅ Device {thing_name} fully deleted from AWS IoT!")
            
        except Exception as e:
            print(f"❌ Error deleting device {thing_name}: {str(e)}")
            raise e

# Global instance
iot_manager = AWSIoTManager()
