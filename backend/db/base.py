# db/base.py
from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

# Create a shared metadata instance
metadata = MetaData()

# Create the Base instance with the shared metadata
Base = declarative_base(metadata=metadata)