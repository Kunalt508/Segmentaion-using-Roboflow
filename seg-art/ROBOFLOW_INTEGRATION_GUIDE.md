# Roboflow Integration Guide for Segment Art

This guide explains how to integrate your Roboflow workflow into Segment Art.

## 🎯 Overview

**Current Setup (Hugging Face):**
- Face parsing: `jonathandinu/face-parsing`
- Panoptic segmentation: `facebook/mask2former-swin-base-coco-panoptic`
- Separate API calls for detection and segmentation

**New Setup (Roboflow):**
- Unified workflow with 3 models running simultaneously
- Workspace: `segmentationslotart`
- Workflow ID: `custom-workflow-3`
- Models:
  - Legacy: `slot-art-segmentation-7s7rm/2`
  - Face Mode: `slot-art-segmentation-7s7rm/2`
  - Landscape Mode: `yolov11n-seg-640`

## 📁 Files Created

```
seg-art/
├── requirements.txt                          # Updated with all Python dependencies
├── python-backend/                           # New Python backend
│   ├── app.py                               # Flask API server
│   ├── roboflow_api.py                      # Roboflow integration logic
│   ├── .env.example                         # Environment variable template
│   └── README.md                            # Backend documentation
└── demo-app/
    └── src/
        └── lib/
            └── api-roboflow.ts              # Frontend integration for Roboflow
```

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
# From project root
pip install -r requirements.txt
```

This installs:
- `inference-sdk` - Roboflow SDK
- `flask` - Web framework
- `flask-cors` - CORS support
- `Pillow` - Image processing
- `python-dotenv` - Environment variables

### Step 2: Configure Roboflow API Key

1. Copy environment file:
```bash
cd python-backend
cp .env.example .env
```

2. Edit `.env` and add your Roboflow API key:
```env
ROBOFLOW_API_KEY=your_actual_roboflow_key_here
```

### Step 3: Start Python Backend

```bash
cd python-backend
python app.py
```

Server starts at: **http://localhost:5000**

You should see:
```
Starting Segment Art API Server...
Roboflow configured: True
* Running on http://0.0.0.0:5000
```

### Step 4: Configure Frontend

Update `demo-app/.env`:
```env
VITE_PYTHON_BACKEND_URL=http://localhost:5000
```

### Step 5: Update Frontend Code (Optional)

To use Roboflow instead of Hugging Face, update `demo-app/src/components/SegmentArt.tsx`:

**Replace:**
```typescript
import { detectObjects, segmentImage, smartSegment } from '@/lib/api';
```

**With:**
```typescript
import { smartSegment, detectImageType, segmentImage } from '@/lib/api-roboflow';
```

The API interface is identical, so no other code changes needed!

## 🔄 How It Works

### Architecture Flow

```
┌─────────────────────┐
│   React Frontend    │
│   (Port 3000)       │
└──────────┬──────────┘
           │ POST /api/segment
           │ { image: "base64..." }
           ↓
┌─────────────────────┐
│   Flask Backend     │
│   (Port 5000)       │
└──────────┬──────────┘
           │ Inference SDK
           ↓
┌─────────────────────┐
│ Roboflow Workflow   │
│ segmentationslotart │
│ custom-workflow-3   │
└──────────┬──────────┘
           │ Runs 3 models:
           ├─ Face Mode Model
           ├─ Landscape Mode Model
           └─ Legacy Model
           ↓
┌─────────────────────┐
│   Returns Results   │
│ - output_face_mode  │
│ - output_landscape  │
│ - predictions       │
└─────────────────────┘
```

### Processing Steps

1. **Frontend sends image** (base64) to Python backend
2. **Backend saves to temp file** and calls Roboflow workflow
3. **Roboflow runs all 3 models** simultaneously
4. **Backend selects best output**:
   - If face detections ≥ 3 → use face mode
   - Otherwise → use landscape mode
5. **Backend converts polygons to masks**:
   - Roboflow returns polygon points
   - Python draws polygon on blank image
   - Converts to base64 PNG mask
6. **Backend returns standardized format**:
   ```json
   {
     "mode": "face",
     "masks": [
       {
         "label": "left_eye",
         "score": 0.95,
         "mask": "base64_png...",
         "bounds": {"xmin": 120, "ymin": 80, "xmax": 180, "ymax": 120}
       }
     ],
     "total_detections": 5
   }
   ```
7. **Frontend uses masks** exactly like before

## 📊 API Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "roboflow_configured": true
}
```

### Detect Image Type
```bash
curl -X POST http://localhost:5000/api/detect-type \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data"}'
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

### Segment Image
```bash
curl -X POST http://localhost:5000/api/segment \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_image_data",
    "mode": "auto",
    "use_cache": true
  }'
```

## 🧪 Testing

### Test Python Backend Directly

```python
from roboflow_api import RoboflowSegmentation
import os

# Initialize
api_key = os.getenv("ROBOFLOW_API_KEY")
segmenter = RoboflowSegmentation(api_key)

# Test segmentation
result = segmenter.segment_image(
    image_path="test_image.jpg",
    mode="auto",
    use_cache=True
)

print(f"Mode: {result['mode']}")
print(f"Detections: {result['total_detections']}")
```

### Test Frontend Integration

1. Start both servers:
```bash
# Terminal 1: Python backend
cd python-backend
python app.py

# Terminal 2: React frontend
cd demo-app
npm run dev
```

2. Open http://localhost:3000
3. Upload an image
4. Click "Detect Regions"
5. Check browser console for logs

## 🔍 Understanding Roboflow Workflow Output

### Workflow Structure

Your Roboflow workflow returns 3 outputs:

```json
{
  "output_face_mode": [
    {
      "class": "left_eye",
      "confidence": 0.95,
      "x": 150,      // Center X
      "y": 100,      // Center Y
      "width": 60,
      "height": 40,
      "points": [    // Polygon points
        {"x": 120, "y": 80},
        {"x": 180, "y": 80},
        {"x": 180, "y": 120},
        {"x": 120, "y": 120}
      ]
    }
  ],
  "output_landscape_mode": [...],
  "predictions": [...]
}
```

### Data Conversion

**Roboflow Format** → **Segment Art Format**

```python
# Roboflow gives you:
{
  "class": "left_eye",
  "points": [{"x": 120, "y": 80}, ...]  # Polygon
}

# We convert to:
{
  "label": "left_eye",
  "mask": "iVBORw0KGgo..."  # Base64 PNG mask
  "bounds": {"xmin": 120, "ymin": 80, "xmax": 180, "ymax": 120}
}
```

The polygon is rasterized into a pixel-perfect mask image.

## 🎨 Face Mode vs Landscape Mode

### Face Mode (slot-art-segmentation-7s7rm/2)
Detects facial features:
- left_eye, right_eye
- nose, mouth
- left_ear, right_ear
- hair, skin
- etc.

**Triggered when:** ≥3 high-confidence face detections

### Landscape Mode (yolov11n-seg-640)
Detects objects/scenes:
- person, car, tree
- building, sky, road
- animal, furniture
- etc.

**Triggered when:** <3 face detections

## 🔧 Customization

### Adjust Detection Threshold

Edit `python-backend/roboflow_api.py`:

```python
def _auto_select_mode(self, face_output, landscape_output):
    # Change threshold from 3 to 5 for stricter face detection
    face_count = sum(1 for p in face_output if p.get("confidence", 0) > 0.5)

    if face_count >= 5:  # Changed from 3
        return face_output

    return landscape_output
```

### Add Custom Labels

Map Roboflow classes to custom labels:

```python
LABEL_MAPPING = {
    "left_eye": "Left Eye",
    "right_eye": "Right Eye",
    # Add custom mappings
}

label = LABEL_MAPPING.get(prediction.get("class"), prediction.get("class"))
```

## 🚨 Troubleshooting

### Backend not starting
- Check: `ROBOFLOW_API_KEY` is set in `.env`
- Check: All dependencies installed (`pip install -r requirements.txt`)
- Check: Port 5000 is not in use

### Frontend can't connect to backend
- Check: Backend is running on port 5000
- Check: CORS is enabled (already configured in `app.py`)
- Check: `VITE_PYTHON_BACKEND_URL` in `demo-app/.env`

### No detections returned
- Check: Image is valid (not corrupted)
- Check: Roboflow API key has permissions
- Check: Model is not loading (check logs)

### Polygon to mask conversion fails
- Check: Points array is not empty
- Check: Image dimensions are valid
- Add error logging in `_polygon_to_mask()`

## 📈 Performance

- **Caching**: Enabled by default (faster repeated requests)
- **Model loading**: First request may take 30-60s while models load
- **Concurrent requests**: Flask handles multiple requests
- **Production**: Use `gunicorn` for better performance:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🎯 Next Steps

1. ✅ Test the integration with sample images
2. ✅ Verify both face and landscape modes work
3. ✅ Check console logs for proper workflow execution
4. ⬜ Deploy Python backend to production server
5. ⬜ Update frontend environment variables for production
6. ⬜ Monitor Roboflow API usage and costs

## 📚 Additional Resources

- [Roboflow Inference SDK Docs](https://inference.roboflow.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Segment Art API Documentation](./demo-app/src/lib/api.ts)

---

**Summary:** Your Segment Art app now uses Roboflow's custom workflow instead of Hugging Face APIs, giving you more control over the models and better performance!
