# API Documentation - Extract Art Feature

## Component API

### `<ExtractArt />`

Main component for the Extract Art feature.

**Import:**
```typescript
import ExtractArt from '@/components/ExtractArt';
```

**Usage:**
```tsx
<ExtractArt />
```

**Props:** None (self-contained component)

**State Management:** Internal (useState)

---

### `<KonvaCanvas />`

Canvas rendering engine for image manipulation.

**Import:**
```typescript
import { KonvaCanvas } from '@/components/KonvaCanvas';
```

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `width` | `number` | Yes | - | Canvas width in pixels |
| `height` | `number` | Yes | - | Canvas height in pixels |
| `brushSize` | `number` | Yes | - | Brush size (1-100) |
| `brushColor` | `string` | Yes | - | Brush color (hex) |
| `mode` | `SelectionMode` | Yes | - | Current tool mode |
| `opacity` | `number` | Yes | - | Brush opacity (0-1) |
| `image` | `string \| null` | Yes | - | Image data URL |
| `onExtract` | `(dataUrl: string, type: string) => void` | Yes | - | Callback when extraction completes |
| `brushType` | `'normal' \| 'soft' \| 'stroke'` | No | `'normal'` | Brush rendering type |
| `brushHardness` | `number` | No | `0.5` | Soft brush hardness (0-1) |
| `brushSpacing` | `number` | No | `0.1` | Stroke brush spacing (0.05-0.5) |
| `featherAmount` | `number` | No | `0` | Selection feathering (0-100) |

**Types:**
```typescript
type SelectionMode = 'rectangle' | 'lasso' | 'brush' | 'circle' | 'eraser';
```

**Usage Example:**
```tsx
<KonvaCanvas
  width={800}
  height={600}
  brushSize={20}
  brushColor="#ffffff"
  mode="brush"
  opacity={0.95}
  image={uploadedImage}
  onExtract={handleExtract}
  brushType="soft"
  brushHardness={0.7}
  featherAmount={5}
/>
```

---

## Library Functions

### `detectObjects(imageBlob: Blob)`

Detects objects in an image using DETR model.

**Import:**
```typescript
import { detectObjects } from '@/lib/api';
```

**Parameters:**
- `imageBlob`: `Blob` - Image file as blob

**Returns:**
```typescript
Promise<Array<{
  label: string;
  box: {
    xmin: number; // 0-1 normalized
    ymin: number; // 0-1 normalized
    xmax: number; // 0-1 normalized
    ymax: number; // 0-1 normalized
  }
}>>
```

**Example:**
```typescript
const blob = await fetch(imageUrl).then(r => r.blob());
const detections = await detectObjects(blob);

// Result:
// [
//   { label: "dragon", box: { xmin: 0.2, ymin: 0.3, xmax: 0.6, ymax: 0.8 } },
//   { label: "cloud", box: { xmin: 0.1, ymin: 0.1, xmax: 0.3, ymax: 0.3 } }
// ]
```

**Errors:**
- Throws if Hugging Face API key is invalid
- Throws if model is loading
- Throws if rate limit exceeded

---

### `removeBackground(imageBlob: Blob)`

Removes background from image using PhotoRoom API.

**Import:**
```typescript
import { removeBackground } from '@/lib/api';
```

**Parameters:**
- `imageBlob`: `Blob` - Image file as blob

**Returns:**
```typescript
Promise<string> // Blob URL of image with transparent background
```

**Example:**
```typescript
const blob = await fetch(imageUrl).then(r => r.blob());
const resultUrl = await removeBackground(blob);

// Use result
setImage(resultUrl);
```

**Errors:**
- Throws if PhotoRoom API key is invalid
- Throws if image is too large (>10MB)
- Throws if rate limit exceeded

---

## Events & Callbacks

### `onExtract`

Called when a region is successfully extracted.

**Signature:**
```typescript
(dataUrl: string, type: string) => void
```

**Parameters:**
- `dataUrl`: Base64 encoded PNG image data URL
- `type`: Selection type ("rectangle", "lasso", "brush", "circle")

**Example:**
```typescript
const handleExtract = (dataUrl: string, type: string) => {
  console.log(`Extracted ${type} selection`);
  setExtractedAssets(prev => [...prev, { url: dataUrl, type }]);
};
```

---

## State Types

### `BrushSettings`

```typescript
interface BrushSettings {
  size: number;        // 1-100
  hardness: number;    // 0-1
  opacity: number;     // 0-1
  color: string;       // hex color
  type: 'normal' | 'soft' | 'stroke';
  spacing: number;     // 0.05-0.5
}
```

### `ExtractedAsset`

```typescript
interface ExtractedAsset {
  url: string;   // Blob URL
  type: string;  // Description
}
```

---

## Hooks Usage

### `useToast`

Used for user notifications.

**Import:**
```typescript
import { useToast } from '@/hooks/use-toast';
```

**Usage:**
```typescript
const { toast } = useToast();

toast({
  title: "Success",
  description: "Image extracted successfully"
});

toast({
  title: "Error",
  description: "Failed to process image",
  variant: "destructive"
});
```

---

## Canvas Methods

### Internal Canvas API (via Konva)

Accessed through stage/layer refs:

```typescript
const stage = stageRef.current;
const layer = stage.findOne('Layer');
const dataURL = layer.toDataURL();
```

**Common Operations:**

**Get Stage:**
```typescript
const stage = (window as any).Konva.stages[0];
```

**Export Layer:**
```typescript
const layer = stage.findOne('.brush-layer');
const dataURL = layer.toDataURL({
  mimeType: 'image/png',
  quality: 1.0,
  pixelRatio: 2 // For higher quality
});
```

**Clear Canvas:**
```typescript
const canvas = layer.getCanvas()._canvas;
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

---

## Environment Variables

Required in `.env`:

```env
# Hugging Face API (Object Detection)
VITE_HUGGING_FACE_API_KEY=hf_xxxxx

# PhotoRoom API (Background Removal)
VITE_PHOTOROOM_API_KEY=xxxxx
```

**Access in Code:**
```typescript
const HF_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;
const PHOTOROOM_API_KEY = import.meta.env.VITE_PHOTOROOM_API_KEY;
```

---

## Error Handling

### API Errors

```typescript
try {
  await detectObjects(blob);
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle invalid API key
  } else if (error.message.includes('Rate limit')) {
    // Handle rate limit
  } else if (error.message.includes('loading')) {
    // Model is loading, retry
  }
}
```

### Common Error Messages

- `"Hugging Face API key is not configured or invalid"`
- `"PhotoRoom API key is not configured or invalid"`
- `"Rate limit exceeded, please wait before trying again"`
- `"Model is currently loading, please wait a moment and try again"`
- `"Image file too large. Please use a smaller image."`

---

## Performance Considerations

### Image Optimization

```typescript
// Images auto-scaled to fit canvas
const scale = Math.min(width / img.width, height / img.height);
setImageSize({
  width: img.width * scale,
  height: img.height * scale
});
```

### Memory Management

```typescript
// Cleanup blob URLs
URL.revokeObjectURL(blobUrl);

// Clear canvas on unmount
useEffect(() => {
  return () => {
    // Cleanup code
  };
}, []);
```

---

## Type Definitions

Full TypeScript definitions available in source files:
- `src/components/ExtractArt.tsx`
- `src/components/KonvaCanvas.tsx`
- `src/lib/api.ts`
