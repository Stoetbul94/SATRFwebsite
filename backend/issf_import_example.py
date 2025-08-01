#!/usr/bin/env python3
"""
Example script demonstrating how to use the ISSF Score Import API
"""

import requests
import json
import os

def import_issf_scores(api_url, admin_token, file_path):
    """
    Import ISSF scores from an Excel or CSV file
    
    Args:
        api_url (str): Base URL of the API (e.g., "http://localhost:8000")
        admin_token (str): Admin authentication token
        file_path (str): Path to the Excel or CSV file
    """
    
    # Endpoint URL
    url = f"{api_url}/scores/import-issf"
    
    # Headers with authentication
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    
    # Determine content type based on file extension
    if file_path.lower().endswith('.xlsx'):
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif file_path.lower().endswith('.csv'):
        content_type = "text/csv"
    else:
        raise ValueError("File must be .xlsx or .csv format")
    
    try:
        # Open and upload the file
        with open(file_path, 'rb') as f:
            files = {
                "file": (os.path.basename(file_path), f, content_type)
            }
            
            print(f"Uploading {file_path}...")
            response = requests.post(url, headers=headers, files=files)
        
        # Handle response
        if response.status_code == 201:
            result = response.json()
            print("✅ Import successful!")
            print(f"Records added: {result['data']['records_added']}")
            print(f"Records failed: {result['data']['records_failed']}")
            print(f"Summary: {result['data']['summary']}")
            
            # Show errors if any
            if result['data']['errors']:
                print("\n❌ Validation errors:")
                for error in result['data']['errors']:
                    print(f"  Row {error['row_number']}: {error['field']} - {error['error']}")
            
            return result
            
        elif response.status_code == 403:
            print("❌ Access denied: Admin privileges required")
            return None
            
        elif response.status_code == 400:
            print("❌ Bad request:")
            print(response.json().get('detail', 'Unknown error'))
            return None
            
        else:
            print(f"❌ Unexpected error: {response.status_code}")
            print(response.text)
            return None
            
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def main():
    """Main function demonstrating the API usage"""
    
    # Configuration - Update these values
    API_URL = "http://localhost:8000"  # Your API base URL
    ADMIN_TOKEN = "your_admin_token_here"  # Replace with actual admin token
    
    print("ISSF Score Import API Example")
    print("=" * 40)
    
    # Example 1: Import valid scores
    print("\n1. Importing valid scores...")
    result1 = import_issf_scores(
        API_URL, 
        ADMIN_TOKEN, 
        "sample_issf_scores.xlsx"
    )
    
    # Example 2: Import invalid scores (for testing error handling)
    print("\n2. Importing invalid scores (testing error handling)...")
    result2 = import_issf_scores(
        API_URL, 
        ADMIN_TOKEN, 
        "sample_invalid_issf_scores.xlsx"
    )
    
    # Example 3: Import CSV file
    print("\n3. Importing CSV file...")
    result3 = import_issf_scores(
        API_URL, 
        ADMIN_TOKEN, 
        "sample_issf_scores.csv"
    )
    
    print("\n" + "=" * 40)
    print("Example completed!")


if __name__ == "__main__":
    main() 