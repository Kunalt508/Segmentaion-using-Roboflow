"""
Flask API Server for Segment Art - Roboflow Integration
Serves segmentation endpoints for the React frontend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
from io import BytesIO
from roboflow_api import RoboflowSegmentation
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize Roboflow client
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
segmenter = RoboflowSegmentation(ROBOFLOW_API_KEY) if ROBOFLOW_API_KEY else None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "roboflow_configured": segmenter is not None
    })


@app.route('/api/segment', methods=['POST'])
def segment_image():
    """
    Segment an image using Roboflow workflow

    Request Body:
        {
            "image": "base64_encoded_image_or_url",
            "mode": "auto" | "face" | "landscape",
            "use_cache": true
        }

    Response:
        {
            "mode": "face" | "landscape",
            "masks": [
                {
                    "label": "left_eye",
                    "score": 0.95,
                    "mask": "base64_encoded_mask",
                    "bounds": {"xmin": 0, "ymin": 0, "xmax": 100, "ymax": 100}
                }
            ],
            "total_detections": 5
        }
    """
    if not segmenter:
        return jsonify({
            "error": "Roboflow API key not configured"
        }), 500

    try:
        data = request.json

        if not data or 'image' not in data:
            return jsonify({
                "error": "Missing 'image' in request body"
            }), 400

        image_data = data['image']
        mode = data.get('mode', 'auto')
        use_cache = data.get('use_cache', True)

        # Handle base64 encoded image
        if image_data.startswith('data:image'):
            # Remove data URL prefix
            image_data = image_data.split(',')[1]

        # Decode base64 and save to temp file
        image_bytes = base64.b64decode(image_data)

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_bytes)
            temp_path = temp_file.name

        try:
            # Run segmentation
            result = segmenter.segment_image(
                image_path=temp_path,
                mode=mode,
                use_cache=use_cache
            )

            return jsonify(result)

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/api/detect-type', methods=['POST'])
def detect_image_type():
    """
    Detect if image is face or landscape by running workflow and comparing outputs

    Request Body:
        {
            "image": "base64_encoded_image_or_url"
        }

    Response:
        {
            "type": "face" | "landscape",
            "confidence": 0.95,
            "face_detections": 5,
            "landscape_detections": 2
        }
    """
    if not segmenter:
        return jsonify({
            "error": "Roboflow API key not configured"
        }), 500

    try:
        data = request.json

        if not data or 'image' not in data:
            return jsonify({
                "error": "Missing 'image' in request body"
            }), 400

        image_data = data['image']

        # Handle base64 encoded image
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]

        # Decode and save to temp file
        image_bytes = base64.b64decode(image_data)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_bytes)
            temp_path = temp_file.name

        try:
            # Run workflow to get segmentation results
            result = segmenter.client.run_workflow(
                workspace_name=segmenter.workspace_name,
                workflow_id=segmenter.workflow_id,
                images={"image": temp_path},
                use_cache=True
            )

            # Workflow returns a list with one element per image
            if isinstance(result, list):
                result = result[0] if len(result) > 0 else {}

            # Extract predictions from simplified workflow structure
            face_output_raw = result.get("output_face_mode", {})

            # Handle both direct array and nested predictions structure
            if isinstance(face_output_raw, dict):
                face_output = face_output_raw.get("predictions", face_output_raw)
                if isinstance(face_output, dict):
                    face_output = face_output.get("predictions", [])
                elif not isinstance(face_output, list):
                    face_output = []
            elif isinstance(face_output_raw, list):
                face_output = face_output_raw
            else:
                face_output = []

            # Count high-confidence detections
            face_count = sum(1 for p in face_output if p.get("confidence", 0) > 0.5)

            # Simplified workflow always returns face segmentation
            # If we got detections, it's a face image
            is_face = face_count > 0
            image_type = "face" if is_face else "landscape"

            return jsonify({
                "type": image_type,
                "confidence": 0.95 if is_face else 0.50,
                "face_detections": face_count,
                "landscape_detections": 0  # No longer supported in new workflow
            })

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == '__main__':
    if not ROBOFLOW_API_KEY:
        print("WARNING: ROBOFLOW_API_KEY environment variable not set!")
        print("Set it with: export ROBOFLOW_API_KEY=your_key_here")

    print("Starting Segment Art API Server...")
    print(f"Roboflow configured: {segmenter is not None}")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
