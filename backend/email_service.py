import random
import string
import smtplib
import sys
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from os import getenv
from dotenv import load_dotenv

# Load environment variables when this module is imported
load_dotenv()

# Debug: Log environment variables
debug_log_path = os.path.join(os.path.dirname(__file__), 'email_debug.log')
with open(debug_log_path, 'w') as f:
    f.write(f"[INIT] Module loaded\n")
    f.write(f"[INIT] CWD: {os.getcwd()}\n")
    f.write(f"[INIT] GMAIL_EMAIL from env: {getenv('GMAIL_EMAIL')}\n")
    f.write(f"[INIT] GMAIL_PASSWORD set: {bool(getenv('GMAIL_PASSWORD'))}\n")


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))


def send_verification_email(
    email: str,
    code: str,
    custom_gmail_email: Optional[str] = None,
    custom_gmail_password: Optional[str] = None
) -> bool:
    """
    Send verification email with code using Gmail SMTP
    Can use custom Gmail credentials or fall back to environment variables
    """
    debug_log_path = os.path.join(os.path.dirname(__file__), 'email_debug.log')
    
    try:
        # Use custom credentials if provided, otherwise use environment variables
        gmail_email = custom_gmail_email or getenv('GMAIL_EMAIL')
        gmail_password = custom_gmail_password or getenv('GMAIL_PASSWORD')
        
        # Debug logging
        with open(debug_log_path, 'a') as f:
            f.write(f"\n[SEND_EMAIL] Called for email: {email}\n")
            f.write(f"[SEND_EMAIL] Gmail Email: {gmail_email}\n")
            f.write(f"[SEND_EMAIL] Gmail Password set: {bool(gmail_password)}\n")
            f.write(f"[SEND_EMAIL] Custom email provided: {bool(custom_gmail_email)}\n")
            f.write(f"[SEND_EMAIL] Custom password provided: {bool(custom_gmail_password)}\n")
        
        print(f"[EMAIL] Attempting to send to {email} with gmail: {gmail_email}", file=sys.stdout, flush=True)
        
        # Remove any spaces from password (Gmail app passwords may be pasted with spaces)
        if gmail_password:
            gmail_password = gmail_password.replace(' ', '')
        
        if not gmail_email or not gmail_password:
            msg = "[WARNING] Gmail credentials not configured. Verification code: " + code
            print(msg)
            with open(debug_log_path, 'a') as f:
                f.write(f"[WARNING] {msg}\n")
            return False
        
        # Create message
        message = MIMEMultipart('alternative')
        message['Subject'] = 'Email Verification Code - StudentSystem'
        message['From'] = gmail_email
        message['To'] = email
        
        # HTML email body
        html = f"""\
        <html>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #667eea;">Verify Your Email</h2>
              <p>Welcome to StudentSystem! Your verification code is:</p>
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <h1 style="color: #667eea; letter-spacing: 5px; margin: 0;">{code}</h1>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">© 2026 StudentSystem. All rights reserved.</p>
            </div>
          </body>
        </html>
        """
        
        part = MIMEText(html, 'html')
        message.attach(part)
        
        # Send email via Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_email, gmail_password)
            server.sendmail(gmail_email, email, message.as_string())
        
        print(f"[EMAIL] Verification code {code} sent to {email}")
        with open(debug_log_path, 'a') as f:
            f.write(f"[SUCCESS] Email sent to {email}\n")
        return True
    
    except smtplib.SMTPAuthenticationError as e:
        msg = f"[ERROR] Gmail authentication failed: {str(e)}"
        print(msg)
        with open(debug_log_path, 'a') as f:
            f.write(f"{msg}\n")
        return False
    except Exception as e:
        msg = f"[ERROR] Failed to send email: {str(e)}"
        print(msg)
        with open(debug_log_path, 'a') as f:
            f.write(f"{msg}\n")
        return False
