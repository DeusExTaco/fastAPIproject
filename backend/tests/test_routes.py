import pytest
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from backend.models import Base, User
from backend.schema import UserCreate, UserLogin

# Define the database URL (using SQLite for testing purposes)
SQLALCHEMY_DATABASE_URL = "sqlite:///./new_test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create FastAPI app instance
app = FastAPI()

# Password hashing utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Define the user table creation manually using models.Base
def create_user_table():
    Base.metadata.create_all(bind=engine)


# API route for creating a new user
@app.post("/api/users")
def create_user(user: UserCreate, db=Depends(get_db)):
    hashed_password = hash_password(user.password)
    db.execute(text("""
        INSERT INTO users (first_name, last_name, user_name, email, hashed_password, roles, status)
        VALUES (:first_name, :last_name, :user_name, :email, :hashed_password, :roles, :status)
    """), {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "user_name": user.user_name,
        "email": user.email,
        "hashed_password": hashed_password,
        "roles": ",".join([role.value for role in user.roles]),
        "status": user.status.value
    })
    db.commit()
    return {"msg": "User created"}


@app.post("/api/login")
def login(user_login: UserLogin, db=Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM users WHERE user_name = :username"),
        {"username": user_login.username}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    hashed_password = result[5]  # Assuming hashed_password is at index 5

    if not verify_password(user_login.password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "user_id": result[0],
        "roles": result[6].split(',') if result[6] else []
    }

# Test Client
client = TestClient(app)


# Setup database fixture for each test
@pytest.fixture(scope="function", autouse=True)
def setup_and_teardown_db():
    # Create the user table before each test
    create_user_table()
    yield
    # Drop the table after each test to start fresh
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS users"))


# Fixture to clean up the database file after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_database():
    yield
    # Close all connections
    engine.dispose()
    # Delete the database file
    try:
        os.remove("./new_test.db")
    except FileNotFoundError:
        pass  # File might not exist if no tests created it


# Test for creating a new user
def test_create_user():
    test_data = {
        "first_name": "Test",
        "last_name": "User",
        "user_name": "testuser",
        "email": "testuser@example.com",
        "password": "PasswordTest@@123!",
        "roles": ["user"],  # Referencing the default role
        "status": "pending"
    }

    response = client.post("/api/users", json=test_data)

    assert response.status_code == 200
    assert response.json() == {"msg": "User created"}

    # Verify user creation directly from the database
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM users WHERE user_name=:user_name"),
                              {"user_name": "testuser"}).fetchone()

        # Result is a tuple, so access via index
        assert result is not None
        assert result[1] == "Test"  # first_name
        assert result[2] == "User"  # last_name
        assert result[3] == "testuser"  # user_name
        assert result[4] == "testuser@example.com"  # email


# Test for creating a user with invalid data (e.g., missing fields)
def test_create_user_invalid_data():
    test_data = {
        "first_name": "Test",
        "last_name": "User",
        # Missing user_name, email, and password
        "roles": ["user"],
        "status": "pending"
    }

    response = client.post("/api/users", json=test_data)

    assert response.status_code == 422  # Unprocessable Entity for missing fields


# Test for fetching a non-existent user
def test_fetch_non_existent_user():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM users WHERE user_name=:user_name"),
                              {"user_name": "nonexistentuser"}).fetchone()
        assert result is None


# Test for updating a user
def test_update_user():
    test_data = {
        "first_name": "Test",
        "last_name": "User",
        "user_name": "testuser",
        "email": "testuser@example.com",
        "password": "PasswordTest@@123!",
        "roles": ["user"],
        "status": "pending"
    }

    # Create a user first
    response = client.post("/api/users", json=test_data)
    assert response.status_code == 200

    # Update the user's email
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET email=:email WHERE user_name=:user_name"), {
            "email": "updatedemail@example.com",
            "user_name": "testuser"
        })
        conn.commit()  # Commit the transaction to ensure the update is applied

    # Verify the update
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email FROM users WHERE user_name=:user_name"),
                              {"user_name": "testuser"}).fetchone()
        assert result[0] == "updatedemail@example.com"


# Test for deleting a user
def test_delete_user():
    test_data = {
        "first_name": "Test",
        "last_name": "User",
        "user_name": "testuser",
        "email": "testuser@example.com",
        "password": "PasswordTest@@123!",
        "roles": ["user"],
        "status": "pending"
    }

    # Create a user first
    response = client.post("/api/users", json=test_data)
    assert response.status_code == 200

    # Delete the user
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM users WHERE user_name=:user_name"), {"user_name": "testuser"})
        conn.commit()  # Commit the transaction to ensure the user is deleted

    # Verify deletion
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM users WHERE user_name=:user_name"),
                              {"user_name": "testuser"}).fetchone()
        assert result is None


def test_user_login():
    # First, create a test user
    test_data = {
        "first_name": "Test",
        "last_name": "User",
        "user_name": "loginuser",
        "email": "loginuser@example.com",
        "password": "PasswordLogin@@123!",
        "roles": ["user"],
        "status": "pending"
    }
    response = client.post("/api/users", json=test_data)
    assert response.status_code == 200

    # Test login with valid credentials
    login_data = {
        "username": "loginuser",
        "password": "PasswordLogin@@123!"
    }
    response = client.post("/api/login", json=login_data)

    assert response.status_code == 200
    assert "message" in response.json()
    assert "user_id" in response.json()
    assert "roles" in response.json()

    # Test login with invalid credentials
    invalid_login_data = {
        "username": "loginuser",
        "password": "WrongPassword@@123!"
    }
    response = client.post("/api/login", json=invalid_login_data)

    assert response.status_code == 401