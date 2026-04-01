# Segment Art - Python Backend (Roboflow Integration)

Flask API server that provides Roboflow-powered segmentation for the Segment Art React app.

## Setup

### 1. Install Python Dependencies

```bash
cd python-backend
pip install -r ../requirements.txt
```

### 2. Configure Environment Variables

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` and add your Roboflow API key:
```env
ROBOFLOW_API_KEY=your_actual_key_here
```

### 3. Start the Server

```bash
python app.py
```

The server will start at **http://localhost:5000**

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "roboflow_configured": true
}
```

### Segment Image
```http
POST /api/segment
Content-Type: application/json
```

Request:
```json
{
  "image": "base64_encoded_image",
  "mode": "auto",  // "auto" | "face" | "landscape"
  "use_cache": true
}
```

Response:
```json
{
  "mode": "face",
  "masks": [
    {
      "label": "left_eye",
      "score": 0.95,
      "mask": "base64_encoded_mask",
      "bounds": {
        "xmin": 120,
        "ymin": 80,
        "xmax": 180,
        "ymax": 120
      }
    }
  ],
  "total_detections": 5
}
```

### Detect Image Type
```http
POST /api/detect-type
Content-Type: application/json
```

Request:
```json
{
  "image": "base64_encoded_image"
}
```

Response:
```json
{
  "type": "face",
  "confidence": 0.95,
  "face_detections": 5,
  "landscape_detections": 2
}
```

## Roboflow Workflow

The backend uses your Roboflow workflow:
- **Workspace**: `segmentationslotart`
- **Workflow ID**: `custom-workflow-3`

### Workflow Structure

1. **Input**: Image (InferenceImage)
2. **Models**:
   - Legacy: `slot-art-segmentation-7s7rm/2`
   - Face Mode: `slot-art-segmentation-7s7rm/2`
   - Landscape Mode: `yolov11n-seg-640`
3. **Outputs**:
   - `output_landscape_mode`: Landscape segmentation results
   - `output_face_mode`: Face segmentation results
   - `predictions`: Legacy model predictions

## Integration with React Frontend

Update `demo-app/src/lib/api.ts` to call this backend:

```typescript
// Replace Hugging Face API calls with Python backend calls
const PYTHON_BACKEND_URL = 'http://localhost:5000';

export async function detectImageType(imageBlob: Blob): Promise<'face' | 'landscape'> {
  const base64 = await blobToBase64(imageBlob);

  const response = await fetch(`${PYTHON_BACKEND_URL}/api/detect-type`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 })
  });

  const result = await response.json();
  return result.type;
}

export async function segmentImage(imageBlob: Blob): Promise<{masks: Array<...>}> {
  const base64 = await blobToBase64(imageBlob);

  const response = await fetch(`${PYTHON_BACKEND_URL}/api/segment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      mode: 'auto',
      use_cache: true
    })
  });

  return await response.json();
}
```

## Development

### Run in Development Mode
```bash
python app.py
```

### Run in Production Mode
```bash
export FLASK_ENV=production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:5000/health

# Segment image (replace with actual base64 image)
curl -X POST http://localhost:5000/api/segment \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_string_here", "mode": "auto"}'
```

## Architecture

```
React Frontend (Port 3000)
    ↓ HTTP Request (base64 image)
Flask Backend (Port 5000)
    ↓ API Call
Roboflow Workflow
    ↓ Returns segmentation masks
Flask Backend
    ↓ Formatted response
React Frontend (displays segments)
```

## Notes

- The backend converts Roboflow polygon outputs to base64 mask images for compatibility with the existing frontend
- Caching is enabled by default for faster repeated requests
- The auto-mode intelligently selects face or landscape based on detection counts
