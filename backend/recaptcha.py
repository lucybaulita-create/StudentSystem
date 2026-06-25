import requests
from typing import Tuple
from os import getenv

# reCAPTCHA v2 Configuration
RECAPTCHA_SECRET_KEY = getenv("RECAPTCHA_SECRET_KEY", "your-recaptcha-secret-key-here")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


def verify_recaptcha(recaptcha_token: str) -> Tuple[bool, str]:
    """
    Verify reCAPTCHA v2 response token with Google's API
    
    Args:
        recaptcha_token: The g-recaptcha-response token from the frontend
    
    Returns:
        Tuple of (is_valid: bool, message: str)
    """
    if not recaptcha_token:
        return False, "reCAPTCHA token is missing"
    
    # Allow "test" token for testing
    if recaptcha_token == "test":
        return True, "reCAPTCHA test token accepted"
    
    if not RECAPTCHA_SECRET_KEY or RECAPTCHA_SECRET_KEY == "your-recaptcha-secret-key-here":
        print("[WARNING] reCAPTCHA secret key not configured. Skipping verification for development.")
        print(f"[WARNING] Received token: {recaptcha_token[:20]}... (truncated)")
        return True, "reCAPTCHA verification skipped (not configured for development)"
    
    try:
        # Send verification request to Google
        response = requests.post(
            RECAPTCHA_VERIFY_URL,
            data={
                "secret": RECAPTCHA_SECRET_KEY,
                "response": recaptcha_token
            },
            timeout=5
        )
        
        response.raise_for_status()
        result = response.json()
        
        # Check if verification was successful
        if result.get("success"):
            score = result.get("score", 0)
            action = result.get("action", "")
            challenge_ts = result.get("challenge_ts", "")
            
            print(f"[reCAPTCHA] Verification successful - Score: {score}, Action: {action}, Time: {challenge_ts}")
            return True, f"reCAPTCHA verified successfully"
        else:
            error_codes = result.get("error-codes", [])
            error_message = ", ".join(error_codes) if error_codes else "Unknown error"
            print(f"[reCAPTCHA] Verification failed - Errors: {error_message}")
            return False, f"reCAPTCHA verification failed: {error_message}"
    
    except requests.exceptions.Timeout:
        print("[ERROR] reCAPTCHA verification timeout")
        return False, "reCAPTCHA verification timeout"
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] reCAPTCHA verification error: {str(e)}")
        return False, f"reCAPTCHA verification error: {str(e)}"
    except Exception as e:
        print(f"[ERROR] Unexpected error during reCAPTCHA verification: {str(e)}")
        return False, f"Unexpected error: {str(e)}"


def is_recaptcha_configured() -> bool:
    """
    Check if reCAPTCHA is properly configured
    
    Returns:
        True if secret key is configured, False otherwise
    """
    return (
        RECAPTCHA_SECRET_KEY 
        and RECAPTCHA_SECRET_KEY != "your-recaptcha-secret-key-here"
    )
