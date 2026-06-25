import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# PostgreSQL Users Database Configuration
USERS_DATABASE_URL = os.getenv("USERS_DATABASE_URL", "postgresql://users_user:users_password@127.0.0.1:5432/users_db")

# Create engine for users database
users_engine = create_engine(USERS_DATABASE_URL)

# Create session factory
UsersSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=users_engine)

# Base class for models
UsersBase = declarative_base()


# Database Model
class User(UsersBase):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False, index=True)
    role = Column(String(50), default='student', index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# Create all tables (with error handling)
try:
    UsersBase.metadata.create_all(bind=users_engine)
    print("✓ Database tables created/verified successfully")
except Exception as e:
    print(f"⚠ Warning: Could not create tables: {e}")
    print("  Tables may have been created already or connection may be unavailable")


# Dependency to get users database session
def get_users_db():
    db = UsersSessionLocal()
    try:
        yield db
    finally:
        db.close()
