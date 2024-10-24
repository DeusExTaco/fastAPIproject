import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, clear_mappers
from backend.models import Base, metadata

# # fastApiProject2/conftest.py
# import os
# import sys
#
# # Add the project root directory to Python path
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

import os
import sys
from pathlib import Path

# Get the project root directory
project_root = str(Path(__file__).parent)

# Add the project root to the Python path
sys.path.insert(0, project_root)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_engine():
    """Creates a new database engine for each test."""
    engine = create_engine('sqlite:///:memory:', echo=True)
    metadata.create_all(engine)
    yield engine
    metadata.drop_all(engine)
    clear_mappers()

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Creates a new database session for each test."""
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()