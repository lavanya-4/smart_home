"""
Generate bcrypt password hashes for users
"""
import bcrypt

def generate_hash(password):
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

# Generate hashes for our users
admin_hash = generate_hash("admin123")
caregiver_hash = generate_hash("care123")

print("=" * 60)
print("Password Hashes for DynamoDB")
print("=" * 60)
print()
print("Admin (admin@careapp.com / admin123):")
print(f"  {admin_hash}")
print()
print("Caregiver (caregiver@careapp.com / care123):")
print(f"  {caregiver_hash}")
print()
print("=" * 60)
