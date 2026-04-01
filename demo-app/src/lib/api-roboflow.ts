/**
 * Roboflow API Integration for Segment Art
 *
 * This replaces the Hugging Face API calls with Roboflow workflow calls
 * through the Python backend server
 */

// Python backend URL
const PYTHON_BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:5000';

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Segment image using Roboflow workflow
 *
 * @param imageBlob - Image blob to segment
 * @param mode - "auto" (detect best mode), "face", or "landscape"
 * @returns Segmentation masks with labels and bounds
 */
export async function segmentImage(
  imageBlob: Blob,
  mode: 'auto' | 'face' | 'landscape' = 'auto'
): Promise<{
  masks: Array<{
    label: string;
    mask: string;
    bounds: { xmin: number; ymin: number; xmax: number; ymax: number };
    score?: number;
    points?: Array<{ x: number; y: number }>;
  }>;
  mode: 'face' | 'landscape';
  total_detections: number;
}> {
  const base64 = await blobToBase64(imageBlob);

  const response = await fetch(`${PYTHON_BACKEND_URL}/api/segment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      mode: mode,
      use_cache: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to segment image');
  }

  return await response.json();
}

/**
 * Smart segmentation - automatically segments image using Roboflow workflow
 * This is the main function to use, matching the existing API
 *
 * @param imageBlob - Image blob to segment
 * @returns Segmentation results with detected regions
 */
export async function smartSegment(imageBlob: Blob): Promise<{
  masks: Array<{
    label: string;
    mask: string;
    bounds: { xmin: number; ymin: number; xmax: number; ymax: number };
  }>;
  imageType: 'face' | 'landscape';
}> {
  // Run segmentation directly (no image type detection needed)
  const result = await segmentImage(imageBlob, 'auto');

  return {
    masks: result.masks,
    imageType: result.mode
  };
}

/**
 * Check if Python backend is available
 *
 * @returns true if backend is running and configured
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`);
    const result = await response.json();
    return result.status === 'ok' && result.roboflow_configured === true;
  } catch {
    return false;
  }
}

// Export configuration for debugging
export const config = {
  backendUrl: PYTHON_BACKEND_URL,
  checkHealth: checkBackendHealth
};
