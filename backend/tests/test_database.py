
from unittest.mock import patch, MagicMock
from database import create_database_if_not_exists, get_db, init_db, engine


def test_get_db():
    db_generator = get_db()
    db_session = next(db_generator)

    assert db_session is not None
    db_generator.close()


def test_init_db():
    with patch("database.Base.metadata.create_all") as mock_create_all:
        init_db()
        mock_create_all.assert_called_once_with(bind=engine)
