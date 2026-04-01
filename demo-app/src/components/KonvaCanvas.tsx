import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Rect, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';

interface Point {
  x: number;
  y: number;
}

interface BrushLine {
  points: number[];
  color: string;
  size: number;
  opacity: number;
  mode: string;
  type: 'normal' | 'soft' | 'stroke';
  hardness: number;
  spacing: number;
  innerRadius?: number;
  outerRadius?: number;
}

interface Selection {
  startX: number;
  startY: number;
  width?: number;
  height?: number;
  points?: number[];
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

interface DetectedRegion {
  label: string;
  mask: string; // base64 PNG image of the mask
  bounds: { xmin: number; ymin: number; xmax: number; ymax: number };
}

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

interface KonvaCanvasProps {
  width: number;
  height: number;
  brushSize: number;
  brushColor: string;
  mode: 'select' | 'rectangle' | 'lasso' | 'brush' | 'circle' | 'eraser';
  opacity: number;
  image: string | null;
  onSegment: (dataUrl: string, type: string, position?: { x: number; y: number; width: number; height: number }) => void;
  onImageUpdate?: (dataUrl: string) => void;
  brushType?: 'normal' | 'soft' | 'stroke';
  brushHardness?: number;
  brushSpacing?: number;
  featherAmount?: number;
  detectedRegions?: DetectedRegion[];
  hoveredRegion?: number | null;
  onHoverRegion?: (index: number | null) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  onSegmentSelection?: () => void;
  layers?: Layer[];
  baseLayerVisible?: boolean;
}

export function KonvaCanvas({
  width,
  height,
  brushSize,
  brushColor,
  mode,
  opacity,
  image,
  onSegment,
  onImageUpdate,
  brushType = 'normal',
  brushHardness = 0.5,
  brushSpacing = 0.1,
  featherAmount = 0,
  detectedRegions = [],
  hoveredRegion = null,
  onHoverRegion,
  onSelectionChange,
  onSegmentSelection,
  layers = [],
  baseLayerVisible = true
}: KonvaCanvasProps) {
  const [lines, setLines] = useState<BrushLine[]>([]);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [maskImages, setMaskImages] = useState<Map<number, HTMLImageElement>>(new Map());
  const [layerImages, setLayerImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [maskCanvases, setMaskCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map());
  const isDrawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const lastStrokeTime = useRef<number>(0);
  const stageRef = useRef<any>(null);
  const brushLayerRef = useRef<any>(null);
  const selectionLayerRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const shapeRef = useRef<any>(null);
  const currentLine = useRef<BrushLine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (image) {
      const img = new window.Image();
      img.src = image;
      img.onload = () => {
        const scale = Math.min(width / img.width, height / img.height);
        setImageSize({
          width: img.width * scale,
          height: img.height * scale
        });
        setImageElement(img);
      };
    }
  }, [image, width, height]);

  // Load mask images and pre-render canvases for fast pixel checking
  useEffect(() => {
    const loadMaskImages = async () => {
      const newMaskImages = new Map<number, HTMLImageElement>();
      const newMaskCanvases = new Map<number, HTMLCanvasElement>();

      for (let i = 0; i < detectedRegions.length; i++) {
        const region = detectedRegions[i];

        if (region.mask) {
          const img = new window.Image();
          img.src = `data:image/png;base64,${region.mask}`;

          // Wait for image to load
          await new Promise<void>((resolve) => {
            img.onload = () => {
              newMaskImages.set(i, img);

              // Pre-render canvas for fast pixel checking
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });

              if (ctx) {
                ctx.drawImage(img, 0, 0);
                newMaskCanvases.set(i, canvas);
              }

              resolve();
            };
            img.onerror = () => {
              resolve();
            };
          });
        }
      }

      setMaskImages(newMaskImages);
      setMaskCanvases(newMaskCanvases);
    };

    if (detectedRegions.length > 0) {
      loadMaskImages();
    } else {
      setMaskImages(new Map());
      setMaskCanvases(new Map());
    }
  }, [detectedRegions]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Listen for segment region event
  useEffect(() => {
    const handleSegmentEvent = (e: any) => {
      const regionIndex = e.detail;
      if (typeof regionIndex === 'number') {
        segmentRegion(regionIndex);
      }
    };

    window.addEventListener('segmentRegion', handleSegmentEvent);
    return () => window.removeEventListener('segmentRegion', handleSegmentEvent);
  }, [detectedRegions, maskImages, imageElement, imageSize]);

  // Load layer images when layers change
  useEffect(() => {
    const loadLayerImages = async () => {
      const newLayerImages = new Map<string, HTMLImageElement>();

      for (const layer of layers) {
        const img = new window.Image();
        img.src = layer.url;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            newLayerImages.set(layer.id, img);
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load layer image: ${layer.name}`);
            resolve();
          };
        });
      }

      setLayerImages(newLayerImages);
    };

    if (layers.length > 0) {
      loadLayerImages();
    } else {
      setLayerImages(new Map());
    }
  }, [layers]);

  const getImagePosition = () => {
    const offsetX = (width - imageSize.width) / 2;
    const offsetY = (height - imageSize.height) / 2;
    return { offsetX, offsetY };
  };

  const isPointInImage = (point: Point): boolean => {
    const { offsetX, offsetY } = getImagePosition();
    const x = point.x - offsetX;
    const y = point.y - offsetY;
    return x >= 0 && x <= imageSize.width && y >= 0 && y <= imageSize.height;
  };

  const handleDrawStart = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos || !imageElement || !isPointInImage(pos)) return;

    // Handle select mode - extract hovered region
    if (mode === 'select' && hoveredRegion !== null && detectedRegions[hoveredRegion]) {
      segmentRegion(hoveredRegion);
      return;
    }

    isDrawing.current = true;
    lastPoint.current = pos;
    lastStrokeTime.current = performance.now();

    if (mode === 'lasso') {
      setSelection({
        startX: pos.x,
        startY: pos.y,
        points: [pos.x, pos.y]
      });
      if (onSelectionChange) onSelectionChange(true);
    } else if (mode === 'brush' || mode === 'eraser') {
      const newLine = {
        points: [pos.x, pos.y],
        color: brushColor,
        size: brushSize,
        opacity: opacity,
        mode: mode,
        type: brushType,
        hardness: brushHardness,
        spacing: brushSpacing
      };
      currentLine.current = newLine;
      setLines(prev => [...prev, newLine]);
    }
  };

  const segmentRegion = (regionIndex: number) => {
    const region = detectedRegions[regionIndex];
    const maskImg = maskImages.get(regionIndex);

    if (!region || !imageElement || !maskImg) {
      return;
    }

    // Use ORIGINAL image dimensions, not scaled display size
    const originalWidth = imageElement.width;
    const originalHeight = imageElement.height;

    // Create canvas for the full image at ORIGINAL size
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the image at original size
    ctx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Load and apply mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = maskImg.width;
    maskCanvas.height = maskImg.height;
    const maskCtx = maskCanvas.getContext('2d');

    if (!maskCtx) return;

    maskCtx.drawImage(maskImg, 0, 0);

    // Apply feathering (blur) to soften edges
    const featherRadius = 3; // Blur radius in pixels
    maskCtx.filter = `blur(${featherRadius}px)`;
    maskCtx.drawImage(maskImg, 0, 0);
    maskCtx.filter = 'none';

    const maskData = maskCtx.getImageData(0, 0, maskImg.width, maskImg.height);

    // Debug: Analyze mask to understand format
    let whitePixels = 0, blackPixels = 0;
    for (let i = 0; i < maskData.data.length; i += 4) {
      const r = maskData.data[i];
      if (r > 128) whitePixels++;
      else blackPixels++;
    }

    // Auto-detect if mask appears inverted
    const isBackgroundRegion = region.label.toLowerCase().includes('background') ||
                                region.label.toLowerCase().includes('bg') ||
                                whitePixels > blackPixels * 3;

    // Apply mask as alpha channel with smooth gradients (feathering)
    for (let y = 0; y < originalHeight; y++) {
      for (let x = 0; x < originalWidth; x++) {
        const imageIdx = (y * originalWidth + x) * 4;

        // Map image coords to mask coords
        const maskX = Math.floor((x / originalWidth) * maskImg.width);
        const maskY = Math.floor((y / originalHeight) * maskImg.height);
        const maskIdx = (maskY * maskImg.width + maskX) * 4;

        // Get mask brightness value (0-255)
        const maskValue = maskData.data[maskIdx];

        // For normal regions: use mask value as alpha (white=opaque, black=transparent)
        // For inverted regions: invert the mask value
        const alphaValue = isBackgroundRegion ? (255 - maskValue) : maskValue;

        // Apply smooth alpha based on mask value
        imageData.data[imageIdx + 3] = Math.floor((imageData.data[imageIdx + 3] * alphaValue) / 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Export the FULL-SIZE layer (like Photoshop) - region stays in original position
    onSegment(canvas.toDataURL(), region.label, {
      x: 0,
      y: 0,
      width: originalWidth,
      height: originalHeight
    });

    // Now update the main canvas to remove the extracted region (make it transparent)
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = originalWidth;
    mainCanvas.height = originalHeight;
    const mainCtx = mainCanvas.getContext('2d');

    if (mainCtx && onImageUpdate) {
      // Draw current image at original size
      mainCtx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);
      const mainImageData = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);

      // Make extracted region transparent with feathering
      for (let y = 0; y < originalHeight; y++) {
        for (let x = 0; x < originalWidth; x++) {
          const imageIdx = (y * originalWidth + x) * 4;

          // Map image coords to mask coords
          const maskX = Math.floor((x / originalWidth) * maskImg.width);
          const maskY = Math.floor((y / originalHeight) * maskImg.height);
          const maskIdx = (maskY * maskImg.width + maskX) * 4;

          // Get mask brightness value for smooth removal
          const maskValue = maskData.data[maskIdx];
          const alphaValue = isBackgroundRegion ? (255 - maskValue) : maskValue;

          // Reduce alpha proportionally to mask value (smooth fade out)
          const currentAlpha = mainImageData.data[imageIdx + 3];
          mainImageData.data[imageIdx + 3] = Math.floor(currentAlpha * (1 - alphaValue / 255));
        }
      }

      mainCtx.putImageData(mainImageData, 0, 0);

      // Update the main image
      onImageUpdate(mainCanvas.toDataURL());
    }
  };

  const handleDrawMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();

    const pos = stage?.getPointerPosition();
    if (!pos || !imageElement) return;

    // Handle select mode - detect hovered region by checking actual mask pixels
    if (mode === 'select' && detectedRegions.length > 0 && onHoverRegion) {
      // Throttle hover detection using requestAnimationFrame
      if (animationFrameRef.current !== null) {
        return; // Skip if already processing
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;

        if (!isPointInImage(pos)) {
          onHoverRegion(null);
          return;
        }

        const { offsetX, offsetY } = getImagePosition();

        // Convert mouse position to image coordinates
        const imageX = pos.x - offsetX;
        const imageY = pos.y - offsetY;

        // Find which region contains this point using pre-rendered canvases
        // Check in reverse order so smaller parts are prioritized over larger ones
        let foundRegion: number | null = null;
        for (let i = detectedRegions.length - 1; i >= 0; i--) {
          const canvas = maskCanvases.get(i);
          const maskImg = maskImages.get(i);
          if (!canvas || !maskImg) continue;

          // Convert image coordinates to mask coordinates
          const maskX = Math.floor((imageX / imageSize.width) * maskImg.width);
          const maskY = Math.floor((imageY / imageSize.height) * maskImg.height);

          // Check if this pixel is part of the mask (white/opaque)
          if (maskX >= 0 && maskX < maskImg.width && maskY >= 0 && maskY < maskImg.height) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              const pixelData = ctx.getImageData(maskX, maskY, 1, 1).data;
              const isWhite = pixelData[0] > 200 && pixelData[1] > 200 && pixelData[2] > 200;

              if (isWhite) {
                foundRegion = i;
                break;
              }
            }
          }
        }

        onHoverRegion(foundRegion);
      });
      return;
    }

    if (!isDrawing.current || !lastPoint.current) return;
    if (!isPointInImage(pos)) return;

    if (mode === 'lasso') {
      setSelection(prev => {
        if (!prev || !prev.points) return prev;
        return {
          ...prev,
          points: [...prev.points, pos.x, pos.y]
        };
      });
    } else if (mode === 'brush' || mode === 'eraser') {
      if (!currentLine.current) return;

      setLines(prev => {
        const lastLine = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          {
            ...lastLine,
            points: [...lastLine.points, pos.x, pos.y]
          }
        ];
      });

      // Segment mask after each stroke
      if (brushLayerRef.current) {
        const canvas = brushLayerRef.current.getCanvas()._canvas;
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(canvas, 0, 0);
          onSegment(maskCanvas.toDataURL(), 'mask');
        }
      }
    }
  };

  const handleDrawEnd = () => {
    isDrawing.current = false;
    lastPoint.current = null;
    currentLine.current = null;
  };

  // Segment selection function (called externally)
  useEffect(() => {
    if (onSegmentSelection) {
      (window as any).segmentLassoSelection = () => {
        if (!selection || !selection.points || selection.points.length < 6) {
          return;
        }

        segmentLassoSelection();
      };
    }
  }, [selection, onSegmentSelection]);

  const segmentLassoSelection = () => {
    if (!selection || !selection.points || !imageElement) return;

    const { offsetX, offsetY } = getImagePosition();

    // Use ORIGINAL image dimensions
    const originalWidth = imageElement.width;
    const originalHeight = imageElement.height;

    // Calculate scale factor between display size and original size
    const scaleX = originalWidth / imageSize.width;
    const scaleY = originalHeight / imageSize.height;

    // Create mask canvas at ORIGINAL size
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = originalWidth;
    maskCanvas.height = originalHeight;
    const maskCtx = maskCanvas.getContext('2d');

    if (!maskCtx) return;

    // Draw the lasso selection path as a mask, scaled to original dimensions
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();

    const points = selection.points;
    for (let i = 0; i < points.length; i += 2) {
      // Convert screen coordinates to image coordinates, then scale to original
      const x = (points[i] - offsetX) * scaleX;
      const y = (points[i + 1] - offsetY) * scaleY;
      if (i === 0) {
        maskCtx.moveTo(x, y);
      } else {
        maskCtx.lineTo(x, y);
      }
    }
    maskCtx.closePath();
    maskCtx.fill();

    // Apply feathering to lasso mask for smooth edges
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(maskCanvas, 0, 0);
      maskCtx.clearRect(0, 0, originalWidth, originalHeight);
      maskCtx.filter = 'blur(3px)';
      maskCtx.drawImage(tempCanvas, 0, 0);
      maskCtx.filter = 'none';
    }

    // Get mask data at original size
    const maskData = maskCtx.getImageData(0, 0, originalWidth, originalHeight);

    // Create result canvas at ORIGINAL size
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = originalWidth;
    resultCanvas.height = originalHeight;
    const resultCtx = resultCanvas.getContext('2d');

    if (!resultCtx) return;

    // Draw the original image at original size
    resultCtx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);
    const imageData = resultCtx.getImageData(0, 0, originalWidth, originalHeight);

    // Apply the mask with smooth alpha for feathered edges
    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskAlpha = maskData.data[i]; // Mask brightness (0-255)
      // Apply proportional alpha based on mask value
      imageData.data[i + 3] = Math.floor((imageData.data[i + 3] * maskAlpha) / 255);
    }

    resultCtx.putImageData(imageData, 0, 0);

    // Export the full-size image with transparency outside selection
    onSegment(resultCanvas.toDataURL(), 'Lasso Selection', {
      x: 0,
      y: 0,
      width: originalWidth,
      height: originalHeight
    });

    // Now update the main image to remove the extracted region (make it transparent)
    if (onImageUpdate) {
      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = originalWidth;
      mainCanvas.height = originalHeight;
      const mainCtx = mainCanvas.getContext('2d');

      if (mainCtx) {
        // Draw current image at original size
        mainCtx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);
        const mainImageData = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);

        // Make extracted region transparent with feathering
        for (let i = 0; i < mainImageData.data.length; i += 4) {
          const maskAlpha = maskData.data[i]; // Mask brightness (0-255)
          // Reduce alpha proportionally for smooth fade out
          const currentAlpha = mainImageData.data[i + 3];
          mainImageData.data[i + 3] = Math.floor(currentAlpha * (1 - maskAlpha / 255));
        }

        mainCtx.putImageData(mainImageData, 0, 0);

        // Update the main image
        onImageUpdate(mainCanvas.toDataURL());
      }
    }

    // Clear selection
    setSelection(null);
    if (onSelectionChange) onSelectionChange(false);
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleDrawEnd}
      onTouchStart={handleDrawStart}
      onTouchMove={handleDrawMove}
      onTouchEnd={handleDrawEnd}
      style={{
        background: `repeating-conic-gradient(#CCCCCC 0% 25%, #FFFFFF 0% 50%) 
                    50% / 16px 16px`,
        touchAction: 'none'
      }}
    >
      {/* Base Image Layer */}
      <Layer listening={false}>
        {imageElement && baseLayerVisible && (
          <KonvaImage
            image={imageElement}
            width={imageSize.width}
            height={imageSize.height}
            x={(width - imageSize.width) / 2}
            y={(height - imageSize.height) / 2}
            listening={false}
            perfectDrawEnabled={false}
          />
        )}
      </Layer>

      {/* Extracted Layers - Displayed above base image */}
      <Layer name="extracted-layers">
        {layers.map((layer) => {
          if (!layer.visible) return null;

          const layerImg = layerImages.get(layer.id);
          if (!layerImg) return null;

          const { offsetX, offsetY } = getImagePosition();

          return (
            <KonvaImage
              key={layer.id}
              image={layerImg}
              width={imageSize.width}
              height={imageSize.height}
              x={offsetX}
              y={offsetY}
              listening={false}
              perfectDrawEnabled={false}
            />
          );
        })}
      </Layer>
      <Layer ref={brushLayerRef} name="brush-layer">
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.color}
            strokeWidth={line.size}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={
              line.mode === 'eraser' ? 'destination-out' : 'source-over'
            }
            opacity={line.opacity}
            perfectDrawEnabled={false}
            listening={false}
          />
        ))}
      </Layer>
      {mode === 'lasso' && selection && selection.points && selection.points.length > 0 && (
        <Layer name="lasso-layer">
          <Line
            points={selection.points}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[5, 5]}
            closed={false}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Line
            points={selection.points}
            fill="rgba(59, 130, 246, 0.3)"
            closed={true}
            listening={false}
            perfectDrawEnabled={false}
          />
        </Layer>
      )}
      {mode === 'select' && detectedRegions.length > 0 && hoveredRegion !== null && (
        <Layer name="regions-layer">
          {(() => {
            const { offsetX, offsetY } = getImagePosition();
            const maskImg = maskImages.get(hoveredRegion);

            if (!maskImg) return null;

            return (
              <KonvaImage
                key={`mask-overlay-${hoveredRegion}`}
                image={maskImg}
                x={offsetX}
                y={offsetY}
                width={imageSize.width}
                height={imageSize.height}
                opacity={0.4}
                listening={false}
                perfectDrawEnabled={false}
                filters={[Konva.Filters.RGB]}
                red={0}
                green={100}
                blue={255}
              />
            );
          })()}
        </Layer>
      )}
    </Stage>
  );
}