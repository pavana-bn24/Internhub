"""
pytest configuration — sets TEST_DATABASE_URL before any app modules load.
All tests use test_internhub.db, leaving the main database untouched.
"""
import os
os.environ["TEST_DATABASE_URL"] = "sqlite:///./test_internhub.db"
