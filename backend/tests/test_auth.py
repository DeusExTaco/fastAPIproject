import pytest
from fastapi import HTTPException
from unittest.mock import patch, MagicMock, ANY
from auth import get_current_user, check_admin, create_token
from models import User
from jwt import PyJWTError


# Mock user data for testing
@pytest.fixture
def mock_user():
    return User(
        id=1,
        first_name="John",
        last_name="Doe",
        user_name="johndoe",
        email="john.doe@example.com",
        hashed_password="hashedpassword",
        roles="user,ADMIN"
    )


def test_get_current_user_success(mock_user):
    token = "test_token"

    with patch("auth.jwt.decode") as mock_decode, \
            patch("auth.get_db") as mock_get_db:
        mock_decode.return_value = {"sub": "johndoe"}  # Mocking the decoded token
        mock_db = MagicMock()  # Create a mock database session
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user  # Mock user return
        mock_get_db.return_value = mock_db  # Set the mock db to the get_db call

        # Call get_current_user directly with the mocked database session
        user = get_current_user(token, db=mock_db)

        assert user.user_name == "johndoe"
        mock_decode.assert_called_once_with(token, ANY, algorithms=["RS256"])
        mock_db.query.assert_called_once_with(User)


def test_get_current_user_invalid_token():
    token = "invalid_token"

    # Mock the decode function to raise a PyJWTError
    with patch("auth.jwt.decode", side_effect=PyJWTError("JWT decode error")), \
            patch("auth.get_db") as mock_get_db:
        mock_get_db.return_value = MagicMock()  # Mocking the database session

        # Check if an HTTPException is raised with correct status and detail
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token)

        # Assert that the raised exception has the correct status code and message
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail


def test_check_admin_success(mock_user):
    check_admin(mock_user)  # Should not raise an exception


def test_check_admin_failure():
    user = User(id=1, user_name="johndoe", roles="user")  # No admin role

    with pytest.raises(HTTPException) as exc_info:
        check_admin(user)

    assert exc_info.value.status_code == 403
    assert "Only admins can perform this action" in exc_info.value.detail


def test_create_token():
    data = {"sub": "johndoe"}

    with patch("auth.jwt.encode") as mock_encode:
        mock_encode.return_value = "encoded_jwt"

        token = create_token(data)

        assert token == "encoded_jwt"
        mock_encode.assert_called_once_with(data, ANY, algorithm="RS256")
