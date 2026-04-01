import { writePsd, Psd, Layer as PsdLayer } from 'ag-psd';

interface Layer {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  visible: boolean;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Converts a data URL to an ImageData object
 */
async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Creates layer mask from an image with transparency
 */
function createLayerMask(imageData: ImageData): Uint8Array {
  const mask = new Uint8Array(imageData.width * imageData.height);
  const data = imageData.data;

  for (let i = 0; i < imageData.width * imageData.height; i++) {
    // Use alpha channel as mask (255 = opaque, 0 = transparent)
    mask[i] = data[i * 4 + 3];
  }

  return mask;
}

/**
 * Exports layers to a PSD file with non-destructive masks
 * @param baseImage - The original uploaded image (base layer)
 * @param layers - Array of extracted layers with position data
 * @param canvasWidth - Width of the canvas
 * @param canvasHeight - Height of the canvas
 * @returns ArrayBuffer containing the PSD file data
 */
export async function exportToPsd(
  baseImage: string,
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number
): Promise<ArrayBuffer> {
  // Load base image
  const baseImageData = await dataUrlToImageData(baseImage);

  // Create PSD structure
  const psd: Psd = {
    width: canvasWidth,
    height: canvasHeight,
    children: []
  };

  // Add base image layer (background)
  const baseLayer: PsdLayer = {
    name: 'Base Image',
    canvas: await createCanvasFromImageData(baseImageData),
    left: 0,
    top: 0,
    right: baseImageData.width,
    bottom: baseImageData.height,
    opacity: 255,
    blendMode: 'normal',
  };

  psd.children?.push(baseLayer);

  // Add extracted layers with masks
  for (const layer of layers) {
    try {
      const layerImageData = await dataUrlToImageData(layer.url);

      // Create canvas for the layer
      const layerCanvas = await createCanvasFromImageData(layerImageData);

      // Create layer mask from transparency
      const mask = createLayerMask(layerImageData);

      // Create PSD layer with mask
      const psdLayer: PsdLayer = {
        name: layer.name,
        canvas: layerCanvas,
        left: layer.x,
        top: layer.y,
        right: layer.x + layer.width,
        bottom: layer.y + layer.height,
        opacity: layer.visible ? 255 : 0,
        blendMode: 'normal',
        mask: {
          canvas: createMaskCanvas(mask, layerImageData.width, layerImageData.height),
          left: layer.x,
          top: layer.y,
          right: layer.x + layer.width,
          bottom: layer.y + layer.height,
          defaultColor: 0,
          disabled: false,
          positionRelativeToLayer: true
        }
      };

      psd.children?.push(psdLayer);
    } catch (error) {
      console.error(`Failed to process layer ${layer.name}:`, error);
    }
  }

  // Write PSD to ArrayBuffer
  const buffer = writePsd(psd, {
    generateThumbnail: true,
    trimImageData: false
  });

  return buffer;
}

/**
 * Creates a canvas from ImageData
 */
async function createCanvasFromImageData(imageData: ImageData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Creates a mask canvas from a Uint8Array mask
 */
function createMaskCanvas(mask: Uint8Array, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Convert mask to grayscale RGBA
  for (let i = 0; i < mask.length; i++) {
    const value = mask[i];
    data[i * 4] = value;     // R
    data[i * 4 + 1] = value; // G
    data[i * 4 + 2] = value; // B
    data[i * 4 + 3] = 255;   // A
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Downloads a PSD file
 */
export function downloadPsd(buffer: ArrayBuffer, filename: string = 'extracted-layers.psd'): void {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
