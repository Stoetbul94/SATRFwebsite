#!/usr/bin/env python3
"""
Script to generate sample ISSF score files for testing
"""

import pandas as pd
import os

def create_sample_excel_file():
    """Create a sample Excel file with valid ISSF scores"""
    
    # Sample data with valid scores
    data = [
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH001",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Air Rifle",
            "Match Number": 2,
            "Shooter Name": "Jane Smith",
            "Shooter ID": "SH002",
            "Club": "Another Club",
            "Division/Class": "Junior",
            "Veteran": "N",
            "Series 1": 95.0,
            "Series 2": 96.5,
            "Series 3": 94.8,
            "Series 4": 97.2,
            "Series 5": 95.9,
            "Series 6": 96.1,
            "Total": 575.5,
            "Place": "2"
        },
        {
            "Event Name": "3P",
            "Match Number": 3,
            "Shooter Name": "Bob Johnson",
            "Shooter ID": "SH003",
            "Club": "Shooting Club",
            "Division/Class": "Veteran",
            "Veteran": "Y",
            "Series 1": 92.3,
            "Series 2": 94.7,
            "Series 3": 91.8,
            "Series 4": 93.5,
            "Series 5": 95.2,
            "Series 6": 92.9,
            "Total": 560.4,
            "Place": "3"
        },
        {
            "Event Name": "Prone Match 2",
            "Match Number": 4,
            "Shooter Name": "Alice Brown",
            "Shooter ID": "SH004",
            "Club": "Precision Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 99.1,
            "Series 2": 100.8,
            "Series 3": 98.5,
            "Series 4": 101.2,
            "Series 5": 99.7,
            "Series 6": 100.3,
            "Total": 599.6,
            "Place": "1"
        }
    ]
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save to Excel file
    filename = "sample_issf_scores.xlsx"
    df.to_excel(filename, index=False)
    print(f"Created sample Excel file: {filename}")
    
    # Save to CSV file
    csv_filename = "sample_issf_scores.csv"
    df.to_csv(csv_filename, index=False)
    print(f"Created sample CSV file: {csv_filename}")
    
    return filename, csv_filename


def create_invalid_sample_file():
    """Create a sample file with invalid data for testing error handling"""
    
    # Sample data with various validation errors
    data = [
        {
            "Event Name": "Invalid Event",  # Invalid event name
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH001",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "",  # Empty shooter name
            "Shooter ID": "SH002",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH003",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "Maybe",  # Invalid veteran status
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH004",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "Y",
            "Series 1": 110.0,  # Series > 109.0
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 607.0,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH005",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "Y",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 600.0,  # Wrong total
            "Place": "1"
        }
    ]
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save to Excel file
    filename = "sample_invalid_issf_scores.xlsx"
    df.to_excel(filename, index=False)
    print(f"Created invalid sample Excel file: {filename}")
    
    return filename


if __name__ == "__main__":
    print("Creating sample ISSF score files...")
    
    # Create valid sample files
    excel_file, csv_file = create_sample_excel_file()
    
    # Create invalid sample file
    invalid_file = create_invalid_sample_file()
    
    print("\nSample files created successfully!")
    print(f"Valid Excel file: {excel_file}")
    print(f"Valid CSV file: {csv_file}")
    print(f"Invalid Excel file: {invalid_file}")
    print("\nYou can use these files to test the ISSF score import endpoint.") 