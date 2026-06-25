import os
from dotenv import load_dotenv

print("=== Testing Email Service ===")
load_dotenv()

gmail_email = os.getenv('GMAIL_EMAIL')
gmail_password = os.getenv('GMAIL_PASSWORD')

print(f"Gmail Email: {gmail_email}")
print(f"Gmail Password loaded: {bool(gmail_password)}")

if gmail_password:
    print(f"Password length: {len(gmail_password)}")
    print(f"First 5 chars: {gmail_password[:5]}")

# Now test send_verification_email
from email_service import send_verification_email

print("\nTesting send_verification_email...")
result = send_verification_email("neil.marturillas2024@gmail.com", "123456")
print(f"Email sent result: {result}")
