"""
Quick test to check if passlib is working correctly
"""
from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test password
password = "admin123"
print(f"Testing password: {password}")

# Hash the password
hashed = pwd_context.hash(password)
print(f"Hashed: {hashed}")

# Verify the password
result = pwd_context.verify(password, hashed)
print(f"Verification result: {result}")

# Test with existing hash
existing_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIyHRKpqeu"
print(f"\nTesting with existing hash...")
result2 = pwd_context.verify(password, existing_hash)
print(f"Verification with existing hash: {result2}")
