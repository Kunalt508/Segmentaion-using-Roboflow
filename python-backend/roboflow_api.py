"""
Roboflow API Integration for Segment Art
Handles face and landscape segmentation using Roboflow workflows
"""

from inference_sdk import InferenceHTTPClient
import os
from typing import Dict, Any, Literal
import base64
from io import BytesIO
from PIL import Image

class RoboflowSegmentation:
    def __init__(self, api_key: str):
        """
        Initialize Roboflow client

        Args:
            api_key: Your Roboflow API key
        """
        self.client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key
        )
        self.workspace_name = "segmentationslotart"
        self.workflow_id = "custom-workflow-3"

    def segment_image(
        self,
        image_path: str,
        mode: Literal["auto", "face", "landscape"] = "auto",
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Run segmentation on an image using Roboflow workflow

        Args:
            image_path: Path to image file or base64 encoded image
            mode: "auto" (choose best), "face", or "landscape"
            use_cache: Whether to cache results for faster repeated requests

        Returns:
            Dictionary containing segmentation results
        """
        # Get actual image dimensions
        from PIL import Image
        img = Image.open(image_path)
        image_width, image_height = img.size

        # Run the workflow on the image
        result = self.client.run_workflow(
            workspace_name=self.workspace_name,
            workflow_id=self.workflow_id,
            images={
                "image": image_path
            },
            use_cache=use_cache
        )

        # Parse the results based on mode, passing actual image dimensions
        return self._parse_results(result, mode, image_width, image_height)

    def _parse_results(
        self,
        result: Dict[str, Any],
        mode: Literal["auto", "face", "landscape"],
        image_width: int,
        image_height: int
    ) -> Dict[str, Any]:
        """
        Parse Roboflow workflow results into standardized format

        Args:
            result: Raw workflow result
            mode: Which output to prioritize

        Returns:
            Standardized segmentation data
        """
        # Roboflow workflow returns a list with one element per image
        # Access the first image's results
        if isinstance(result, list):
            result = result[0] if len(result) > 0 else {}

        # Extract predictions from simplified workflow structure
        # Workflow now outputs: output_face_mode with direct predictions
        face_output_raw = result.get("output_face_mode", {})

        # Handle both direct array and nested predictions structure
        if isinstance(face_output_raw, dict):
            # Try nested predictions structure first
            face_output = face_output_raw.get("predictions", face_output_raw)
            if isinstance(face_output, dict):
                face_output = face_output.get("predictions", [])
            elif not isinstance(face_output, list):
                face_output = []
        elif isinstance(face_output_raw, list):
            face_output = face_output_raw
        else:
            face_output = []

        # Use the predictions from the workflow
        selected_output = face_output
        selected_mode = "face"

        # Convert to standardized format matching Hugging Face API structure
        masks = []

        for prediction in selected_output:
            # Roboflow returns predictions with:
            # - class: object class name
            # - confidence: detection confidence
            # - points: polygon points for segmentation
            # - x, y, width, height: bounding box

            mask_data = {
                "label": prediction.get("class", "unknown"),
                "score": prediction.get("confidence", 0.0),
                "bounds": {
                    "xmin": prediction.get("x", 0) - prediction.get("width", 0) / 2,
                    "ymin": prediction.get("y", 0) - prediction.get("height", 0) / 2,
                    "xmax": prediction.get("x", 0) + prediction.get("width", 0) / 2,
                    "ymax": prediction.get("y", 0) + prediction.get("height", 0) / 2,
                },
                "points": prediction.get("points", []),  # Polygon points
            }

            # Convert polygon to mask image if needed
            if "points" in prediction and prediction["points"]:
                try:
                    mask_data["mask"] = self._polygon_to_mask(
                        prediction["points"],
                        image_width,
                        image_height
                    )
                except Exception:
                    # Silently handle mask generation errors
                    mask_data["mask"] = ""
            else:
                mask_data["mask"] = ""

            masks.append(mask_data)

        return {
            "mode": selected_mode,
            "masks": masks,
            "total_detections": len(masks)
        }

    # Note: _auto_select_mode removed - new workflow only supports face segmentation

    def _polygon_to_mask(self, points: list, width: int, height: int) -> str:
        """
        Convert polygon points to base64 encoded mask image

        Args:
            points: List of polygon points [{"x": x, "y": y}, ...]
            width: Image width
            height: Image height

        Returns:
            Base64 encoded PNG mask
        """
        # Create blank image
        mask_img = Image.new('L', (width, height), 0)

        # Draw polygon (would need PIL ImageDraw)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask_img)

        # Convert points to tuple format
        polygon = [(p["x"], p["y"]) for p in points]

        # Fill polygon with white
        draw.polygon(polygon, fill=255)

        # Convert to base64
        buffer = BytesIO()
        mask_img.save(buffer, format="PNG")
        mask_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return mask_base64


# Example usage
if __name__ == "__main__":
    # Initialize with your API key
    api_key = os.getenv("ROBOFLOW_API_KEY", "your_api_key_here")
    segmenter = RoboflowSegmentation(api_key)

    # Test with an image
    result = segmenter.segment_image(
        image_path="test_image.jpg",
        mode="auto",
        use_cache=True
    )

    print(f"Mode: {result['mode']}")
    print(f"Detections: {result['total_detections']}")

    for mask in result['masks']:
        print(f"- {mask['label']}: {mask['score']:.2f}")
