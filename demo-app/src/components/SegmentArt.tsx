import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload as UploadIcon,
  Lasso,
  Download,
  Trash2,
  Scissors,
  Loader2,
  ArrowLeft,
  Minus,
  Plus,
  MousePointer2,
  Undo,
  Redo,
  HelpCircle,
  Eye,
  EyeOff,
  Save,
  FileImage,
  Layers as LayersIcon,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { KonvaCanvas } from '@/components/KonvaCanvas';
// Roboflow segmentation APIs
import { smartSegment, detectImageType } from '@/lib/api-roboflow';
// OpenAI and utility functions
import { parseSegmentationPrompt, contentAwareFill, localContentAwareFill, createImprovedMask } from '@/lib/api';
import { exportToPsd, downloadPsd } from '@/lib/psdExport';

type SelectionMode = 'select' | 'lasso';

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

interface HistoryState {
  image: string | null;
  layers: Layer[];
}

export default function SegmentArt() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('select');
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [layers, setLayers] = useState<Layer[]>([]);
  const [bgRemovalPrompt, setBgRemovalPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [featherAmount, setFeatherAmount] = useState(5); // Default 5px for smooth edges
  const [detectedRegions, setDetectedRegions] = useState<DetectedRegion[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [isExportingPsd, setIsExportingPsd] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [baseLayerVisible, setBaseLayerVisible] = useState(true);
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [isFillingContent, setIsFillingContent] = useState(false);
  const [contentFillPrompt, setContentFillPrompt] = useState('');
  const [autoPrompt, setAutoPrompt] = useState(true); // Auto-generate prompt based on image type
  const [useLocalFill, setUseLocalFill] = useState(true); // Use local average color fill instead of DALL-E
  const [maskExpandPixels, setMaskExpandPixels] = useState(2); // Expand mask by N pixels (DALL-E only)
  const [dalleDebugData, setDalleDebugData] = useState<any>(null); // Debug data showing what's sent to DALL-E
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save current state to history
  const saveToHistory = () => {
    const newState: HistoryState = {
      image: uploadedImage,
      layers: JSON.parse(JSON.stringify(layers)) // Deep copy layers
    };
    // When saving new state, discard any "redo" history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setUploadedImage(state.image);
      setLayers(state.layers);
      setHistoryIndex(newIndex);
      toast({
        title: "Undo",
        description: "Reverted to previous state"
      });
    }
  };

  // Redo handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setUploadedImage(state.image);
      setLayers(state.layers);
      setHistoryIndex(newIndex);
      toast({
        title: "Redo",
        description: "Restored next state"
      });
    }
  };

  // Initialize history when image is first uploaded
  useEffect(() => {
    if (uploadedImage && history.length === 0) {
      // Save initial state (image with no layers)
      const initialState: HistoryState = {
        image: uploadedImage,
        layers: []
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [uploadedImage, history.length]);

  const saveAllLayers = async () => {
    if (layers.length === 0) {
      toast({
        title: "No Layers",
        description: "Please extract some layers first",
        variant: "destructive"
      });
      return;
    }

    for (const layer of layers) {
      await downloadLayer(layer);
    }

    toast({
      title: "Success",
      description: `Downloaded ${layers.length} layer(s)`
    });
  };

  const handleReset = () => {
    setUploadedImage(null);
    setSelectionMode('select');
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
    setLayers([]);
    setBgRemovalPrompt('');
    setIsProcessing(false);
    setFeatherAmount(0);
    setHistory([]);
    setHistoryIndex(-1);
    setDetectedRegions([]);
    toast({
      title: "Reset Complete",
      description: "All settings have been reset to default"
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const imageData = e.target.result as string;
        setUploadedImage(imageData);

        // Automatically segment the image
        toast({
          title: "Processing",
          description: "Analyzing image and detecting regions..."
        });

        // Trigger auto-segmentation
        setTimeout(() => autoSegmentImage(file), 100);
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read image file",
        variant: "destructive"
      });
    };

    reader.readAsDataURL(file);
  };

  // Auto-segment image on upload
  const autoSegmentImage = async (file: File) => {
    setIsSegmenting(true);
    try {
      const blob = await file.arrayBuffer().then(ab => new Blob([ab], { type: file.type }));

      // Use smart segmentation
      const result = await smartSegment(blob);

      if (result && result.masks) {
        const regions: DetectedRegion[] = result.masks.map(item => ({
          label: item.label,
          mask: item.mask,
          bounds: item.bounds
        }));
        setDetectedRegions(regions);

        toast({
          title: "Segmentation Complete",
          description: `Found ${regions.length} regions. Click on regions to extract them.`
        });
      }
    } catch (error) {
      console.error('Segmentation error:', error);
      toast({
        title: "Segmentation Error",
        description: error instanceof Error ? error.message : "Could not segment image. You can still use lasso selection.",
        variant: "destructive"
      });
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };


  const handleImageUpdate = (dataUrl: string) => {
    setUploadedImage(dataUrl);
  };

  const handleSegment = (dataUrl: string, type: string, position?: { x: number; y: number; width: number; height: number }) => {
    // Save current state before making changes
    saveToHistory();

    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${layers.length + 1}`,
      url: dataUrl,
      thumbnail: dataUrl,
      visible: true,
      type: type,
      x: position?.x || 0,
      y: position?.y || 0,
      width: position?.width || 0,
      height: position?.height || 0
    };

    setLayers(prev => [...prev, newLayer]);

    toast({
      title: "Layer Created",
      description: `${newLayer.name} has been added to layers`
    });
  };

  const downloadLayer = async (layer: Layer) => {
    try {
      const response = await fetch(layer.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `${layer.name}-${timestamp}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Success",
        description: "Layer downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download layer",
        variant: "destructive"
      });
    }
  };

  const deleteLayer = (layerId: string) => {
    saveToHistory();
    setLayers(prev => prev.filter(l => l.id !== layerId));
    toast({
      title: "Success",
      description: "Layer deleted successfully"
    });
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ));
  };

  const toggleLayerSelection = (layerId: string) => {
    setSelectedLayerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const mergeLayers = async () => {
    if (selectedLayerIds.size < 2) {
      toast({
        title: "Select More Layers",
        description: "Please select at least 2 layers to merge",
        variant: "destructive"
      });
      return;
    }

    setIsMerging(true);
    try {
      saveToHistory();

      // Get selected layers in their current order
      const selectedLayers = layers.filter(l => selectedLayerIds.has(l.id));

      // Create a canvas to merge all selected layers
      const canvas = document.createElement('canvas');

      // Load the first layer to get dimensions
      const firstImg = new Image();
      firstImg.src = selectedLayers[0].url;
      await new Promise((resolve) => { firstImg.onload = resolve; });

      canvas.width = firstImg.width;
      canvas.height = firstImg.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }

      // Draw all selected layers onto the canvas
      for (const layer of selectedLayers) {
        const img = new Image();
        img.src = layer.url;
        await new Promise((resolve) => { img.onload = resolve; });
        ctx.drawImage(img, 0, 0);
      }

      // Create merged layer
      const mergedDataUrl = canvas.toDataURL('image/png');
      const mergedLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `Merged Layer ${layers.length + 1}`,
        url: mergedDataUrl,
        thumbnail: mergedDataUrl,
        visible: true,
        type: 'merged',
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      };

      // Remove selected layers and add merged layer
      setLayers(prev => [
        ...prev.filter(l => !selectedLayerIds.has(l.id)),
        mergedLayer
      ]);

      // Clear selection
      setSelectedLayerIds(new Set());

      toast({
        title: "Success",
        description: `Merged ${selectedLayers.length} layers into one`
      });
    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to merge layers",
        variant: "destructive"
      });
    } finally {
      setIsMerging(false);
    }
  };

  // Generate intelligent prompt based on image analysis
  const generateSmartPrompt = (hasFacialFeatures: boolean): string => {
    if (!autoPrompt && contentFillPrompt.trim()) {
      return contentFillPrompt;
    }

    // Check if we have face parsing data
    if (hasFacialFeatures || detectedRegions.some(r =>
      r.label.includes('face') ||
      r.label.includes('eye') ||
      r.label.includes('nose') ||
      r.label.includes('mouth') ||
      r.label.includes('skin')
    )) {
      // For face images - fill with skin (describe what should be IN the masked area)
      return 'smooth natural human skin, realistic skin texture, natural skin tone, seamless';
    }

    // Generic fallback - describe what should replace the masked area
    return contentFillPrompt.trim() || 'natural texture matching surrounding area, seamless blend';
  };

  const handleContentAwareFill = async () => {
    if (!uploadedImage) {
      toast({
        title: "No Image",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    setIsFillingContent(true);
    try {
      // Use local fill (instant, free, average color)
      if (useLocalFill) {
        toast({
          title: "Processing",
          description: "Filling with average color from surrounding pixels..."
        });

        const filledImageUrl = await localContentAwareFill(uploadedImage);

        saveToHistory();
        setUploadedImage(filledImageUrl);

        toast({
          title: "Success!",
          description: "Gaps filled with average surrounding color (instant, no AI)"
        });

        return;
      }

      // Use DALL-E AI fill (slower, paid, AI-powered)
      toast({
        title: "Processing",
        description: "Analyzing transparent regions for AI fill..."
      });

      // Load the current base image
      const img = new Image();
      img.src = uploadedImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas to analyze transparency
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }

      ctx.drawImage(img, 0, 0);

      // Try to read pixel data - may fail if image is cross-origin
      let imageData;
      let pixels;
      try {
        imageData = ctx.getImageData(0, 0, img.width, img.height);
        pixels = imageData.data;
      } catch (securityError) {
        // CORS issue - can't read pixels from cross-origin image
        toast({
          title: "Image Access Restricted",
          description: "Cannot analyze this image due to browser security. Please download and re-upload the image to continue editing.",
          variant: "destructive"
        });
        throw new Error('Cannot access image pixels - please download and re-upload the image to continue editing');
      }

      // Check if there are any transparent regions
      let hasTransparency = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) {
          hasTransparency = true;
          break;
        }
      }

      if (!hasTransparency) {
        toast({
          title: "No Gaps Found",
          description: "The base layer has no transparent regions to fill",
          variant: "destructive"
        });
        return;
      }

      // Create improved mask with feathering and smooth edges
      // Use the featherAmount from the UI slider (same as used for lasso extraction)
      const improvedMaskData = createImprovedMask({
        imageData: imageData,
        featherRadius: featherAmount,
        expandPixels: maskExpandPixels
      });

      // Put mask on canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const maskCtx = maskCanvas.getContext('2d');

      if (!maskCtx) {
        throw new Error('Failed to create mask canvas');
      }

      maskCtx.putImageData(improvedMaskData, 0, 0);

      toast({
        title: "AI Processing",
        description: "Filling transparent regions with AI inpainting (this may take a minute)..."
      });

      // Convert to blobs
      let imageBlob;
      try {
        imageBlob = await fetch(uploadedImage).then(r => r.blob());
      } catch (fetchError) {
        // CORS issue fetching the image
        toast({
          title: "Cannot Access Image",
          description: "Please download the current image and re-upload it to continue editing.",
          variant: "destructive"
        });
        throw new Error('Cannot fetch image - please download and re-upload to continue');
      }

      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Generate smart prompt based on detected features
      const hasFacialFeatures = detectedRegions.length > 0;
      const smartPrompt = generateSmartPrompt(hasFacialFeatures);

      // Call content-aware fill API with smart prompt and DEBUG MODE enabled
      const result = await contentAwareFill({
        image: imageBlob,
        mask: maskBlob,
        prompt: smartPrompt,
        debug: true // Enable debug mode to inspect what's sent to DALL-E
      });

      // Extract result and debug data
      let filledImageUrl: string;
      if (typeof result === 'string') {
        filledImageUrl = result;
      } else {
        filledImageUrl = result.resultUrl;
        // Store debug data for inspection
        setDalleDebugData(result.debugData);
      }

      // Update the base image
      saveToHistory();
      setUploadedImage(filledImageUrl);

      toast({
        title: "Success - AI Fill Complete!",
        description: "Gaps filled with matching colors. To continue editing, download this image and re-upload it."
      });

    } catch (error) {
      console.error('Content-aware fill error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fill content",
        variant: "destructive"
      });
    } finally {
      setIsFillingContent(false);
    }
  };

  // Smart feature grouping for facial extraction
  const FEATURE_GROUPS: Record<string, string[]> = {
    'eyes': ['l_eye', 'r_eye'],
    'eye': ['l_eye', 'r_eye'],
    'eyebrows': ['l_brow', 'r_brow'],
    'eyebrow': ['l_brow', 'r_brow'],
    'brows': ['l_brow', 'r_brow'],
    'brow': ['l_brow', 'r_brow'],
    'ears': ['l_ear', 'r_ear'],
    'ear': ['l_ear', 'r_ear'],
    'lips': ['u_lip', 'l_lip'],
    'lip': ['u_lip', 'l_lip'],
    'mouth': ['mouth', 'u_lip', 'l_lip'],
    'face': ['skin', 'nose', 'l_eye', 'r_eye', 'l_brow', 'r_brow', 'l_ear', 'r_ear', 'mouth', 'u_lip', 'l_lip'],
    'facial features': ['nose', 'l_eye', 'r_eye', 'l_brow', 'r_brow', 'mouth'],
    'nose': ['nose'],
    'hair': ['hair'],
    'neck': ['neck'],
    'cloth': ['cloth'],
    'clothes': ['cloth'],
    'clothing': ['cloth'],
    'skin': ['skin'],
    'head': ['skin', 'nose', 'l_eye', 'r_eye', 'l_brow', 'r_brow', 'l_ear', 'r_ear', 'mouth', 'u_lip', 'l_lip', 'hair']
  };

  const handleBgRemoval = async () => {
    if (!uploadedImage || !bgRemovalPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter what you want to extract",
        variant: "destructive"
      });
      return;
    }

    if (detectedRegions.length === 0) {
      toast({
        title: "No Regions Detected",
        description: "Please wait for region detection to complete or upload a face image",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const prompt = bgRemovalPrompt.toLowerCase().trim();
      const regionsToSegment = new Set<string>();

      // Get available labels from detected regions
      const availableLabels = detectedRegions.map(r => r.label);

      // STEP 1: Try OpenAI-powered parsing first
      console.log('Attempting OpenAI-powered prompt parsing...');
      const aiResult = await parseSegmentationPrompt(prompt, availableLabels);

      if (aiResult.confidence !== 'fallback' && aiResult.labels.length > 0) {
        // OpenAI successfully parsed the prompt
        console.log(`OpenAI parsed successfully (confidence: ${aiResult.confidence}):`, aiResult.labels);
        aiResult.labels.forEach(label => regionsToSegment.add(label));

        toast({
          title: "AI Understanding",
          description: `Understanding your request with ${aiResult.confidence} confidence...`
        });
      } else {
        // STEP 2: Fall back to keyword matching
        console.log('Using fallback keyword matching...');

        // Check for exact matches in FEATURE_GROUPS
        Object.entries(FEATURE_GROUPS).forEach(([keyword, labels]) => {
          if (prompt.includes(keyword)) {
            labels.forEach(label => regionsToSegment.add(label));
            console.log(`Matched keyword "${keyword}" → segmenting:`, labels);
          }
        });

        // Also check for direct matches with region labels
        detectedRegions.forEach(region => {
          const regionLabel = region.label.toLowerCase();
          if (prompt.includes(regionLabel) ||
              prompt.includes(regionLabel.replace('_', ' ')) ||
              prompt.includes(regionLabel.replace('_', ''))) {
            regionsToSegment.add(region.label);
            console.log(`Direct match: "${regionLabel}"`);
          }
        });
      }

      // Find matching regions
      const matchedRegions = detectedRegions.filter(region =>
        regionsToSegment.has(region.label)
      );

      if (matchedRegions.length === 0) {
        toast({
          title: "No Matches Found",
          description: "Could not find features matching your description. Try: eyes, nose, face, hair, etc.",
          variant: "destructive"
        });
        return;
      }

      console.log(`Segmenting ${matchedRegions.length} regions:`, matchedRegions.map(r => r.label));

      // Segment each matched region using the existing segmentation method
      saveToHistory();

      const segmentedCount = matchedRegions.length;
      for (const region of matchedRegions) {
        const regionIndex = detectedRegions.indexOf(region);
        if (regionIndex !== -1) {
          // Trigger segmentation via custom event (same as click segmentation)
          window.dispatchEvent(new CustomEvent('segmentRegion', { detail: regionIndex }));
          // Small delay between segmentations for smooth UX
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      toast({
        title: "Success",
        description: `Segmented ${segmentedCount} feature(s): ${matchedRegions.map(r => r.label.replace('_', ' ')).join(', ')}`
      });
    } catch (error) {
      console.error('Prompt extraction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract features",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPsd = async () => {
    if (!uploadedImage || layers.length === 0) {
      toast({
        title: "Cannot Export",
        description: "Please upload an image and extract at least one layer",
        variant: "destructive"
      });
      return;
    }

    setIsExportingPsd(true);
    try {
      // Get canvas dimensions from the uploaded image
      const img = new Image();
      img.src = uploadedImage;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvasWidth = img.width;
      const canvasHeight = img.height;

      // Export to PSD
      const psdBuffer = await exportToPsd(uploadedImage, layers, canvasWidth, canvasHeight);

      // Download PSD file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadPsd(psdBuffer, `extracted-layers-${timestamp}.psd`);

      toast({
        title: "Success",
        description: `PSD file exported with ${layers.length} layer(s)`
      });
    } catch (error) {
      console.error('PSD export error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export PSD",
        variant: "destructive"
      });
    } finally {
      setIsExportingPsd(false);
    }
  };

  const handleSegmentSelection = () => {
    if ((window as any).segmentLassoSelection) {
      (window as any).segmentLassoSelection();
      toast({
        title: "Success",
        description: "Selection segmented successfully"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Segment Art Assets</CardTitle>
          <CardDescription>
            Upload images and segment specific regions or remove background objects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedImage ? (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-8 h-8 mb-4" />
                  <p className="mb-2 text-sm">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*"
                />
              </label>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 p-4 border rounded-lg">
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Reset
                  </Button>
                  {isSegmenting && (
                    <div className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Detecting regions...</span>
                    </div>
                  )}
                  {detectedRegions.length > 0 && !isSegmenting && (
                    <div className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 bg-green-100 text-green-700 border border-green-200">
                      <Sparkles className="h-4 w-4" />
                      <span>{detectedRegions.length} regions detected</span>
                    </div>
                  )}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectionMode === 'select' ? 'secondary' : 'outline'}
                        size="icon"
                        onClick={() => setSelectionMode('select')}
                        disabled={isSegmenting}
                      >
                        <MousePointer2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hover Preview - Click to extract detected regions</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectionMode === 'lasso' ? 'secondary' : 'outline'}
                        size="icon"
                        onClick={() => setSelectionMode('lasso')}
                      >
                        <Lasso className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Lasso Selection - Draw freehand</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Feather slider - works for both extraction and content-aware fill */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Edge Feathering</Label>
                    <span className="text-[10px] text-muted-foreground">{featherAmount}px</span>
                  </div>
                  <Slider
                    value={[featherAmount]}
                    onValueChange={([value]) => setFeatherAmount(value)}
                    min={0}
                    max={50}
                    step={1}
                    className="w-[120px]"
                  />
                </div>

                <div className="border-t mt-4 pt-4">
                  <Label className="mb-2 block text-xs">Prompt Segmentation</Label>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="e.g., 'eyes', 'face without hair'"
                      value={bgRemovalPrompt}
                      onChange={(e) => setBgRemovalPrompt(e.target.value)}
                      className="min-h-[60px] resize-none text-xs"
                    />
                    <Button
                      onClick={handleBgRemoval}
                      disabled={isProcessing || !bgRemovalPrompt.trim()}
                      className="w-full"
                      size="sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Segmenting...
                        </>
                      ) : (
                        <>
                          <Scissors className="mr-2 h-4 w-4" />
                          Segment
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border-t mt-4 pt-4">
                  <Label className="mb-2 block text-xs">Content-Aware Fill</Label>
                  <div className="space-y-3">
                    {/* Fill Method Selection */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="localFill"
                          name="fillMethod"
                          checked={useLocalFill}
                          onChange={() => setUseLocalFill(true)}
                          className="h-3 w-3"
                        />
                        <label htmlFor="localFill" className="text-xs">
                          Local Fill
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="aiFill"
                          name="fillMethod"
                          checked={!useLocalFill}
                          onChange={() => setUseLocalFill(false)}
                          className="h-3 w-3"
                        />
                        <label htmlFor="aiFill" className="text-xs">
                          AI Fill (DALL-E)
                        </label>
                      </div>
                    </div>

                    {/* DALL-E Settings (only show when AI fill is selected) */}
                    {!useLocalFill && (
                      <div className="space-y-2 p-2 bg-amber-50/50 border border-amber-200 rounded">
                        {/* Prompt Settings */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="autoPrompt"
                            checked={autoPrompt}
                            onChange={(e) => setAutoPrompt(e.target.checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="autoPrompt" className="text-xs">
                            Auto-detect prompt
                          </label>
                        </div>

                        {!autoPrompt && (
                          <Textarea
                            placeholder="e.g., 'smooth skin', 'grass'"
                            value={contentFillPrompt}
                            onChange={(e) => setContentFillPrompt(e.target.value)}
                            className="min-h-[50px] resize-none text-xs"
                          />
                        )}

                        {/* Mask Expansion */}
                        <div className="space-y-1 border-t border-amber-300 pt-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px]">Mask Expand</Label>
                            <span className="text-[10px] text-muted-foreground">{maskExpandPixels}px</span>
                          </div>
                          <Slider
                            value={[maskExpandPixels]}
                            onValueChange={([value]) => setMaskExpandPixels(value)}
                            min={0}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="text-[10px] text-muted-foreground p-2 bg-gray-50 border border-gray-200 rounded">
                      <p><strong>Local:</strong> Instant, free, color average</p>
                      {!useLocalFill && (
                        <p className="mt-0.5"><strong>AI:</strong> DALL-E, ~15s, paid</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectionMode === 'lasso' && (
                  <div className="border-t mt-4 pt-4">
                    <Label className="mb-2 block">Lasso Selection</Label>
                    <Button
                      onClick={handleSegmentSelection}
                      disabled={!hasSelection}
                      className="w-full"
                      variant="default"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Segment Selection
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                {/* Top Bar - Above Canvas */}
                <TooltipProvider>
                  <div className="flex justify-center gap-2 bg-background p-2 rounded-lg shadow border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleUndo}
                          disabled={historyIndex <= 0}
                          className="h-8 w-8"
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Undo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleRedo}
                          disabled={historyIndex >= history.length - 1}
                          className="h-8 w-8"
                        >
                          <Redo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Redo</TooltipContent>
                    </Tooltip>

                    <div className="h-8 w-px bg-border mx-1"></div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomOut}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center min-w-[3rem] justify-center text-sm font-medium">
                      {(scale * 100).toFixed(0)}%
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomIn}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    <div className="h-8 w-px bg-border mx-1"></div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowHelp(!showHelp)}
                          className="h-8 w-8"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Help</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleExportPsd}
                          disabled={layers.length === 0 || isExportingPsd}
                          className="h-8 w-8"
                        >
                          {isExportingPsd ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileImage className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export PSD</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={saveAllLayers}
                          disabled={layers.length === 0}
                          className="h-8 w-8"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save All Layers (PNG)</TooltipContent>
                    </Tooltip>

                    <div className="h-8 w-px bg-border mx-1"></div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleContentAwareFill}
                          disabled={!uploadedImage || isFillingContent}
                          className="h-8 w-8"
                        >
                          {isFillingContent ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Content-Aware Fill (Fill gaps with surrounding color)</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                {/* Canvas Container */}
                <div
                  ref={containerRef}
                  className="relative w-full h-[600px] overflow-auto bg-gray-900 rounded-lg"
                >

                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: '0 0',
                      translate: `${panOffset.x}px ${panOffset.y}px`
                    }}
                  >
                    <KonvaCanvas
                      width={800}
                      height={600}
                      mode={selectionMode}
                      image={uploadedImage}
                      onSegment={handleSegment}
                      onImageUpdate={handleImageUpdate}
                      featherAmount={featherAmount}
                      detectedRegions={detectedRegions}
                      hoveredRegion={hoveredRegion}
                      onHoverRegion={setHoveredRegion}
                      brushSize={20}
                      brushColor="#ffffff"
                      opacity={1}
                      onSelectionChange={setHasSelection}
                      onSegmentSelection={handleSegmentSelection}
                      layers={layers}
                      baseLayerVisible={baseLayerVisible}
                    />
                  </div>

                  {selectionMode === 'select' && hoveredRegion !== null && detectedRegions[hoveredRegion] && (
                    <div
                      className="absolute pointer-events-none bg-black/80 text-white px-3 py-1.5 rounded text-sm font-medium"
                      style={{
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000
                      }}
                    >
                      {detectedRegions[hoveredRegion].label}
                    </div>
                  )}
                </div>

                {showHelp && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-900">How to Use</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>🚀 Auto-Segmentation:</strong> Upload an image and it will automatically be segmented</li>
                      <li className="ml-4 text-xs">→ Detects regions using AI instance segmentation</li>
                      <li>• <strong>Select Tool (Primary):</strong> Hover over detected regions and click to extract them</li>
                      <li>• <strong>Lasso Tool (Manual):</strong> Click and drag to create freehand selections</li>
                      <li>• <strong>Prompt Extraction (AI-Powered):</strong> Uses OpenAI to understand natural language</li>
                      <li className="ml-4 text-xs">→ Try: "eyes", "everything except background", "nose and both ears"</li>
                      <li className="ml-4 text-xs">→ Falls back to keyword matching if OpenAI unavailable</li>
                      <li>• <strong>Edge Feathering Slider:</strong> Universal edge smoothing control</li>
                      <li className="ml-4 text-xs">→ Smooths edges during lasso extraction</li>
                      <li className="ml-4 text-xs">→ Creates feathered masks for content-aware fill</li>
                      <li className="ml-4 text-xs">→ Recommended: 5-15px for natural blending</li>
                      <li>• Extracted regions appear as layers on the right</li>
                      <li>• <strong>Merge Layers:</strong> Check 2+ layers and click merge button in layers panel</li>
                      <li>• <strong>Content-Aware Fill (✨):</strong> Fills transparent gaps intelligently</li>
                      <li className="ml-4 text-xs">→ Local Fill (default): Instant, free, uses average surrounding color</li>
                      <li className="ml-4 text-xs">→ AI Fill (DALL-E): Slower, paid, AI-powered texture generation</li>
                      <li>• Use Undo/Redo buttons at the top to manage your edits</li>
                      <li>• <strong>Export PSD:</strong> Creates a PSD file with base image + all layers</li>
                      <li>• <strong>Save All:</strong> Downloads all layers as individual PNG files</li>
                    </ul>
                  </div>
                )}

                {/* DALL-E Debug Panel */}
                {dalleDebugData && (
                  <div className="mt-4 p-3 bg-purple-50/50 border border-purple-200 rounded">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-purple-900">DALL-E Input Preview</h4>
                      <button
                        onClick={() => setDalleDebugData(null)}
                        className="text-xs text-purple-600 hover:text-purple-900"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Image Preview */}
                      <div>
                        <div className="text-[10px] font-medium text-purple-700 mb-1">Image</div>
                        <img
                          src={dalleDebugData.imageUrl}
                          alt="Input"
                          className="w-full h-auto border border-purple-200 rounded"
                        />
                        <a
                          href={dalleDebugData.imageUrl}
                          download="input.png"
                          className="text-[10px] text-purple-600 hover:underline"
                        >
                          Download
                        </a>
                      </div>

                      {/* Mask Preview */}
                      <div>
                        <div className="text-[10px] font-medium text-purple-700 mb-1">Mask</div>
                        <img
                          src={dalleDebugData.maskUrl}
                          alt="Mask"
                          className="w-full h-auto border border-purple-200 rounded"
                        />
                        <a
                          href={dalleDebugData.maskUrl}
                          download="mask.png"
                          className="text-[10px] text-purple-600 hover:underline"
                        >
                          Download
                        </a>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-purple-600 space-y-0.5">
                      <div>{dalleDebugData.size}</div>
                      <div className="truncate">"{dalleDebugData.prompt}"</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Layers Panel */}
              <div className="w-80 flex flex-col border rounded-lg bg-gray-50">
                <div className="p-3 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Layers</h3>
                    <span className="text-xs text-muted-foreground">{layers.length + (uploadedImage ? 1 : 0)}</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={mergeLayers}
                          disabled={selectedLayerIds.size < 2 || isMerging}
                          className="h-7 px-2"
                        >
                          {isMerging ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <LayersIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Merge Selected Layers</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[600px]">
                  {!uploadedImage ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      <p>No layers yet</p>
                      <p className="text-xs mt-1">Upload an image to start</p>
                    </div>
                  ) : (
                    <>
                      {/* Extracted Layers (top to bottom) */}
                      {[...layers].reverse().map((layer) => (
                        <div
                          key={layer.id}
                          className={`flex items-center gap-2 p-2 bg-white border rounded hover:bg-gray-50 transition-colors group ${
                            selectedLayerIds.has(layer.id) ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLayerIds.has(layer.id)}
                            onChange={() => toggleLayerSelection(layer.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => toggleLayerVisibility(layer.id)}
                          >
                            {layer.visible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4 opacity-50" />
                            )}
                          </Button>

                          <div className="flex-shrink-0 w-12 h-12 border rounded overflow-hidden bg-gray-100">
                            <img
                              src={layer.thumbnail}
                              alt={layer.name}
                              className="w-full h-full object-contain"
                              style={{
                                opacity: layer.visible ? 1 : 0.5
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{layer.name}</p>
                            <p className="text-xs text-muted-foreground">{layer.type}</p>
                          </div>

                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => downloadLayer(layer)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => deleteLayer(layer.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Base Layer (always at bottom) */}
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border-2 border-blue-200 rounded hover:bg-blue-100 transition-colors group">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => setBaseLayerVisible(!baseLayerVisible)}
                        >
                          {baseLayerVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4 opacity-50" />
                          )}
                        </Button>

                        <div className="flex-shrink-0 w-12 h-12 border rounded overflow-hidden bg-gray-100">
                          <img
                            src={uploadedImage}
                            alt="Base Layer"
                            className="w-full h-full object-contain"
                            style={{
                              opacity: baseLayerVisible ? 1 : 0.5
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">Base Layer</p>
                          <p className="text-xs text-blue-600">Background</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}