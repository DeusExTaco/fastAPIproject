# db/init_db.py
import os
import logging
from datetime import datetime, UTC
import bcrypt
import pymysql
from sqlalchemy import inspect, Column, String, DateTime

from db.base import Base
from db.session import (
    engine,
    SessionLocal,
    SQLALCHEMY_DATABASE_URL
)

logger = logging.getLogger(__name__)

# Get database configuration from environment
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")

# Get initial user credentials from environment
INITIAL_USER = os.getenv("INITIAL_USER")
INITIAL_PASSWORD = os.getenv("INITIAL_PASSWORD")

# Define a table to track database initialization
class DBInit(Base):
    __tablename__ = 'db_init'

    id = Column(String(36), primary_key=True)
    initialized_at = Column(DateTime(timezone=True), nullable=False)

def is_database_initialized(session):
    """Check if database has been initialized before"""
    return session.query(DBInit).first() is not None

def mark_database_initialized(session):
    """Mark database as initialized"""
    db_init = DBInit(id='1', initialized_at=datetime.now(UTC))
    session.add(db_init)
    session.commit()

def check_database_exists():
    """Check if the database exists and create it if it doesn't"""
    logger.info("Checking database existence...")
    try:
        # Parse database name from URL
        db_name = SQLALCHEMY_DATABASE_URL.split('/')[-1]

        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=int(MYSQL_PORT),
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        try:
            with connection.cursor() as cursor:
                cursor.execute("SHOW DATABASES")
                databases = [db[0] for db in cursor.fetchall()]

                if db_name in databases:
                    logger.info(f"Database '{db_name}' already exists.")
                    return False
                else:
                    cursor.execute(f"CREATE DATABASE {db_name}")
                    logger.info(f"Database '{db_name}' created successfully!")
                    return True
        finally:
            connection.close()
    except Exception as e:
        logger.error(f"Error checking/creating database: {str(e)}")
        raise


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def get_all_model_tables():
    """Get all model tables from metadata"""
    # Import all models to ensure they're registered with Base.metadata
    from models.user import User  # noqa
    from models.user_profile import UserProfile, UserAddress  # noqa
    from models.user_preferences import UserPreferences  # noqa

    return Base.metadata.tables


def create_initial_admin_user(session):
    """Create initial admin user if it doesn't exist"""
    from models.user import User, UserStatus, UserRole
    from models.user_profile import UserProfile, UserAddress

    try:
        # Check if admin user already exists
        existing_admin = session.query(User).filter(User.user_name == INITIAL_USER).first()
        if existing_admin:
            logger.info("Admin user already exists.")
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
        session.flush()

        # Create associated profile and address
        admin_profile = UserProfile(
            user_id=admin_user.id,
            date_of_birth="",
            gender="prefer_not_to_say",
            phone="",
            avatar_url="",
            bio="System Administrator",
            website="",
            social_media={},
            notification_preferences={"email": True, "push": False, "sms": False},
            privacy_settings={"profile_visibility": "private", "show_email": False, "show_phone": False}
        )

        admin_address = UserAddress(
            user_id=admin_user.id,
            street = "",
            city = "",
            state = "",
            country = "",
            postal_code = ""
        )

        session.add_all([admin_profile, admin_address])
        session.commit()

        logger.info("Initial admin user created successfully.")
        logger.info(f"Default login: {INITIAL_USER}")
        logger.info(f"Default password: {INITIAL_PASSWORD}")

    except Exception as e:
        session.rollback()
        logger.error(f"Error creating admin user: {str(e)}")
        raise


def check_tables_exist():
    """Check which tables exist and which need to be created"""
    model_tables = get_all_model_tables()
    missing_tables = []
    existing_tables = []

    logger.info("Checking tables in metadata:")
    for table_name in model_tables.keys():
        logger.info(f"Found table in metadata: {table_name}")
        if table_exists(table_name):
            existing_tables.append(table_name)
        else:
            missing_tables.append(table_name)

    return existing_tables, missing_tables


def init_db():
    """Initialize database, create tables, and set up initial data"""
    logger.info("Initializing database...")

    try:
        # Check if this is a new database
        is_new_database = check_database_exists()

        # Check existing tables
        existing_tables, missing_tables = check_tables_exist()

        if existing_tables:
            logger.info("Existing tables found: %s", ", ".join(existing_tables))

        if missing_tables:
            logger.info("Creating missing tables: %s", ", ".join(missing_tables))
            # Create only missing tables
            Base.metadata.create_all(
                bind=engine,
                tables=[Base.metadata.tables[table] for table in missing_tables]
            )
            logger.info("Missing tables created successfully.")
        else:
            logger.info("All required tables already exist.")

        # Create initial admin user if needed
        if is_new_database:
            db = SessionLocal()
            try:
                if not is_database_initialized(db):
                    create_initial_admin_user(db)
                    mark_database_initialized(db)
                    logger.info("Database initialization completed successfully.")
            finally:
                db.close()

        logger.info("Database already initialized, skipping admin user creation.")

    except Exception as e:
        logger.error("Error during database initialization: %s", str(e))
        raise


__all__ = ['init_db']