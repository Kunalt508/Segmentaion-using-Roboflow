import { useState, memo } from 'react';
import { Layer } from '@/types/layer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
  Copy,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerLockToggle: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerRename: (layerId: string, newName: string) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
  onLayerDuplicate: (layerId: string) => void;
  onLayerDownload: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
}

// PERFORMANCE: Memoized to prevent unnecessary re-renders
const LayerPanelComponent = function LayerPanel({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  onLayerRename,
  onLayerReorder,
  onLayerDuplicate,
  onLayerDownload,
  onLayerOpacityChange,
}: LayerPanelProps) {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleStartEdit = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleFinishEdit = (layerId: string) => {
    if (editingName.trim()) {
      onLayerRename(layerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onLayerReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Layers</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No layers yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {[...layers].reverse().map((layer, index) => {
              const actualIndex = layers.length - 1 - index;
              return (
              <div
                key={layer.id}
                draggable={!layer.isBaseLayer}
                onDragStart={(e) => !layer.isBaseLayer && handleDragStart(e, actualIndex)}
                onDragOver={(e) => !layer.isBaseLayer && handleDragOver(e, actualIndex)}
                onDrop={(e) => !layer.isBaseLayer && handleDrop(e, actualIndex)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer',
                  selectedLayerId === layer.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:bg-accent',
                  dragOverIndex === actualIndex && draggedIndex !== actualIndex
                    ? 'border-t-2 border-t-primary'
                    : '',
                  layer.locked || layer.isBaseLayer ? 'opacity-60' : '',
                  layer.isBaseLayer ? 'bg-muted/30' : ''
                )}
                onClick={() => !layer.locked && onLayerSelect(layer.id)}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical className="w-3 h-3" />
                </div>

                {/* Visibility Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerVisibilityToggle(layer.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {layer.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {layer.visible ? 'Hide layer' : 'Show layer'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded border bg-white/50 backdrop-blur-sm overflow-hidden flex-shrink-0">
                  <img
                    src={layer.url}
                    alt={layer.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Layer Name */}
                <div className="flex-1 min-w-0">
                  {editingLayerId === layer.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleFinishEdit(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFinishEdit(layer.id);
                        } else if (e.key === 'Escape') {
                          setEditingLayerId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 px-2 text-xs"
                      autoFocus
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (!layer.locked) handleStartEdit(layer);
                      }}
                      className="text-xs font-medium truncate"
                    >
                      {layer.name}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    {layer.type}
                  </div>
                </div>

                {/* Lock Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerLockToggle(layer.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {layer.locked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {layer.locked ? 'Unlock layer' : 'Lock layer'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Action Buttons (visible on hover) */}
                {!layer.isBaseLayer && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLayerDuplicate(layer.id);
                            }}
                            className="p-1 rounded bg-background/80 backdrop-blur-sm hover:bg-accent"
                            disabled={layer.locked}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate layer</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLayerDownload(layer.id);
                            }}
                            className="p-1 rounded bg-background/80 backdrop-blur-sm hover:bg-accent"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Download layer</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLayerDelete(layer.id);
                            }}
                            className="p-1 rounded bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                            disabled={layer.locked}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Delete layer</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Layer Count */}
      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        {layers.length} {layers.length === 1 ? 'layer' : 'layers'}
      </div>
    </div>
  );
};

// Export memoized version for performance
export const LayerPanel = memo(LayerPanelComponent);
