#!/usr/bin/env python3
"""
Comprehensive test script for JWT authentication system
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

import asyncio
import httpx
import json
from typing import Dict, Any

class AuthSystemTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        
    async def test_health_check(self) -> bool:
        """Test that the API is running"""
        print("🔍 Testing health check...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health")
                if response.status_code == 200:
                    print("✅ Health check passed")
                    return True
                else:
                    print(f"❌ Health check failed: {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    async def test_docs_accessible(self) -> bool:
        """Test that the docs are accessible"""
        print("🔍 Testing docs accessibility...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/docs")
                if response.status_code == 200:
                    print("✅ Docs are accessible")
                    return True
                else:
                    print(f"❌ Docs not accessible: {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Docs access error: {e}")
            return False
    
    async def test_social_login(self) -> bool:
        """Test social login with mock token"""
        print("🔍 Testing social login...")
        try:
            async with httpx.AsyncClient() as client:
                login_data = {
                    "provider": "mock",  # Use mock provider for testing
                    "token": "test_token",
                    "language_preferences": {
                        "native_language_code": "en",
                        "study_language_code": "es"
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/auth/social-login",
                    json=login_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.access_token = data.get("access_token")
                    self.refresh_token = data.get("refresh_token")
                    print("✅ Social login successful")
                    print(f"   User: {data.get('user', {}).get('email', 'Unknown')}")
                    print(f"   New user: {data.get('is_new_user', False)}")
                    return True
                else:
                    print(f"❌ Social login failed: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Social login error: {e}")
            return False
    
    async def test_protected_route_without_auth(self) -> bool:
        """Test that protected routes reject unauthenticated requests"""
        print("🔍 Testing protected route without authentication...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/users/")
                
                if response.status_code == 401:
                    print("✅ Protected route correctly rejected unauthenticated request")
                    return True
                else:
                    print(f"❌ Protected route should return 401, got: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ Protected route test error: {e}")
            return False
    
    async def test_protected_route_with_auth(self) -> bool:
        """Test that protected routes work with valid authentication"""
        print("🔍 Testing protected route with authentication...")
        if not self.access_token:
            print("❌ No access token available")
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                response = await client.get(f"{self.base_url}/users/", headers=headers)
                
                if response.status_code == 200:
                    print("✅ Protected route accessible with valid token")
                    return True
                else:
                    print(f"❌ Protected route failed with valid token: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Protected route with auth error: {e}")
            return False
    
    async def test_user_profile(self) -> bool:
        """Test getting current user profile"""
        print("🔍 Testing user profile endpoint...")
        if not self.access_token:
            print("❌ No access token available")
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                response = await client.get(f"{self.base_url}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    print("✅ User profile retrieved successfully")
                    print(f"   Username: {data.get('username')}")
                    print(f"   Email: {data.get('email')}")
                    return True
                else:
                    print(f"❌ User profile failed: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ User profile error: {e}")
            return False
    
    async def test_token_refresh(self) -> bool:
        """Test token refresh functionality"""
        print("🔍 Testing token refresh...")
        if not self.refresh_token:
            print("❌ No refresh token available")
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                refresh_data = {"refresh_token": self.refresh_token}
                response = await client.post(
                    f"{self.base_url}/auth/refresh",
                    json=refresh_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    new_access_token = data.get("access_token")
                    if new_access_token:
                        print("✅ Token refresh successful")
                        self.access_token = new_access_token  # Update for further tests
                        return True
                    else:
                        print("❌ Token refresh didn't return new access token")
                        return False
                else:
                    print(f"❌ Token refresh failed: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ Token refresh error: {e}")
            return False
    
    async def test_invalid_token(self) -> bool:
        """Test that invalid tokens are rejected"""
        print("🔍 Testing invalid token rejection...")
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": "Bearer invalid_token"}
                response = await client.get(f"{self.base_url}/users/", headers=headers)
                
                if response.status_code == 401:
                    print("✅ Invalid token correctly rejected")
                    return True
                else:
                    print(f"❌ Invalid token should return 401, got: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ Invalid token test error: {e}")
            return False
    
    async def test_logout(self) -> bool:
        """Test logout endpoint"""
        print("🔍 Testing logout...")
        if not self.access_token:
            print("❌ No access token available")
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                response = await client.post(f"{self.base_url}/auth/logout", headers=headers)
                
                if response.status_code == 200:
                    print("✅ Logout successful")
                    return True
                else:
                    print(f"❌ Logout failed: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ Logout error: {e}")
            return False
    
    async def run_all_tests(self) -> bool:
        """Run all authentication tests"""
        print("🧪 Starting JWT Authentication System Tests\n")
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Docs Accessibility", self.test_docs_accessible),
            ("Social Login", self.test_social_login),
            ("Protected Route (No Auth)", self.test_protected_route_without_auth),
            ("Protected Route (With Auth)", self.test_protected_route_with_auth),
            ("User Profile", self.test_user_profile),
            ("Token Refresh", self.test_token_refresh),
            ("Invalid Token", self.test_invalid_token),
            ("Logout", self.test_logout),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- {test_name} ---")
            try:
                result = await test_func()
                if result:
                    passed += 1
                print("")
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {e}\n")
        
        print("="*50)
        print(f"Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Authentication system is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the implementation.")
            return False

async def main():
    """Main test runner"""
    tester = AuthSystemTester()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)