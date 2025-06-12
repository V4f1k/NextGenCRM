#!/usr/bin/env python3
import requests
import json

# Test creating a lead via the API
url = "http://localhost:8000/api/v1/leads/"

# Sample lead data - minimal required fields
lead_data = {
    "first_name": "Test",
    "last_name": "Lead",
    "email_address": "test@example.com",
    "status": "new"
}

# First, let's try without authentication to see the error
print("Testing Lead creation without auth...")
response = requests.post(url, json=lead_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}\n")

# Now let's get the auth token (you'll need to update these credentials)
print("Getting auth token...")
auth_url = "http://localhost:8000/api/v1/auth/login/"
auth_data = {
    "username": "admin@example.com",  # Update with your admin email
    "password": "admin123"  # Update with your admin password
}

auth_response = requests.post(auth_url, json=auth_data)
if auth_response.status_code == 200:
    tokens = auth_response.json()
    access_token = tokens.get('access')
    
    print(f"Got access token: {access_token[:20]}...\n")
    
    # Now try with authentication
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("Testing Lead creation with auth...")
    response = requests.post(url, json=lead_data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
else:
    print(f"Auth failed: {auth_response.status_code}")
    print(f"Response: {auth_response.text}")