import os
from typing import Optional

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWTError
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schema import TokenData

# Load environment variables
load_dotenv()

# Get JWT settings from environment variables
PRIVATE_KEY_PATH = os.getenv("JWT_PRIVATE_KEY_PATH")
PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH")

# Ensure that the necessary environment variables are set
if not PRIVATE_KEY_PATH or not PUBLIC_KEY_PATH:
    raise ValueError("JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH must be set in the .env file")

# Load the RSA keys
with open(PRIVATE_KEY_PATH, "rb") as key_file:
    PRIVATE_KEY = serialization.load_pem_private_key(
        key_file.read(),
        password=None,
        backend=default_backend()
    )

with open(PUBLIC_KEY_PATH, "rb") as key_file:
    PUBLIC_KEY = serialization.load_pem_public_key(
        key_file.read(),
        backend=default_backend()
    )

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.user_name == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def check_admin(user: User):
    if 'ADMIN' not in user.roles.split(','):
        raise HTTPException(status_code=403, detail="Only admins can perform this action")

def create_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, PRIVATE_KEY, algorithm="RS256")
    return encoded_jwt