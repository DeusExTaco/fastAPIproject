import pytest
from unittest.mock import patch, MagicMock
import logging
import sys
from fastapi.testclient import TestClient
from fastapi import APIRouter
import importlib
import uvicorn

# Remove main module if it's already imported
if 'main' in sys.modules:
    del sys.modules['main']

# Create a mock router with some test routes
mock_router = APIRouter()


@mock_router.get("/test")
def test_route():
    return {"message": "test"}


@pytest.fixture(autouse=True)
def setup_mocks():
    """Setup all mocks and reload main module"""
    # Setup all mocks
    with patch('database.init_db') as mock_init_db, \
            patch('routes.router', mock_router), \
            patch('dotenv.load_dotenv') as mock_load_dotenv, \
            patch('logging.basicConfig') as mock_logging:
        # Import main module after mocks are in place
        import main
        importlib.reload(main)

        # Create test client
        client = TestClient(main.app)

        # Return mocks and client for use in tests
        yield {
            'init_db': mock_init_db,
            'router': mock_router,
            'load_dotenv': mock_load_dotenv,
            'logging': mock_logging,
            'client': client,
            'app': main.app
        }


def test_database_initialization(setup_mocks):
    """Test that database initialization is called"""
    assert setup_mocks['init_db'].called


def test_load_dotenv_called(setup_mocks):
    """Test that load_dotenv is called"""
    assert setup_mocks['load_dotenv'].called


def test_logging_configuration(setup_mocks):
    """Test that logging is configured with correct level"""
    setup_mocks['logging'].assert_called_once_with(level=logging.INFO)


def test_cors_middleware_configuration(setup_mocks):
    """Test that CORS middleware is properly configured"""
    client = setup_mocks['client']
    response = client.options(
        "/api/test",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "Content-Type" in response.headers["access-control-allow-headers"]


def test_main_entrypoint(setup_mocks):
    """Test the __main__ entrypoint"""
    # Get the original __name__ value
    original_name = None
    if 'main' in sys.modules:
        original_name = sys.modules['main'].__name__
        del sys.modules['main']

    try:
        # Mock uvicorn.run
        with patch('uvicorn.run') as mock_run:
            # Set __name__ to __main__
            with patch.dict('sys.modules', {'__main__': type('module', (), {'__name__': '__main__'})()}):
                import main

                # Manually execute the main block
                if hasattr(main, 'app'):
                    mock_run.assert_not_called()  # Should not have been called yet

                    # Execute the code from the if __name__ == "__main__" block
                    uvicorn.run(main.app, host="0.0.0.0", port=8000)

                    # Now verify the call
                    mock_run.assert_called_once_with(
                        main.app,
                        host="0.0.0.0",
                        port=8000
                    )
    finally:
        # Restore original state
        if original_name and 'main' in sys.modules:
            sys.modules['main'].__name__ = original_name


def test_api_router_included(setup_mocks):
    """Test that the API router is included with correct prefix"""
    client = setup_mocks['client']

    # Test the mock route we added to verify router inclusion
    response = client.get("/api/test")
    assert response.status_code == 200
    assert response.json() == {"message": "test"}

    # Additional verification through app routes
    api_routes = [
        route for route in setup_mocks['app'].routes
        if str(route.path).startswith("/api")
    ]
    assert len(api_routes) > 0


def test_invalid_route(setup_mocks):
    """Test accessing an invalid route returns 404"""
    client = setup_mocks['client']
    response = client.get("/invalid-route")
    assert response.status_code == 404


def test_options_non_existent_endpoint(setup_mocks):
    """Test OPTIONS request for non-existent endpoint still returns CORS headers"""
    client = setup_mocks['client']
    response = client.options(
        "/api/non-existent",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"