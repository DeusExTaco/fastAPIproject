import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserStatus, UserRole

# Set up an in-memory SQLite database for testing
@pytest.fixture(scope='module')
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)

def test_create_user(test_db):
    user = User(
        first_name="John",
        last_name="Doe",
        user_name="johndoe",
        email="john.doe@example.com",
        hashed_password="hashed_password_123",
        status=UserStatus.ACTIVE,
        roles="user"
    )
    test_db.add(user)
    test_db.commit()

    # Verify that the user was added
    assert user.id is not None
    assert user.first_name == "John"
    assert user.last_name == "Doe"

def test_user_unique_constraints(test_db):
    user1 = User(
        first_name="Jane",
        last_name="Smith",
        user_name="janesmith",
        email="jane.smith@example.com",
        hashed_password="hashed_password_456",
        status=UserStatus.PENDING,
        roles="admin"
    )
    user2 = User(
        first_name="Jake",
        last_name="Johnson",
        user_name="janesmith",  # Duplicate username
        email="jake.johnson@example.com",
        hashed_password="hashed_password_789",
        status=UserStatus.ACTIVE,
        roles="user"
    )

    test_db.add(user1)
    test_db.commit()

    # Attempt to add the second user with a duplicate username
    with pytest.raises(Exception):
        test_db.add(user2)
        test_db.commit()

def test_enum_values():
    assert UserStatus.ACTIVE.value == "active"
    assert UserRole.ADMIN.value == "admin"
