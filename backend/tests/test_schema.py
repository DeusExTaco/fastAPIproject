import pytest
from pydantic import ValidationError
from fastapi import HTTPException
from datetime import datetime

# Import directly from app package
from ..schema import (
    UserBase, UserCreate, UserResponse, UserLogin, ChangePasswordRequest,
    TokenData, UserUpdate, PasswordRecoveryRequest, ResetPasswordRequest
)
from ..models import UserStatus, UserRole

# Test Setup
@pytest.fixture
def valid_user_data():
    return {
        "first_name": "John",
        "last_name": "Doe",
        "user_name": "johndoe",
        "email": "john@example.com"
    }

@pytest.fixture
def valid_password():
    return "SecurePassword123!@#"


# Test Classes
class TestUserBase:
    def test_valid_user_base(self, valid_user_data):
        """Test valid UserBase creation"""
        user = UserBase(**valid_user_data)
        assert user.first_name == valid_user_data["first_name"]
        assert user.last_name == valid_user_data["last_name"]
        assert user.user_name == valid_user_data["user_name"]
        assert user.email == valid_user_data["email"]

    def test_invalid_email(self, valid_user_data):
        """Test invalid email validation"""
        invalid_data = valid_user_data.copy()
        invalid_data["email"] = "invalid-email"
        with pytest.raises(ValidationError):
            UserBase(**invalid_data)

    def test_field_length_validation(self, valid_user_data):
        """Test field length validation"""
        # Test too long fields
        invalid_data = valid_user_data.copy()
        invalid_data["first_name"] = "A" * 51
        with pytest.raises(ValidationError):
            UserBase(**invalid_data)

        # Test empty fields
        invalid_data = valid_user_data.copy()
        invalid_data["first_name"] = ""
        with pytest.raises(ValidationError):
            UserBase(**invalid_data)


class TestUserCreate:
    def test_valid_user_create(self, valid_user_data, valid_password):
        """Test valid UserCreate object creation"""
        user_data = valid_user_data.copy()
        user_data["password"] = valid_password
        user = UserCreate(**user_data)
        assert [role.value for role in user.roles] == [UserRole.USER.value]
        assert user.status.value == UserStatus.PENDING.value

    def test_password_validation(self, valid_user_data):
        """Test password validation rules"""
        invalid_passwords = [
            ("short123!A", "Password must be at least 16 characters long."),
            ("nouppercase123!@#", "Password must contain at least one uppercase letter."),
            ("NOLOWERCASE123!@#", "Password must contain at least one lowercase letter."),
            ("NoNumbersHere!@#", "Password must contain at least one number."),
            ("NoSpecialChars123", "Password must contain at least one special character.")
        ]

        for password, expected_error in invalid_passwords:
            user_data = valid_user_data.copy()
            user_data["password"] = password
            with pytest.raises(HTTPException) as exc_info:
                UserCreate(**user_data)
            assert any(error["msg"] == expected_error for error in exc_info.value.detail)

    def test_custom_roles_and_status(self, valid_user_data, valid_password):
        """Test custom roles and status assignment"""
        user_data = valid_user_data.copy()
        user_data.update({
            "password": valid_password,
            "roles": [UserRole.ADMIN.value],
            "status": UserStatus.ACTIVE.value
        })
        user = UserCreate(**user_data)
        assert [role.value for role in user.roles] == [UserRole.ADMIN.value]
        assert user.status.value == UserStatus.ACTIVE.value


class TestUserLogin:
    def test_user_login(self):
        """Test UserLogin validation"""
        login = UserLogin(username="johndoe", password="password123")
        assert login.username == "johndoe"
        assert login.password == "password123"


class TestChangePasswordRequest:
    def test_valid_password_change(self, valid_password):
        """Test valid password change request"""
        request = ChangePasswordRequest(
            user_id=1,
            current_password="OldPassword123!@#",
            new_password=valid_password
        )
        assert request.user_id == 1
        assert request.current_password == "OldPassword123!@#"
        assert request.new_password == valid_password

    def test_new_password_validation(self):
        """Test new password validation rules"""
        invalid_passwords = [
            ("short123!A", "Password must be at least 16 characters long."),
            ("nouppercase123!@#", "Password must contain at least one uppercase letter."),
            ("NOLOWERCASE123!@#", "Password must contain at least one lowercase letter."),
            ("NoNumbersHere!@#", "Password must contain at least one number."),
            ("NoSpecialChars123", "Password must contain at least one special character.")
        ]

        for password, expected_error in invalid_passwords:
            with pytest.raises(HTTPException) as exc_info:
                ChangePasswordRequest(
                    user_id=1,
                    current_password="OldPassword123!@#",
                    new_password=password
                )
            assert any(error["msg"] == expected_error for error in exc_info.value.detail)


class TestTokenData:
    def test_token_data(self):
        """Test TokenData with and without username"""
        token_with_username = TokenData(username="johndoe")
        assert token_with_username.username == "johndoe"

        token_without_username = TokenData()
        assert token_without_username.username is None


class TestUserUpdate:
    def test_partial_update(self):
        """Test partial user update"""
        update = UserUpdate(first_name="Jane")
        assert update.first_name == "Jane"
        assert update.last_name is None
        assert update.email is None
        assert update.status is None
        assert update.roles is None

    def test_full_update(self):
        """Test full user update"""
        update = UserUpdate(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            status=UserStatus.ACTIVE.value,  # Use .value to get the string
            roles=[UserRole.ADMIN.value]     # Use .value to get the string
        )
        assert update.first_name == "Jane"
        assert update.last_name == "Doe"
        assert update.email == "jane@example.com"
        assert update.status == UserStatus.ACTIVE.value
        assert update.roles == [UserRole.ADMIN.value]

    def test_invalid_update(self):
        """Test invalid update data"""
        # Test empty string
        with pytest.raises(ValidationError):
            UserUpdate(first_name="")

        # Test invalid email
        with pytest.raises(ValidationError):
            UserUpdate(email="invalid-email")

        # Test invalid status
        with pytest.raises(ValidationError):
            UserUpdate(status="invalid_status")

        # Test invalid role
        with pytest.raises(ValidationError):
            UserUpdate(roles=["invalid_role"])

    def test_multiple_roles_update(self):
        """Test update with multiple roles"""
        update = UserUpdate(
            roles=[UserRole.ADMIN.value, UserRole.USER.value]
        )
        assert update.roles == [UserRole.ADMIN.value, UserRole.USER.value]

class TestUserResponse:
    def test_user_response(self, valid_user_data):
        """Test UserResponse creation"""
        now = datetime.now()
        response_data = valid_user_data.copy()
        response_data.update({
            "id": 1,
            "status": UserStatus.ACTIVE.value,
            "roles": [UserRole.USER.value],
            "created_at": now,
            "updated_at": now
        })
        response = UserResponse(**response_data)
        assert response.id == 1
        assert response.status.value == UserStatus.ACTIVE.value
        assert [role.value for role in response.roles] == [UserRole.USER.value]
        assert response.created_at == now
        assert response.updated_at == now


class TestPasswordRecoveryRequest:
    def test_password_recovery(self):
        """Test password recovery request"""
        recovery = PasswordRecoveryRequest(email="john@example.com")
        assert recovery.email == "john@example.com"

    def test_invalid_email(self):
        """Test invalid email validation"""
        with pytest.raises(ValidationError):
            PasswordRecoveryRequest(email="invalid-email")


class TestResetPasswordRequest:
    def test_valid_reset_request(self, valid_password):
        """Test valid password reset request"""
        reset = ResetPasswordRequest(
            token="valid-token",
            new_password=valid_password
        )
        assert reset.token == "valid-token"
        assert reset.new_password == valid_password

    def test_password_validation(self):
        """Test password validation rules"""
        invalid_passwords = [
            ("short123!A", "Password must be at least 16 characters long."),
            ("nouppercase123!@#", "Password must contain at least one uppercase letter."),
            ("NOLOWERCASE123!@#", "Password must contain at least one lowercase letter."),
            ("NoNumbersHere!@#", "Password must contain at least one number."),
            ("NoSpecialChars123", "Password must contain at least one special character.")
        ]

        for password, expected_error in invalid_passwords:
            with pytest.raises(HTTPException) as exc_info:
                ResetPasswordRequest(
                    token="valid-token",
                    new_password=password
                )
            assert any(error["msg"] == expected_error for error in exc_info.value.detail)

    def test_multiple_password_errors(self):
        """Test multiple password validation errors at once"""
        with pytest.raises(HTTPException) as exc_info:
            ResetPasswordRequest(
                token="valid-token",
                new_password="short"  # Violates multiple rules
            )

        errors = exc_info.value.detail
        error_messages = [error["msg"] for error in errors]

        assert len(errors) > 1
        assert "Password must be at least 16 characters long." in error_messages
        assert "Password must contain at least one uppercase letter." in error_messages
        assert "Password must contain at least one number." in error_messages
        assert "Password must contain at least one special character." in error_messages