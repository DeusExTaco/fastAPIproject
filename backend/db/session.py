# db/session.py
import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure SQLAlchemy logging
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
    logging.getLogger(logger_name).propagate = False
    logging.getLogger(logger_name).handlers = []

# Load environment variables
load_dotenv()

# Database configuration
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")

# URLs
BASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}"
SQLALCHEMY_DATABASE_URL = f"{BASE_URL}/{MYSQL_DATABASE}"

# Create engine and session factory
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Export everything needed by other modules
__all__ = [
    'engine',
    'SessionLocal',
    'get_db',
    'SQLALCHEMY_DATABASE_URL',
    'MYSQL_HOST',
    'MYSQL_PORT',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE'
]