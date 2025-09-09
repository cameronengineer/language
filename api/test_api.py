#!/usr/bin/env python3
"""
Comprehensive test script for the Language Learning API
Tests all CRUD operations and relationships
"""

import requests
import json
from typing import Dict, Any, List
from datetime import datetime
import sys

BASE_URL = "http://localhost:8000"

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(text: str):
    """Print a section header"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")


def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text: str):
    """Print error message"""
    print(f"{RED}✗ {text}{RESET}")


def print_info(text: str):
    """Print info message"""
    print(f"{YELLOW}ℹ {text}{RESET}")


def make_request(method: str, endpoint: str, data: Dict[str, Any] = None) -> tuple:
    """Make an HTTP request and return response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response.status_code, response.json() if response.content else None
    except requests.exceptions.ConnectionError:
        print_error(f"Failed to connect to API at {url}")
        return None, None
    except Exception as e:
        print_error(f"Request failed: {e}")
        return None, None


def test_health():
    """Test health endpoint"""
    print_header("Testing Health Endpoint")
    
    status, data = make_request("GET", "/health")
    if status == 200:
        print_success(f"Health check passed: {data}")
    else:
        print_error(f"Health check failed with status {status}")
    
    return status == 200


def test_languages():
    """Test Language CRUD operations"""
    print_header("Testing Language CRUD Operations")
    
    created_ids = []
    
    # Test Create
    print_info("Creating languages...")
    languages = [
        {"code": "en", "name": "English"},
        {"code": "es", "name": "Spanish"},
        {"code": "fr", "name": "French"},
        {"code": "de", "name": "German"}
    ]
    
    for lang in languages:
        status, data = make_request("POST", "/languages/", lang)
        if status == 200 or status == 201:
            print_success(f"Created language: {lang['name']} (ID: {data.get('id')})")
            created_ids.append(data.get('id'))
        else:
            print_error(f"Failed to create language {lang['name']}: Status {status}")
    
    # Test List
    print_info("\nListing all languages...")
    status, data = make_request("GET", "/languages/")
    if status == 200:
        print_success(f"Retrieved {len(data)} languages")
        for lang in data:
            print(f"  - {lang.get('name')} ({lang.get('code')})")
    else:
        print_error(f"Failed to list languages: Status {status}")
    
    # Test Get by ID
    if created_ids:
        print_info(f"\nGetting language by ID: {created_ids[0]}")
        status, data = make_request("GET", f"/languages/{created_ids[0]}")
        if status == 200:
            print_success(f"Retrieved language: {data.get('name')}")
        else:
            print_error(f"Failed to get language: Status {status}")
    
    # Test Get by Code
    print_info("\nGetting language by code: en")
    status, data = make_request("GET", "/languages/code/en")
    if status == 200:
        print_success(f"Retrieved language by code: {data.get('name')}")
    else:
        print_error(f"Failed to get language by code: Status {status}")
    
    # Test Update
    if created_ids:
        print_info(f"\nUpdating language: {created_ids[0]}")
        update_data = {"name": "English (Updated)"}
        status, data = make_request("PUT", f"/languages/{created_ids[0]}", update_data)
        if status == 200:
            print_success(f"Updated language: {data.get('name')}")
        else:
            print_error(f"Failed to update language: Status {status}")
    
    # Test Delete (we'll skip this for now to keep data for other tests)
    print_info("\nSkipping delete test to preserve data for relationship tests")
    
    return created_ids


def test_types():
    """Test Type CRUD operations"""
    print_header("Testing Type CRUD Operations")
    
    created_ids = []
    
    # Test Create
    print_info("Creating grammatical types...")
    types = [
        {"name": "noun"},
        {"name": "verb"},
        {"name": "adjective"},
        {"name": "adverb"},
        {"name": "pronoun"}
    ]
    
    for type_data in types:
        status, data = make_request("POST", "/types/", type_data)
        if status == 200 or status == 201:
            print_success(f"Created type: {type_data['name']} (ID: {data.get('id')})")
            created_ids.append(data.get('id'))
        else:
            print_error(f"Failed to create type {type_data['name']}: Status {status}")
    
    # Test List
    print_info("\nListing all types...")
    status, data = make_request("GET", "/types/")
    if status == 200:
        print_success(f"Retrieved {len(data)} types")
        for type_item in data:
            print(f"  - {type_item.get('name')}")
    else:
        print_error(f"Failed to list types: Status {status}")
    
    return created_ids


def test_terms(language_ids: List[str], type_ids: List[str]):
    """Test Term CRUD operations"""
    print_header("Testing Term CRUD Operations")
    
    if not language_ids or not type_ids:
        print_error("Need languages and types to test terms")
        return []
    
    created_ids = []
    
    # Test Create
    print_info("Creating terms...")
    terms = [
        {"text": "house", "language_id": language_ids[0], "type_id": type_ids[0]},  # English noun
        {"text": "casa", "language_id": language_ids[1] if len(language_ids) > 1 else language_ids[0], "type_id": type_ids[0]},  # Spanish noun
        {"text": "run", "language_id": language_ids[0], "type_id": type_ids[1] if len(type_ids) > 1 else type_ids[0]},  # English verb
        {"text": "correr", "language_id": language_ids[1] if len(language_ids) > 1 else language_ids[0], "type_id": type_ids[1] if len(type_ids) > 1 else type_ids[0]},  # Spanish verb
    ]
    
    for term in terms:
        status, data = make_request("POST", "/terms/", term)
        if status == 200 or status == 201:
            print_success(f"Created term: {term['text']} (ID: {data.get('id')})")
            created_ids.append(data.get('id'))
        else:
            print_error(f"Failed to create term {term['text']}: Status {status}")
    
    # Test List with filter
    print_info(f"\nListing terms for language: {language_ids[0]}")
    status, data = make_request("GET", f"/terms/?language_id={language_ids[0]}")
    if status == 200:
        print_success(f"Retrieved {len(data)} terms")
        for term in data:
            print(f"  - {term.get('text')}")
    else:
        print_error(f"Failed to list terms: Status {status}")
    
    return created_ids


def test_users(language_ids: List[str]):
    """Test User CRUD operations"""
    print_header("Testing User CRUD Operations")
    
    if len(language_ids) < 2:
        print_error("Need at least 2 languages to test users")
        return []
    
    created_ids = []
    
    # Test Create
    print_info("Creating users...")
    users = [
        {
            "username": "john_doe",
            "email": "john@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "native_language_id": language_ids[0],
            "study_language_id": language_ids[1]
        },
        {
            "username": "jane_smith",
            "email": "jane@example.com",
            "first_name": "Jane",
            "last_name": "Smith",
            "native_language_id": language_ids[1],
            "study_language_id": language_ids[0]
        }
    ]
    
    for user in users:
        status, data = make_request("POST", "/users/", user)
        if status == 200 or status == 201:
            print_success(f"Created user: {user['username']} (ID: {data.get('id')})")
            created_ids.append(data.get('id'))
        else:
            print_error(f"Failed to create user {user['username']}: Status {status}")
    
    # Test validation - same native and study language
    print_info("\nTesting validation: same native and study language...")
    invalid_user = {
        "username": "invalid_user",
        "email": "invalid@example.com",
        "first_name": "Invalid",
        "last_name": "User",
        "native_language_id": language_ids[0],
        "study_language_id": language_ids[0]  # Same as native
    }
    status, data = make_request("POST", "/users/", invalid_user)
    if status == 400:
        print_success("Validation correctly rejected same native and study language")
    else:
        print_error(f"Validation failed - expected 400, got {status}")
    
    return created_ids


def test_catalogues():
    """Test Catalogue CRUD operations"""
    print_header("Testing Catalogue CRUD Operations")
    
    created_ids = []
    
    # Test Create
    print_info("Creating catalogues...")
    catalogues = [
        {"name": "Basic Vocabulary", "description": "Essential words for beginners"},
        {"name": "Business Terms", "description": "Professional vocabulary"},
        {"name": "Travel Phrases", "description": "Common travel expressions"}
    ]
    
    for catalogue in catalogues:
        status, data = make_request("POST", "/catalogues/", catalogue)
        if status == 200 or status == 201:
            print_success(f"Created catalogue: {catalogue['name']} (ID: {data.get('id')})")
            created_ids.append(data.get('id'))
        else:
            print_error(f"Failed to create catalogue {catalogue['name']}: Status {status}")
    
    return created_ids


def test_translations(term_ids: List[str], user_ids: List[str], catalogue_ids: List[str]):
    """Test Translation CRUD operations"""
    print_header("Testing Translation CRUD Operations")
    
    if len(term_ids) < 2:
        print_error("Need at least 2 terms to test translations")
        return
    
    # Test catalogue translation
    if catalogue_ids:
        print_info("Creating catalogue translation...")
        catalogue_translation = {
            "study_term_id": term_ids[0],
            "native_term_id": term_ids[1],
            "is_custom": False,
            "catalogue_id": catalogue_ids[0]
        }
        status, data = make_request("POST", "/translations/", catalogue_translation)
        if status == 200 or status == 201:
            print_success(f"Created catalogue translation (ID: {data.get('id')})")
        else:
            print_error(f"Failed to create catalogue translation: Status {status}")
    
    # Test custom user translation
    if user_ids:
        print_info("Creating custom user translation...")
        custom_translation = {
            "study_term_id": term_ids[0] if len(term_ids) > 0 else None,
            "native_term_id": term_ids[1] if len(term_ids) > 1 else term_ids[0],
            "is_custom": True,
            "user_id": user_ids[0]
        }
        status, data = make_request("POST", "/translations/", custom_translation)
        if status == 200 or status == 201:
            print_success(f"Created custom translation (ID: {data.get('id')})")
        else:
            print_error(f"Failed to create custom translation: Status {status}")
    
    # Test validation - both custom and catalogue
    print_info("\nTesting validation: translation both custom and from catalogue...")
    invalid_translation = {
        "study_term_id": term_ids[0],
        "native_term_id": term_ids[1],
        "is_custom": True,
        "catalogue_id": catalogue_ids[0] if catalogue_ids else None,
        "user_id": user_ids[0] if user_ids else None
    }
    status, data = make_request("POST", "/translations/", invalid_translation)
    if status == 400 or status == 422:
        print_success("Validation correctly rejected translation that is both custom and from catalogue")
    else:
        print_error(f"Validation failed - expected 400/422, got {status}")


def test_timestamps():
    """Test that timestamps are properly set and updated"""
    print_header("Testing Timestamp Fields")
    
    # Create a language and check timestamps
    print_info("Creating language to test timestamps...")
    lang_data = {"code": "test_ts", "name": "Test Timestamp"}
    status, data = make_request("POST", "/languages/", lang_data)
    
    if status == 200 or status == 201:
        created_at = data.get('created_at')
        updated_at = data.get('updated_at')
        lang_id = data.get('id')
        
        if created_at and updated_at:
            print_success(f"Timestamps set on creation:")
            print(f"  - created_at: {created_at}")
            print(f"  - updated_at: {updated_at}")
            
            # Update and check if updated_at changes
            print_info("\nUpdating language to test updated_at...")
            import time
            time.sleep(1)  # Wait to ensure timestamp difference
            
            update_data = {"name": "Test Timestamp Updated"}
            status, data = make_request("PUT", f"/languages/{lang_id}", update_data)
            
            if status == 200:
                new_updated_at = data.get('updated_at')
                if new_updated_at != updated_at:
                    print_success(f"updated_at changed after update: {new_updated_at}")
                else:
                    print_error("updated_at did not change after update")
            else:
                print_error(f"Failed to update language: Status {status}")
        else:
            print_error("Timestamps not properly set on creation")
    else:
        print_error(f"Failed to create test language: Status {status}")


def test_cascade_delete():
    """Test cascade delete functionality"""
    print_header("Testing Cascade Delete")
    
    print_info("Creating test data for cascade delete...")
    
    # Create a language
    status, lang_data = make_request("POST", "/languages/", {"code": "del_test", "name": "Delete Test"})
    if status not in [200, 201]:
        print_error("Failed to create test language")
        return
    
    lang_id = lang_data.get('id')
    
    # Create a type
    status, type_data = make_request("POST", "/types/", {"name": "delete_test_type"})
    if status not in [200, 201]:
        print_error("Failed to create test type")
        return
    
    type_id = type_data.get('id')
    
    # Create a term with that language
    status, term_data = make_request("POST", "/terms/", {
        "text": "delete_test_term",
        "language_id": lang_id,
        "type_id": type_id
    })
    
    if status in [200, 201]:
        term_id = term_data.get('id')
        print_success(f"Created term with language (Term ID: {term_id})")
        
        # Delete the language
        print_info(f"\nDeleting language {lang_id}...")
        status, _ = make_request("DELETE", f"/languages/{lang_id}")
        
        if status == 200:
            print_success("Language deleted")
            
            # Check if term still exists
            print_info("Checking if related term was cascade deleted...")
            status, _ = make_request("GET", f"/terms/{term_id}")
            if status == 404:
                print_success("Term was cascade deleted with language")
            else:
                print_info(f"Term still exists (cascade may not be configured) - Status: {status}")
        else:
            print_error(f"Failed to delete language: Status {status}")
    else:
        print_error(f"Failed to create test term: Status {status}")


def main():
    """Run all tests"""
    print_header("Language Learning API Test Suite")
    print(f"Testing API at: {BASE_URL}")
    
    # Test health first
    if not test_health():
        print_error("\nAPI health check failed. Is the API running?")
        sys.exit(1)
    
    # Run all test suites
    language_ids = test_languages()
    type_ids = test_types()
    term_ids = test_terms(language_ids, type_ids)
    user_ids = test_users(language_ids)
    catalogue_ids = test_catalogues()
    test_translations(term_ids, user_ids, catalogue_ids)
    test_timestamps()
    test_cascade_delete()
    
    print_header("Test Suite Complete")
    print_success("\nAll basic tests completed. Check output for any errors.")


if __name__ == "__main__":
    main()