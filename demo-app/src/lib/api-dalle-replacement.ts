// Helper function to resize image to nearest valid DALL-E size (256, 512, 1024)
async function resizeImageForDallE(blob: Blob): Promise<{ blob: Blob; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Determine the best DALL-E size (256, 512, or 1024)
      const maxDimension = Math.max(img.width, img.height);
      let targetSize: number;

      if (maxDimension <= 256) {
        targetSize = 256;
      } else if (maxDimension <= 512) {
        targetSize = 512;
      } else {
        targetSize = 1024;
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw image centered and scaled to fit
      const scale = targetSize / maxDimension;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (targetSize - scaledWidth) / 2;
      const y = (targetSize - scaledHeight) / 2;

      // Fill with white background (DALL-E requires opaque images)
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, targetSize, targetSize);

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      canvas.toBlob((resizedBlob) => {
        if (resizedBlob) {
          resolve({ blob: resizedBlob, size: targetSize });
        } else {
          reject(new Error('Failed to create resized blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Content-aware fill using OpenAI DALL-E Image Edit API
export async function contentAwareFill(params: {
  image: Blob;
  mask: Blob;
  prompt?: string;
}): Promise<string> {
  const apiKeys = validateApiKeys();

  if (!apiKeys.openai) {
    throw new Error('OpenAI API key is not configured or invalid. Please check your .env file.');
  }

  let retries = API_CONFIG.maxRetries;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      console.log('Starting content-aware fill with OpenAI DALL-E...');

      // Resize images to valid DALL-E sizes
      const resizedImage = await resizeImageForDallE(params.image);
      const resizedMask = await resizeImageForDallE(params.mask);

      console.log(`Resized to ${resizedImage.size}x${resizedImage.size} for DALL-E`);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('image', resizedImage.blob, 'image.png');
      formData.append('mask', resizedMask.blob, 'mask.png');
      formData.append('prompt', params.prompt || 'natural, seamless, photorealistic fill');
      formData.append('n', '1');
      formData.append('size', `${resizedImage.size}x${resizedImage.size}`);

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI DALL-E API error:', errorText);

        let errorMessage = 'Failed to fill transparent areas';

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            const errMsg = errorData.error.message || errorData.error;

            if (errMsg.includes('rate limit') || errMsg.includes('Rate limit')) {
              throw new Error('OpenAI rate limit exceeded. Please wait before trying again.');
            }
            if (errMsg.includes('quota') || errMsg.includes('billing')) {
              throw new Error('OpenAI quota exceeded. Please check your billing details at https://platform.openai.com/account/billing');
            }
            if (errMsg.includes('invalid') && errMsg.includes('key')) {
              throw new Error('Invalid OpenAI API key. Please check your configuration.');
            }
            if (errMsg.includes('content_policy')) {
              throw new Error('Content policy violation. Please try a different prompt or image.');
            }

            errorMessage = errMsg;
          }
        } catch (parseError) {
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your configuration.');
          }
          if (response.status === 429) {
            throw new Error('OpenAI rate limit exceeded. Please wait before trying again.');
          }
          if (response.status === 402) {
            throw new Error('OpenAI quota exceeded. Please check your billing details.');
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from OpenAI DALL-E API');
      }

      // Download the image from OpenAI's URL and convert to blob URL
      const imageUrl = data.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const blobUrl = URL.createObjectURL(imageBlob);

      console.log('Content-aware fill successful with OpenAI DALL-E!');
      return blobUrl;

    } catch (error) {
      console.error('Content-aware fill attempt failed:', error);
      lastError = error instanceof Error ? error : new Error('Failed to fill transparent areas');

      if (error instanceof Error && error.message.includes('rate limit') && retries > 1) {
        console.log(`Rate limited, waiting ${API_CONFIG.retryDelay * 2}ms before retry...`);
        await delay(API_CONFIG.retryDelay * 2);
        retries--;
        continue;
      }

      if (retries > 1) {
        await delay(API_CONFIG.retryDelay);
        retries--;
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Failed to fill transparent areas after multiple retries');
}

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
