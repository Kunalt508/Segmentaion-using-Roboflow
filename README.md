# 🎨 Segment Art - AI Image Segmentation Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF.svg)](https://vitejs.dev/)

Professional image segmentation tool powered by **AI and Roboflow workflows**, supporting both **face and landscape segmentation** with high precision.

---

##  Key Features

###  Smart Segmentation (Roboflow Powered)

* Unified segmentation pipeline using Roboflow workflows
* Automatic image type detection (face vs landscape)
* Face mode: detailed facial feature segmentation
* Landscape mode: object and scene segmentation
* Optimized model selection for best results

---

##  New Architecture (Roboflow Integration)

###  System Overview

```
Frontend (React)
      ↓
Python Backend (Flask)
      ↓
Roboflow Workflow (3 Models)
      ↓
Processed Masks → Frontend
```

###  Roboflow Workflow Details

* **Workspace**: `segmentationslotart`
* **Workflow ID**: `custom-workflow-3`
* **Models Used**:

  * Face Model: `slot-art-segmentation-7s7rm/2`
  * Landscape Model: `yolov11n-seg-640`
  * Legacy Model (fallback support)

---

##  Quick Start

###  Clone Repository

```bash
git clone https://github.com/your-username/Segmentation-Art.git
cd Segmentation-Art
```

---

###  Setup Python Backend

```bash
pip install -r requirements.txt

cd python-backend
cp .env.example .env
```

Add your API key:

```env
ROBOFLOW_API_KEY=your_api_key_here
```

Run backend:

```bash
python app.py
```

Backend runs on: **http://localhost:5000**

---

###  Setup Frontend

```bash
cd demo-app
npm install
```

Create `.env`:

```env
VITE_PYTHON_BACKEND_URL=http://localhost:5000
```

Run app:

```bash
npm run dev
```

Frontend runs on: **http://localhost:3000**

---

##  API Endpoints

### Health Check

```
GET /health
```

### Detect Image Type

```
POST /api/detect-type
```

### Segment Image

```
POST /api/segment
```

---

##  How It Works

1. Upload image in frontend
2. Image sent to Flask backend (base64)
3. Backend calls Roboflow workflow
4. Workflow runs multiple models simultaneously
5. Backend selects best output:

   * ≥3 face detections → Face mode
   * Otherwise → Landscape mode
6. Polygon outputs converted to pixel masks
7. Masks returned to frontend

---

##  Segmentation Modes

###  Face Mode

* Detects facial features:

  * eyes, nose, mouth, ears, hair, skin

###  Landscape Mode

* Detects objects:

  * buildings, sky, roads, trees, people

---

##  Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Konva (canvas rendering)
* Tailwind CSS

### Backend

* Python
* Flask
* Roboflow Inference SDK
* Pillow

---

##  Project Structure

```
seg-art/
├── python-backend/
│   ├── app.py
│   ├── roboflow_api.py
│   └── .env.example
├── demo-app/
│   └── src/
└── requirements.txt
```

---

##  Development Commands

### Backend

```bash
python app.py
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

---

##  Performance

* AI detection: ~2–5 seconds
* Supports high-resolution images (up to 4K)
* Cached results for faster repeat processing

---

##  Security

* No image storage on server
* API keys stored in environment variables
* Local processing where possible

---

##  Troubleshooting

* Ensure backend is running on port 5000
* Verify API key is set correctly
* Check frontend `.env` configuration
* Confirm dependencies are installed

---

##  Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push and open Pull Request

---

##  Future Improvements

* Video segmentation
* Batch processing
* Cloud deployment
* Mobile support

---

##  License

MIT License

---

##  Acknowledgments

* Roboflow (workflow + inference)
* Open-source AI ecosystem
* React & Vite communities

---
