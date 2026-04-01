/**
 * API Integration for Segment Art
 *
 * NOTE: Segmentation APIs have been removed and replaced with Roboflow.
 * Use api-roboflow.ts for all segmentation operations.
 *
 * This file now only contains:
 * - Content-aware fill (DALL-E)
 * - Prompt parsing (GPT)
 * - Utility functions
 */

// API Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// API Configuration
const API_CONFIG = {
  timeout: 300000, // 5 minutes timeout for image generation
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// OPENAI API - Content Aware Fill & Prompt Parsing
// ============================================================================

/**
 * Content-aware fill using DALL-E
 * Fills gaps in images with AI-generated content
 */
export async function contentAwareFill(params: {
  imageUrl: string;
  maskUrl: string;
  prompt?: string;
  size?: '256x256' | '512x512' | '1024x1024';
}): Promise<string> {
  const { imageUrl, maskUrl, prompt = 'fill the gap naturally', size = '512x512' } = params;

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_key_here') {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file');
  }

  try {
    console.log('Calling DALL-E for content-aware fill...');
    console.log('Prompt:', prompt);
    console.log('Size:', size);

    // Convert data URLs to blobs if needed
    const imageBlob = await dataUrlToBlob(imageUrl);
    const maskBlob = await dataUrlToBlob(maskUrl);

    // Create form data
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('mask', maskBlob, 'mask.png');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', size);

    // Call DALL-E edit endpoint
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DALL-E API error:', error);
      throw new Error(`DALL-E API failed: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      throw new Error('No image returned from DALL-E');
    }

    const filledImageUrl = result.data[0].url;
    console.log('Content-aware fill complete!');

    return filledImageUrl;
  } catch (error) {
    console.error('Error in content-aware fill:', error);
    throw error;
  }
}

/**
 * Parse natural language segmentation prompt using GPT
 * Example: "eyes and nose" -> ["left_eye", "right_eye", "nose"]
 */
export async function parseSegmentationPrompt(
  prompt: string,
  availableLabels: string[]
): Promise<string[]> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_key_here') {
    // Fallback to simple keyword matching if no API key
    console.warn('OpenAI API key not configured, using keyword matching fallback');
    return fallbackPromptParsing(prompt, availableLabels);
  }

  try {
    console.log('Parsing prompt with GPT:', prompt);

    const systemPrompt = `You are a helpful assistant that maps natural language to segmentation labels.
Available labels: ${availableLabels.join(', ')}

When given a prompt, return ONLY a JSON array of matching label names.
Examples:
- "eyes" -> ["left_eye", "right_eye"]
- "face without hair" -> ["skin", "left_brow", "right_brow", "left_eye", "right_eye", "nose", "mouth"]
- "sky and trees" -> ["sky", "tree"]

Rules:
- Return exact label names from the available list
- Expand plural/grouped terms (e.g., "eyes" includes both left and right)
- Return empty array if no matches`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.warn('GPT API failed, using fallback');
      return fallbackPromptParsing(prompt, availableLabels);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return fallbackPromptParsing(prompt, availableLabels);
    }

    // Parse JSON response
    try {
      const labels = JSON.parse(content);
      if (Array.isArray(labels)) {
        console.log('GPT parsed labels:', labels);
        return labels;
      }
    } catch (e) {
      console.warn('Failed to parse GPT response, using fallback');
    }

    return fallbackPromptParsing(prompt, availableLabels);
  } catch (error) {
    console.error('Error parsing prompt with GPT:', error);
    return fallbackPromptParsing(prompt, availableLabels);
  }
}

/**
 * Fallback prompt parsing using keyword matching
 */
function fallbackPromptParsing(prompt: string, availableLabels: string[]): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const matchedLabels: string[] = [];

  // Simple keyword expansion rules
  const expansions: Record<string, string[]> = {
    'eyes': ['left_eye', 'right_eye'],
    'eye': ['left_eye', 'right_eye'],
    'ears': ['left_ear', 'right_ear'],
    'ear': ['left_ear', 'right_ear'],
    'brows': ['left_brow', 'right_brow'],
    'eyebrows': ['left_brow', 'right_brow'],
    'face': ['skin', 'left_brow', 'right_brow', 'left_eye', 'right_eye', 'nose', 'mouth'],
  };

  // Check for expansions
  for (const [keyword, labels] of Object.entries(expansions)) {
    if (lowerPrompt.includes(keyword)) {
      matchedLabels.push(...labels.filter(l => availableLabels.includes(l)));
    }
  }

  // Check for direct label matches
  for (const label of availableLabels) {
    const labelLower = label.toLowerCase().replace(/_/g, ' ');
    if (lowerPrompt.includes(labelLower) || lowerPrompt.includes(label.toLowerCase())) {
      if (!matchedLabels.includes(label)) {
        matchedLabels.push(label);
      }
    }
  }

  console.log('Fallback parsing matched:', matchedLabels);
  return matchedLabels;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create improved mask with edge feathering and expansion
 */
export function createImprovedMask(params: {
  maskDataUrl: string;
  expandPixels: number;
  featherPixels: number;
}): Promise<string> {
  const { maskDataUrl, expandPixels, featherPixels } = params;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original mask
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Create a copy for processing
      const newData = new Uint8ClampedArray(data);

      // Expand mask
      if (expandPixels > 0) {
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;

            if (data[idx + 3] > 0) {
              // Found a white pixel, expand around it
              for (let dy = -expandPixels; dy <= expandPixels; dy++) {
                for (let dx = -expandPixels; dx <= expandPixels; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;

                  if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                    const nIdx = (ny * canvas.width + nx) * 4;
                    newData[nIdx + 3] = 255; // Make opaque
                  }
                }
              }
            }
          }
        }
      }

      // Apply expansion
      for (let i = 0; i < data.length; i++) {
        data[i] = newData[i];
      }

      // Feather edges
      if (featherPixels > 0) {
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;

            if (data[idx + 3] > 0) {
              // Calculate distance to edge
              let minDist = featherPixels;

              for (let dy = -featherPixels; dy <= featherPixels; dy++) {
                for (let dx = -featherPixels; dx <= featherPixels; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;

                  if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                    const nIdx = (ny * canvas.width + nx) * 4;

                    if (data[nIdx + 3] === 0) {
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      minDist = Math.min(minDist, dist);
                    }
                  }
                }
              }

              // Apply feathering
              const alpha = Math.min(255, (minDist / featherPixels) * 255);
              data[idx + 3] = alpha;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load mask image'));
    img.src = maskDataUrl;
  });
}

/**
 * Local content-aware fill using average color
 * Fast and free alternative to DALL-E
 */
export async function localContentAwareFill(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

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
      const data = imageData.data;

      // Find transparent pixels
      const transparentPixels: Array<{ x: number; y: number; idx: number }> = [];

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          if (data[idx + 3] === 0) {
            transparentPixels.push({ x, y, idx });
          }
        }
      }

      // Fill each transparent pixel with average of surrounding pixels
      for (const pixel of transparentPixels) {
        const { x, y, idx } = pixel;

        let r = 0, g = 0, b = 0, count = 0;
        const radius = 3;

        // Sample surrounding pixels
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
              const nIdx = (ny * canvas.width + nx) * 4;

              if (data[nIdx + 3] > 0) {
                r += data[nIdx];
                g += data[nIdx + 1];
                b += data[nIdx + 2];
                count++;
              }
            }
          }
        }

        if (count > 0) {
          data[idx] = r / count;
          data[idx + 1] = g / count;
          data[idx + 2] = b / count;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Convert data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}

// ============================================================================
// DEPRECATED FUNCTIONS - Use api-roboflow.ts instead
// ============================================================================

/**
 * @deprecated Use smartSegment from api-roboflow.ts instead
 */
export async function detectObjects(): Promise<never> {
  throw new Error('detectObjects has been removed. Use Roboflow API instead (see api-roboflow.ts)');
}

/**
 * @deprecated Use smartSegment from api-roboflow.ts instead
 */
export async function segmentImage(): Promise<never> {
  throw new Error('segmentImage has been removed. Use Roboflow API instead (see api-roboflow.ts)');
}

/**
 * @deprecated Use detectImageType from api-roboflow.ts instead
 */
export async function detectImageType(): Promise<never> {
  throw new Error('detectImageType has been removed. Use Roboflow API instead (see api-roboflow.ts)');
}

/**
 * @deprecated Use segmentImage from api-roboflow.ts instead
 */
export async function segmentLandscape(): Promise<never> {
  throw new Error('segmentLandscape has been removed. Use Roboflow API instead (see api-roboflow.ts)');
}

/**
 * @deprecated Use smartSegment from api-roboflow.ts instead
 */
export async function smartSegment(): Promise<never> {
  throw new Error('smartSegment has been removed. Use Roboflow API instead (see api-roboflow.ts)');
}

/**
 * @deprecated PhotoRoom API removed
 */
export async function removeBackground(): Promise<never> {
  throw new Error('removeBackground has been removed. Use Roboflow workflow instead (see api-roboflow.ts)');
}
