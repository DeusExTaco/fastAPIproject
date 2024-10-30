import os
import bcrypt
from datetime import datetime, UTC

import pymysql
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")

# Get initial user credentials
INITIAL_USER = os.getenv("INITIAL_USER")
INITIAL_PASSWORD = os.getenv("INITIAL_PASSWORD")

# URL without database name
BASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}"

# URL with database name
SQLALCHEMY_DATABASE_URL = f"{BASE_URL}/{MYSQL_DATABASE}"

# Create a shared metadata instance
metadata = MetaData()

# Create the Base instance with the shared metadata
Base = declarative_base(metadata=metadata)


def create_initial_admin_user(session):
    # Import here to avoid circular imports
    from models import User, UserStatus, UserRole

    try:
        # Check if admin user already exists
        existing_admin = session.query(User).filter(User.user_name == INITIAL_USER).first()
        if existing_admin:
            print("Admin user already exists.")
            return

        # Hash the password
        password_bytes = INITIAL_PASSWORD.encode('utf-8')
        hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt())

        # Create admin user
        admin_user = User(
            first_name="Admin",
            last_name="User",
            user_name=INITIAL_USER,
            email="admin@example.com",
            hashed_password=hashed_password.decode('utf-8'),
            status=UserStatus.ACTIVE,
            roles=UserRole.ADMIN.value,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )

        session.add(admin_user)
        session.commit()
        print("Initial admin user created successfully.")
        print(f"Default login: {INITIAL_USER}")
        print(f"Default password: {INITIAL_PASSWORD}")
    except Exception as e:
        session.rollback()
        print(f"Error creating admin user: {e}")
        raise


def create_database_if_not_exists():
    print("Checking database existence...")
    connection = pymysql.connect(
        host=MYSQL_HOST,
        port=int(MYSQL_PORT),
        user=MYSQL_USER,
        password=MYSQL_PASSWORD
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE}")
        print(f"Database '{MYSQL_DATABASE}' created or already exists.")
    finally:
        connection.close()


# Create database first
create_database_if_not_exists()

# Then create engine with the database URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    print("Initializing database...")

    # Import models to ensure they're registered with Base
    from models import User
    import models  # Import all models

    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")

        # Create initial admin user
        db = SessionLocal()
        try:
            create_initial_admin_user(db)
        finally:
            db.close()

        print("Database initialization completed successfully.")
    except Exception as e:
        print(f"Error during database initialization: {e}")
        raise