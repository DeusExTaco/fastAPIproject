# database.py
import os
import logging
from datetime import datetime, UTC

import bcrypt
import pymysql
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, Column, String, DateTime, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configure SQLAlchemy logging - must be done before any SQLAlchemy imports or operations
for logger_name in [
    'sqlalchemy.engine',
    'sqlalchemy.orm',
    'sqlalchemy.pool',
    'sqlalchemy.dialects',
    'sqlalchemy.orm.mapper',
    'sqlalchemy.orm.relationships',
    'sqlalchemy.orm.strategies',
    'sqlalchemy.engine.base.Engine'
]:
    logging.getLogger(logger_name).setLevel(logging.WARNING)
    # Prevent propagation to root logger to avoid duplicate logs
    logging.getLogger(logger_name).propagate = False
    # Remove any existing handlers
    logging.getLogger(logger_name).handlers = []

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


# Define a table to track database initialization
class DBInit(Base):
    __tablename__ = 'db_init'

    id = Column(String(36), primary_key=True)
    initialized_at = Column(DateTime(timezone=True), nullable=False)


def table_exists(engine1, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine1)
    return table_name in inspector.get_table_names()


# noinspection PyUnresolvedReferences
def get_all_model_tables():
    # Import all models to ensure they're registered with Base.metadata
    from models.user import User
    from models.user_profile import UserProfile, UserAddress
    from models.user_preferences import UserPreferences

    return Base.metadata.tables


def create_initial_admin_user(session):
    # Import here to avoid circular imports
    from models.user import User, UserStatus, UserRole
    from models.user_profile import UserProfile, UserAddress

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
        session.flush()  # Flush to get the admin_user.id

        # Create associated user profile
        admin_profile = UserProfile(
            user_id=admin_user.id,
            date_of_birth=None,
            gender="prefer_not_to_say",
            phone=None,
            avatar_url=None,
            bio="System Administrator",
            website=None,
            social_media={},
            notification_preferences={
                "email": True,
                "push": False,
                "sms": False
            },
            privacy_settings={
                "profile_visibility": "private",
                "show_email": False,
                "show_phone": False
            }
        )
        session.add(admin_profile)

        # Create default address
        admin_address = UserAddress(
            user_id=admin_user.id,
            street=None,
            city=None,
            state=None,
            country=None,
            postal_code=None
        )
        session.add(admin_address)

        session.commit()
        print("Initial admin user created successfully with profile and address.")
        print(f"Default login: {INITIAL_USER}")
        print(f"Default password: {INITIAL_PASSWORD}")
    except Exception as e:
        session.rollback()
        print(f"Error creating admin user: {e}")
        raise


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
    print("Checking database existence...")
    connection = pymysql.connect(
        host=MYSQL_HOST,
        port=int(MYSQL_PORT),
        user=MYSQL_USER,
        password=MYSQL_PASSWORD
    )
    try:
        with connection.cursor() as cursor:
            # Check if database exists
            cursor.execute("SHOW DATABASES")
            databases = [db[0] for db in cursor.fetchall()]

            if MYSQL_DATABASE in databases:
                print(f"\n{'=' * 50}")
                print(f"Database '{MYSQL_DATABASE}' already exists.")
                print(f"{'=' * 50}\n")
                return False
            else:
                # Create database if it doesn't exist
                cursor.execute(f"CREATE DATABASE {MYSQL_DATABASE}")
                print(f"\n{'=' * 50}")
                print(f"Database '{MYSQL_DATABASE}' created successfully!")
                print(f"{'=' * 50}\n")
                return True
    finally:
        connection.close()


def check_tables_exist():
    """Check if all required tables exist in the database"""
    model_tables = get_all_model_tables()
    missing_tables = []
    existing_tables = []

    print("\nChecking tables in metadata:")
    for table_name in model_tables.keys():
        print(f"Found table in metadata: {table_name}")
        if table_exists(engine, table_name):
            existing_tables.append(table_name)
        else:
            missing_tables.append(table_name)

    return existing_tables, missing_tables


# Check database existence first
is_new_database = check_database_exists()

# Create engine with the database URL
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False  # Disable SQL echoing
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import all models to ensure they're registered with Base.metadata
from models.user import User  # noqa
from models.user_profile import UserProfile, UserAddress  # noqa
from models.user_preferences import UserPreferences # noqa

__all__ = ['Base', 'engine', 'SessionLocal', 'get_db', 'init_db']


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    print("Initializing database...")

    try:
        # Check existing tables
        existing_tables, missing_tables = check_tables_exist()

        if existing_tables:
            print("\nExisting tables found:")
            for table in existing_tables:
                print(f"  - {table}")

        if missing_tables:
            print("\nCreating missing tables:")
            for table in missing_tables:
                print(f"  - {table}")
            # Create only missing tables
            Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables[table] for table in missing_tables])
            print("Missing tables created successfully.")
        else:
            print("\nAll required tables already exist. Skipping table creation.")

        # Create initial admin user only if this is a new database
        db = SessionLocal()
        try:
            if is_new_database or not is_database_initialized(db):
                create_initial_admin_user(db)
                mark_database_initialized(db)
                print("\nDatabase initialization completed successfully.")
            else:
                print("\nDatabase already initialized, skipping admin user creation.")
        finally:
            db.close()

    except Exception as e:
        print(f"Error during database initialization: {e}")
        raise