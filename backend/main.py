# Load environment variables FIRST, before any other imports
from dotenv import load_dotenv
load_dotenv()

import time
import random
import string
from datetime import datetime, timedelta
from typing import Optional
from os import getenv
import jwt
import bcrypt
from functools import wraps

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlalchemy import func
from sqlalchemy.orm import Session
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel, field_validator

from email_service import generate_verification_code, send_verification_email
from database import engine, Base, get_db, StudentDB, UserDB, UserRole
from otp import send_otp, verify_otp, get_otp_user_id, clear_otp
from recaptcha import verify_recaptcha, is_recaptcha_configured

# JWT Configuration
SECRET_KEY = getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
ADMIN_SECRET = getenv("ADMIN_SECRET", "admin-secret-key")  # Secret key to create admin accounts

security = HTTPBearer()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus Metrics
http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint', 'status']
)

http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

students_total = Gauge(
    'students_total',
    'Total number of students'
)

student_operations = Counter(
    'student_operations_total',
    'Total student operations',
    ['operation', 'status']
)

# Student model
class Student(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    student_id: str
    program: str
    year: int
    gpa: Optional[float] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# User model
class User(BaseModel):
    id: Optional[int] = None
    first_name: str
    last_name: str
    email: str
    password: str
    is_verified: bool = False
    role: str = "student"
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# Signup request model
class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str = "student"  # admin, registrar, or student
    gmail_email: Optional[str] = None
    gmail_password: Optional[str] = None
    recaptcha_token: str  # reCAPTCHA v2 token
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# Email verification request model
class VerifyEmailRequest(BaseModel):
    email: str
    code: str
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# Resend verification code request model
class ResendVerificationRequest(BaseModel):
    email: str
    gmail_email: Optional[str] = None
    gmail_password: Optional[str] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# Login request model
class LoginRequest(BaseModel):
    email: str
    password: str
    recaptcha_token: str  # reCAPTCHA v2 token
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# OTP verification request model
class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# Admin signup request model
class AdminSignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str = "registrar"  # admin or registrar
    admin_secret: str  # Secret key to create admin accounts
    recaptcha_token: str  # reCAPTCHA v2 token
    
    @field_validator('email', mode='before')
    @classmethod
    def accept_any_email(cls, v):
        """Accept any email format without validation"""
        return str(v).strip() if v else v

# Sample database (replace with real database later)
# NOW USING SQLITE DATABASE instead of in-memory lists

# Verification codes storage (in-memory, could be moved to database later)
verification_codes: dict[str, dict] = {}  # email -> {code, expires_at}


# Password hashing functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


# JWT Helper Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "role": role, "user_id": user_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current user from token"""
    token = credentials.credentials
    return verify_token(token)


def require_role(*allowed_roles: str):
    """Dependency factory to require specific roles"""
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker


# Helper functions
def get_user_by_email(email: str, db: Session) -> UserDB | None:
    """Get user by email from database"""
    return db.query(UserDB).filter(func.lower(UserDB.email) == email.lower()).first()

# Middleware to track request metrics
@app.middleware("http")
async def track_metrics(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    endpoint = request.url.path
    method = request.method
    status = response.status_code
    
    http_request_duration.labels(method=method, endpoint=endpoint, status=status).observe(process_time)
    http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
    
    return response

# Prometheus metrics endpoint
@app.get("/metrics")
def metrics(db: Session = Depends(get_db)):
    students_total.set(db.query(StudentDB).count())
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
def home():
    return {"message": "Backend working"}

# Auth endpoints
@app.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Verify reCAPTCHA
        is_valid, recaptcha_message = verify_recaptcha(request.recaptcha_token)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"reCAPTCHA verification failed: {recaptcha_message}")
        
        # Validate role
        valid_roles = ["admin", "registrar", "student"]
        if request.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        # Check if user already exists
        if get_user_by_email(request.email, db):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Generate verification code first
        code = generate_verification_code()
        
        # DEBUG: Log before sending email
        print(f"[SIGNUP] About to send verification email to {request.email}")
        print(f"[SIGNUP] Custom gmail_email: {request.gmail_email}")
        print(f"[SIGNUP] Custom gmail_password: {bool(request.gmail_password)}")
        
        # Try to send verification email. In local Docker development, SMTP may
        # be intentionally unconfigured, so signup still proceeds and returns
        # the code in the response.
        email_sent = send_verification_email(request.email, code, request.gmail_email, request.gmail_password)
        
        print(f"[SIGNUP] Email sent result: {email_sent}")
        
        # Map string role to UserRole enum value
        role_map = {
            "admin": UserRole.ADMIN.value,
            "registrar": UserRole.REGISTRAR.value,
            "student": UserRole.STUDENT.value
        }
        
        user = UserDB(
            first_name=request.first_name,
            last_name=request.last_name,
            email=request.email,
            password=hash_password(request.password),  # Hash password using bcrypt
            is_verified=False,
            role=role_map[request.role]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Store verification code
        verification_codes[request.email] = {
            "code": code,
            "expires_at": datetime.now() + timedelta(minutes=10)
        }
        
        response = {
            "message": "User created successfully. Verification code sent to email.",
            "user_id": user.id,
            "role": user.role,
            "email_sent": email_sent
        }
        # Only include code in response if email failed (for development/debugging)
        if not email_sent:
            response["verification_code"] = code
            response["message"] = "User created. Email service not available, use code shown here for verification."
        return response
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify email with code"""
    try:
        # Check if verification code exists and is valid
        if request.email not in verification_codes:
            raise HTTPException(status_code=400, detail="No verification code sent to this email")
        
        code_data = verification_codes[request.email]
        
        # Check if code expired
        if datetime.now() > code_data["expires_at"]:
            del verification_codes[request.email]
            raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")
        
        # Check if code matches
        if code_data["code"] != request.code:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Mark user as verified in database
        user = get_user_by_email(request.email, db)
        if user:
            user.is_verified = True
            db.commit()
            del verification_codes[request.email]
            return {"message": "Email verified successfully!"}
        
        raise HTTPException(status_code=400, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/resend-verification-code")
def resend_verification_code(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resend verification code to email"""
    try:
        user = get_user_by_email(request.email, db)
        
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        if user.is_verified:
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Generate new code
        code = generate_verification_code()
        verification_codes[request.email] = {
            "code": code,
            "expires_at": datetime.now() + timedelta(minutes=10)
        }
        
        email_sent = send_verification_email(request.email, code, request.gmail_email, request.gmail_password)
        
        response = {
            "message": "Verification code sent to email"
            if email_sent
            else "Email is not configured, so use the verification code shown here.",
            "email_sent": email_sent,
        }
        if not email_sent:
            response["verification_code"] = code
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user - Initiates OTP flow"""
    try:
        # Verify reCAPTCHA
        is_valid, recaptcha_message = verify_recaptcha(request.recaptcha_token)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"reCAPTCHA verification failed: {recaptcha_message}")
        
        user = get_user_by_email(request.email, db)
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        # Verify password hash using bcrypt
        if not verify_password(request.password, user.password):
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        if not user.is_verified:
            raise HTTPException(status_code=400, detail="Email not verified. Please verify your email.")
        
        # Generate and send OTP using otp module
        email_sent, otp_code = send_otp(request.email, user.id, expiration_minutes=5)
        
        return {
            "message": "OTP sent to your email. Please verify to complete login.",
            "user_id": user.id,
            "email": user.email,
            "otp_sent": email_sent,
            "otp": otp_code if not email_sent else None  # Return OTP only if email failed (for testing)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/verify-otp")
def verify_otp_endpoint(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and issue JWT token"""
    try:
        # Verify OTP using otp module
        is_valid, message = verify_otp(request.email, request.otp)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Get user from database
        user = get_user_by_email(request.email, db)
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        # Clean up OTP
        clear_otp(request.email)
        
        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": user.role,
                "user_id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            expires_delta=access_token_expires
        )
        
        return {
            "message": "Login successful",
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/admin-signup")
def admin_signup(request: AdminSignupRequest, db: Session = Depends(get_db)):
    """Register a new admin or registrar account - Requires admin secret"""
    try:
        # Verify admin secret
        if request.admin_secret != ADMIN_SECRET:
            raise HTTPException(status_code=403, detail="Invalid admin secret key")
        
        # Verify reCAPTCHA
        is_valid, recaptcha_message = verify_recaptcha(request.recaptcha_token)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"reCAPTCHA verification failed: {recaptcha_message}")
        
        # Validate role
        valid_roles = ["admin", "registrar"]
        if request.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        # Check if user already exists
        if get_user_by_email(request.email, db):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Map string role to UserRole enum value
        role_map = {
            "admin": UserRole.ADMIN.value,
            "registrar": UserRole.REGISTRAR.value,
        }
        
        # Create admin/registrar user (auto-verified)
        user = UserDB(
            first_name=request.first_name,
            last_name=request.last_name,
            email=request.email,
            password=hash_password(request.password),  # Hash password using bcrypt
            is_verified=True,  # Admin accounts are auto-verified
            role=role_map[request.role]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "message": f"{request.role.capitalize()} account created successfully!",
            "user_id": user.id,
            "role": user.role,
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Student endpoints
@app.get("/student")
def get_students(current_user: dict = Depends(require_role("admin", "registrar")), db: Session = Depends(get_db)):
    """Get all students - Only admin and registrar"""
    students = db.query(StudentDB).all()
    student_operations.labels(operation="get_all", status="success").inc()
    return {"students": students, "count": len(students), "accessed_by": current_user["email"]}

@app.get("/student/{student_id}")
def get_student(student_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific student by ID - Any authenticated user"""
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student:
        student_operations.labels(operation="get_single", status="success").inc()
        return student
    student_operations.labels(operation="get_single", status="not_found").inc()
    return {"error": "Student not found"}

@app.post("/student")
def create_student(student: Student, current_user: dict = Depends(require_role("admin", "registrar")), db: Session = Depends(get_db)):
    """Create a new student - Only admin and registrar"""
    try:
        db_student = StudentDB(
            name=student.name,
            email=student.email,
            student_id=student.student_id,
            program=student.program,
            year=student.year,
            gpa=student.gpa
        )
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        student_operations.labels(operation="create", status="success").inc()
        return {"message": "Student created", "student": db_student, "created_by": current_user["email"]}
    except Exception as e:
        db.rollback()
        student_operations.labels(operation="create", status="error").inc()
        return {"error": str(e)}

@app.put("/student/{student_id}")
def update_student(student_id: int, student: Student, current_user: dict = Depends(require_role("admin", "registrar")), db: Session = Depends(get_db)):
    """Update a student - Only admin and registrar"""
    try:
        db_student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
        if db_student:
            db_student.name = student.name
            db_student.email = student.email
            db_student.student_id = student.student_id
            db_student.program = student.program
            db_student.year = student.year
            db_student.gpa = student.gpa
            db.commit()
            db.refresh(db_student)
            student_operations.labels(operation="update", status="success").inc()
            return {"message": "Student updated", "student": db_student, "updated_by": current_user["email"]}
        student_operations.labels(operation="update", status="not_found").inc()
        return {"error": "Student not found"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.delete("/student/{student_id}")
def delete_student(student_id: int, current_user: dict = Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Delete a student - Only admin"""
    try:
        db_student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
        if db_student:
            db.delete(db_student)
            db.commit()
            student_operations.labels(operation="delete", status="success").inc()
            return {"message": "Student deleted", "student": db_student, "deleted_by": current_user["email"]}
        student_operations.labels(operation="delete", status="not_found").inc()
        return {"error": "Student not found"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
