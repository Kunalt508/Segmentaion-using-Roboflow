"""
Test script to verify Roboflow workflow is working correctly
"""

import os
import json
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("ROBOFLOW_API_KEY")
if not api_key:
    print("ERROR: ROBOFLOW_API_KEY not found in environment!")
    print("Please set it in your .env file")
    exit(1)

print("=" * 60)
print("ROBOFLOW WORKFLOW TEST")
print("=" * 60)
print(f"API Key: {api_key[:10]}...{api_key[-4:]}")
print()

# Initialize client
client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=api_key
)

workspace_name = "segmentationslotart"
workflow_id = "custom-workflow-3"

print(f"Workspace: {workspace_name}")
print(f"Workflow ID: {workflow_id}")
print()

# Test with a sample image URL (using a public test image)
test_image_url = "https://source.roboflow.com/pwYAXb1DwxToLFVRS71J/CsWvBXbY2DiztY87OjFG/original.jpg"

print(f"Testing with image: {test_image_url}")
print("Running workflow...")
print()

try:
    result = client.run_workflow(
        workspace_name=workspace_name,
        workflow_id=workflow_id,
        images={
            "image": test_image_url
        },
        use_cache=False  # Disable cache for testing
    )

    print("SUCCESS! Workflow executed.")
    print()
    print("=" * 60)
    print("RESULT STRUCTURE:")
    print("=" * 60)
    print(f"Result type: {type(result)}")
    print()

    if isinstance(result, list):
        print(f"Result is a list with {len(result)} element(s)")
        print()
        if len(result) > 0:
            first_result = result[0]
            print("First element keys:", list(first_result.keys()))
            print()

            # Print each output section
            for key, value in first_result.items():
                print(f"\n--- {key} ---")
                if isinstance(value, dict):
                    print(f"Type: dict with keys: {list(value.keys())}")
                    # Show nested structure
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, dict):
                            print(f"  {sub_key}: dict with keys {list(sub_value.keys())}")
                            # One more level
                            for sub_sub_key, sub_sub_value in sub_value.items():
                                if isinstance(sub_sub_value, list):
                                    print(f"    {sub_sub_key}: list with {len(sub_sub_value)} items")
                                    if len(sub_sub_value) > 0:
                                        print(f"      First item keys: {list(sub_sub_value[0].keys()) if isinstance(sub_sub_value[0], dict) else type(sub_sub_value[0])}")
                                elif isinstance(sub_sub_value, dict):
                                    print(f"    {sub_sub_key}: dict with keys {list(sub_sub_value.keys())}")
                                else:
                                    print(f"    {sub_sub_key}: {type(sub_sub_value)} = {sub_sub_value}")
                        elif isinstance(sub_value, list):
                            print(f"  {sub_key}: list with {len(sub_value)} items")
                        else:
                            print(f"  {sub_key}: {type(sub_value)} = {sub_value}")
                elif isinstance(value, list):
                    print(f"Type: list with {len(value)} items")
                else:
                    print(f"Type: {type(value)} = {value}")
    else:
        print("Result is not a list!")
        print(json.dumps(result, indent=2, default=str))

    print()
    print("=" * 60)
    print("FULL JSON OUTPUT:")
    print("=" * 60)
    print(json.dumps(result, indent=2, default=str))

except Exception as e:
    print("ERROR occurred during workflow execution!")
    print()
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print()

    # Print more details if available
    if hasattr(e, 'args'):
        print("Error details:")
        for arg in e.args:
            print(f"  {arg}")

print()
print("=" * 60)
print("TEST COMPLETE")
print("=" * 60)
