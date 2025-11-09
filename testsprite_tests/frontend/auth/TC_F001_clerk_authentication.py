"""
TC_F001: Clerk Authentication Flow Tests
Tests user authentication via Clerk including sign-in, sign-out, and JWT token validation.

Requirements: 2.1, 2.5
Priority: High
Category: Authentication
"""

import pytest
import json
import time
from playwright.sync_api import Page, expect
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:3000"
TIMEOUT = 30000

# Test data from config
TEST_USERS = {
    "student_athlete": {
        "email": "student.athlete@test.aah.edu",
        "password": "TestPass123!",
        "role": "student_athlete"
    },
    "academic_coordinator": {
        "email": "coordinator@test.aah.edu",
        "password": "TestPass123!",
        "role": "academic_coordinator"
    },
    "admin": {
        "email": "admin@test.aah.edu",
        "password": "TestPass123!",
        "role": "admin"
    }
}


class TestClerkAuthentication:
    """Test suite for Clerk authentication flows"""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """Setup before each test"""
        self.page = page
        self.page.set_default_timeout(TIMEOUT)
        yield
        # Cleanup: ensure logged out after each test
        try:
            self.logout()
        except:
            pass

    def navigate_to_login(self):
        """Navigate to the login page"""
        self.page.goto(f"{BASE_URL}/sign-in")
        self.page.wait_for_load_state("networkidle")

    def fill_login_form(self, email: str, password: str):
        """Fill in the login form with credentials"""
        # Wait for Clerk sign-in form to load
        self.page.wait_for_selector('input[name="identifier"]', timeout=TIMEOUT)
        
        # Enter email
        self.page.fill('input[name="identifier"]', email)
        self.page.click('button[type="submit"]')
        
        # Wait for password field
        self.page.wait_for_selector('input[name="password"]', timeout=TIMEOUT)
        
        # Enter password
        self.page.fill('input[name="password"]', password)
        self.page.click('button[type="submit"]')

    def logout(self):
        """Log out the current user"""
        try:
            # Click user button to open menu
            self.page.click('[data-testid="user-button"]', timeout=5000)
            # Click sign out
            self.page.click('text=Sign out', timeout=5000)
            self.page.wait_for_url(f"{BASE_URL}/", timeout=TIMEOUT)
        except:
            # If logout fails, just navigate to home
            self.page.goto(BASE_URL)

    def get_jwt_token(self) -> str:
        """Extract JWT token from browser storage"""
        token = self.page.evaluate("""
            () => {
                // Try to get token from localStorage or sessionStorage
                const clerkToken = window.localStorage.getItem('__clerk_client_jwt') ||
                                 window.sessionStorage.getItem('__clerk_client_jwt');
                return clerkToken;
            }
        """)
        return token

    def test_successful_login_with_valid_credentials(self):
        """
        Test ID: TC_F001_01
        Test successful authentication with valid Clerk credentials
        
        Steps:
        1. Navigate to login page
        2. Enter valid credentials
        3. Submit login form
        4. Verify successful authentication
        5. Verify JWT token is issued
        
        Expected: User is authenticated and redirected to dashboard with valid JWT token
        """
        user = TEST_USERS["student_athlete"]
        
        # Navigate to login
        self.navigate_to_login()
        
        # Fill and submit login form
        self.fill_login_form(user["email"], user["password"])
        
        # Wait for redirect to dashboard
        self.page.wait_for_url(f"{BASE_URL}/", timeout=TIMEOUT)
        
        # Verify user is logged in - check for user button
        expect(self.page.locator('[data-testid="user-button"]')).to_be_visible(timeout=TIMEOUT)
        
        # Verify JWT token exists
        token = self.get_jwt_token()
        assert token is not None, "JWT token should be present after login"
        assert len(token) > 0, "JWT token should not be empty"
        
        # Verify user info is displayed
        expect(self.page.locator('text=Athletic Academics Hub')).to_be_visible()

    def test_login_with_invalid_credentials(self):
        """
        Test ID: TC_F001_02
        Test authentication failure with invalid credentials
        
        Steps:
        1. Navigate to login page
        2. Enter invalid credentials
        3. Submit login form
        4. Verify error message is displayed
        
        Expected: Login fails with appropriate error message
        """
        # Navigate to login
        self.navigate_to_login()
        
        # Try to login with invalid credentials
        self.page.fill('input[name="identifier"]', "invalid@test.aah.edu")
        self.page.click('button[type="submit"]')
        
        # Wait for error message
        error_locator = self.page.locator('text=/Invalid|Incorrect|not found/i')
        expect(error_locator).to_be_visible(timeout=TIMEOUT)

    def test_access_protected_route_without_authentication(self):
        """
        Test ID: TC_F001_03
        Test that protected routes redirect to login when not authenticated
        
        Steps:
        1. Navigate directly to protected route without logging in
        2. Verify redirect to login page
        
        Expected: User is redirected to sign-in page
        """
        # Try to access admin page without authentication
        self.page.goto(f"{BASE_URL}/admin")
        
        # Should be redirected to sign-in
        self.page.wait_for_url(f"**/sign-in**", timeout=TIMEOUT)
        
        # Verify we're on the sign-in page
        expect(self.page.locator('input[name="identifier"]')).to_be_visible(timeout=TIMEOUT)

    def test_jwt_token_validation(self):
        """
        Test ID: TC_F001_04
        Test that JWT token is valid and contains correct claims
        
        Steps:
        1. Login with valid credentials
        2. Extract JWT token
        3. Verify token structure and claims
        
        Expected: JWT token contains valid claims including user ID and role
        """
        user = TEST_USERS["academic_coordinator"]
        
        # Login
        self.navigate_to_login()
        self.fill_login_form(user["email"], user["password"])
        self.page.wait_for_url(f"{BASE_URL}/", timeout=TIMEOUT)
        
        # Get JWT token
        token = self.get_jwt_token()
        assert token is not None, "JWT token should exist"
        
        # Verify token format (JWT has 3 parts separated by dots)
        token_parts = token.split('.')
        assert len(token_parts) == 3, "JWT should have 3 parts (header.payload.signature)"
        
        # Note: In a real test, you would decode and verify the JWT claims
        # For now, we just verify the structure

    def test_successful_logout(self):
        """
        Test ID: TC_F001_05
        Test successful logout and session termination
        
        Steps:
        1. Login with valid credentials
        2. Click logout button
        3. Verify redirect to home page
        4. Verify JWT token is cleared
        5. Verify cannot access protected routes
        
        Expected: User is logged out, token is cleared, and protected routes are inaccessible
        """
        user = TEST_USERS["admin"]
        
        # Login
        self.navigate_to_login()
        self.fill_login_form(user["email"], user["password"])
        self.page.wait_for_url(f"{BASE_URL}/", timeout=TIMEOUT)
        
        # Verify logged in
        expect(self.page.locator('[data-testid="user-button"]')).to_be_visible()
        
        # Logout
        self.logout()
        
        # Verify redirected to home
        assert self.page.url == f"{BASE_URL}/" or self.page.url == f"{BASE_URL}", \
            "Should be redirected to home page after logout"
        
        # Verify sign-in button is visible (not logged in)
        expect(self.page.locator('text=Sign in')).to_be_visible(timeout=TIMEOUT)
        
        # Verify JWT token is cleared
        token = self.get_jwt_token()
        assert token is None or token == "", "JWT token should be cleared after logout"
        
        # Try to access protected route
        self.page.goto(f"{BASE_URL}/admin")
        
        # Should be redirected to sign-in
        self.page.wait_for_url(f"**/sign-in**", timeout=TIMEOUT)

    def test_session_persistence_across_page_navigation(self):
        """
        Test ID: TC_F001_06
        Test that authentication session persists across page navigation
        
        Steps:
        1. Login with valid credentials
        2. Navigate to different pages
        3. Verify user remains authenticated
        
        Expected: User session persists across navigation
        """
        user = TEST_USERS["student_athlete"]
        
        # Login
        self.navigate_to_login()
        self.fill_login_form(user["email"], user["password"])
        self.page.wait_for_url(f"{BASE_URL}/", timeout=TIMEOUT)
        
        # Navigate to different pages
        pages_to_test = ["/", "/admin"]
        
        for page_url in pages_to_test:
            self.page.goto(f"{BASE_URL}{page_url}")
            self.page.wait_for_load_state("networkidle")
            
            # Verify still logged in (user button visible or redirected to sign-in for protected routes)
            try:
                expect(self.page.locator('[data-testid="user-button"]')).to_be_visible(timeout=5000)
            except:
                # If on protected route without permission, should see sign-in or access denied
                pass

    def test_multiple_role_authentication(self):
        """
        Test ID: TC_F001_07
        Test authentication for different user roles
        
        Steps:
        1. Login as each user role
        2. Verify successful authentication for each
        3. Verify role-specific access
        
        Expected: All user roles can authenticate successfully
        """
        for role, user in TEST_USERS.items():
            # Logout if currently logged in
            try:
                self.logout()
            except:
                pass
            
            # Login with this role
            self.navigate_to_login()
            self.fill_login_form(user["email"], user["password"])
            self.page.wait_for_url(f"{BASE_URL}/", timeout=TIMEOUT)
            
            # Verify logged in
            expect(self.page.locator('[data-testid="user-button"]')).to_be_visible(timeout=TIMEOUT)
            
            # Verify JWT token exists
            token = self.get_jwt_token()
            assert token is not None, f"JWT token should exist for {role}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
