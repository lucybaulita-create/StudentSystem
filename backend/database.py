import os

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from enum import Enum as PyEnum

# Role enumeration
class UserRole(PyEnum):
    ADMIN = "admin"
    REGISTRAR = "registrar"
    STUDENT = "student"

# Database URL (SQLite for local, PostgreSQL for Docker)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./student_system.db")

# Create engine with SQLite-specific settings
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Database Models
class StudentDB(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    student_id = Column(String, unique=True, index=True)
    program = Column(String)
    year = Column(Integer)
    gpa = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    is_verified = Column(Boolean, default=False)
    role = Column(String, default=UserRole.STUDENT.value)  # Store as string for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)


# Create all tables
Base.metadata.create_all(bind=engine)


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
