import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from email_service import send_verification_email


# OTP codes storage (in-memory, could be moved to database later)
otp_codes: Dict[str, Dict] = {}  # email -> {code, expires_at, user_id}


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def store_otp(email: str, user_id: int, expiration_minutes: int = 5) -> str:
    """
    Store OTP for a user and return the generated code
    
    Args:
        email: User's email address
        user_id: User's ID
        expiration_minutes: OTP expiration time in minutes (default: 5)
    
    Returns:
        Generated OTP code
    """
    code = generate_otp()
    otp_codes[email] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=expiration_minutes),
        "user_id": user_id
    }
    return code


def send_otp(email: str, user_id: int, expiration_minutes: int = 5) -> Tuple[bool, str]:
    """
    Generate OTP, store it, and send via email
    
    Args:
        email: User's email address
        user_id: User's ID
        expiration_minutes: OTP expiration time in minutes (default: 5)
    
    Returns:
        Tuple of (email_sent: bool, otp_code: str)
    """
    code = store_otp(email, user_id, expiration_minutes)
    email_sent = send_verification_email(email, code)
    return email_sent, code


def verify_otp(email: str, otp_code: str) -> Tuple[bool, str]:
    """
    Verify OTP for a user
    
    Args:
        email: User's email address
        otp_code: OTP code to verify
    
    Returns:
        Tuple of (is_valid: bool, message: str)
    """
    if email not in otp_codes:
        return False, "No OTP sent to this email"
    
    otp_data = otp_codes[email]
    
    # Check if OTP expired
    if datetime.now() > otp_data["expires_at"]:
        del otp_codes[email]
        return False, "OTP expired. Please login again."
    
    # Check if OTP matches
    if otp_data["code"] != otp_code:
        return False, "Invalid OTP"
    
    return True, "OTP verified successfully"


def get_otp_user_id(email: str) -> Optional[int]:
    """
    Get user ID associated with an OTP
    
    Args:
        email: User's email address
    
    Returns:
        User ID if OTP exists, None otherwise
    """
    if email in otp_codes:
        return otp_codes[email].get("user_id")
    return None


def clear_otp(email: str) -> None:
    """
    Clear OTP for a user (after successful verification)
    
    Args:
        email: User's email address
    """
    if email in otp_codes:
        del otp_codes[email]
