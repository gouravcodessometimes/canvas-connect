import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MousePointer2,
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  StickyNote,
  ImageIcon,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { useStore, ToolType, ShapeType } from '@/store/useStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const colors = [
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#000000', '#FFFFFF',
];

const stickyColors = [
  '#DBEAFE', '#FEF3C7', '#D1FAE5', '#FCE7F3',
  '#E0E7FF', '#FED7AA', '#CFFAFE', '#F3E8FF',
];

interface ToolButtonProps {
  icon: React.ReactNode;
  tool?: ToolType;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ToolButton = ({ icon, tool, label, onClick, isActive, disabled }: ToolButtonProps) => {
  const { activeTool, setActiveTool } = useStore();
  const active = isActive !== undefined ? isActive : (tool && activeTool === tool);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "tool-button w-10 h-10",
              active && "tool-button-active",
              disabled && "opacity-40 cursor-not-allowed"
            )}
            onClick={() => {
              if (disabled) return;
              if (onClick) onClick();
              else if (tool) setActiveTool(tool);
            }}
            disabled={disabled}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const BottomToolbar = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    strokeWidth,
    setStrokeWidth,
    fontSize,
    setFontSize,
    activeShapeType,
    setActiveShapeType,
    stickyColor,
    setStickyColor,
    zoom,
    setZoom,
    setPan,
    undo,
    redo,
    clearCanvas,
    addElement,
    history,
    historyIndex,
  } = useStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleShapeSelect = (shape: ShapeType) => {
    setActiveShapeType(shape);
    setActiveTool('shape');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 400;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          addElement({
            type: 'image',
            x: 100,
            y: 100,
            width,
            height,
            props: { imageUrl: event.target?.result as string },
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const shapeIcons = {
    rectangle: <Square className="w-4 h-4" />,
    circle: <Circle className="w-4 h-4" />,
    arrow: <ArrowRight className="w-4 h-4" />,
    line: <Minus className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="toolbar-floating flex items-center gap-1 px-3 py-2">
        {/* Selection Tools */}
        <ToolButton icon={<MousePointer2 className="w-5 h-5" />} tool="select" label="Select (V)" />
        <ToolButton icon={<Hand className="w-5 h-5" />} tool="pan" label="Pan (Space)" />
        
        <div className="toolbar-divider" />

        {/* Drawing Tools */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "tool-button w-10 h-10",
                activeTool === 'pen' && "tool-button-active"
              )}
            >
              <Pencil className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56 p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Color</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all hover:scale-110 border",
                        activeColor === color && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? '#e5e7eb' : 'transparent' }}
                      onClick={() => {
                        setActiveColor(color);
                        setActiveTool('pen');
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Size: {strokeWidth}px</p>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([value]) => setStrokeWidth(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "tool-button w-10 h-10",
                activeTool === 'highlighter' && "tool-button-active"
              )}
            >
              <Highlighter className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56 p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Color</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {colors.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all hover:scale-110",
                        activeColor === color && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: color, opacity: 0.6 }}
                      onClick={() => {
                        setActiveColor(color);
                        setActiveTool('highlighter');
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Size: {strokeWidth}px</p>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([value]) => setStrokeWidth(value)}
                  min={10}
                  max={40}
                  step={2}
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <ToolButton icon={<Eraser className="w-5 h-5" />} tool="eraser" label="Eraser (E)" />

        <div className="toolbar-divider" />

        {/* Shape Tools */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "tool-button w-10 h-10",
                activeTool === 'shape' && "tool-button-active"
              )}
            >
              {shapeIcons[activeShapeType]}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56 p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Shape</p>
                <div className="flex gap-1">
                  {(Object.keys(shapeIcons) as ShapeType[]).map((shape) => (
                    <button
                      key={shape}
                      className={cn(
                        "p-2.5 rounded-lg transition-all hover:bg-accent",
                        activeShapeType === shape && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleShapeSelect(shape)}
                    >
                      {shapeIcons[shape]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Color</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all hover:scale-110 border",
                        activeColor === color && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? '#e5e7eb' : 'transparent' }}
                      onClick={() => setActiveColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="toolbar-divider" />

        {/* Content Tools */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "tool-button w-10 h-10",
                activeTool === 'text' && "tool-button-active"
              )}
            >
              <Type className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56 p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Font Size: {fontSize}px</p>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => {
                    setFontSize(value);
                    setActiveTool('text');
                  }}
                  min={12}
                  max={72}
                  step={2}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Color</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all hover:scale-110 border",
                        activeColor === color && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? '#e5e7eb' : 'transparent' }}
                      onClick={() => {
                        setActiveColor(color);
                        setActiveTool('text');
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "tool-button w-10 h-10",
                activeTool === 'sticky' && "tool-button-active"
              )}
            >
              <StickyNote className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56 p-3">
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground">Note Color</p>
              <div className="grid grid-cols-4 gap-1.5">
                {stickyColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all hover:scale-105 border border-border/50",
                      stickyColor === color && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setStickyColor(color);
                      setActiveTool('sticky');
                    }}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="tool-button w-10 h-10"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Upload Image
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="toolbar-divider" />

        {/* Undo/Redo */}
        <ToolButton
          icon={<Undo2 className="w-5 h-5" />}
          label="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        />
        <ToolButton
          icon={<Redo2 className="w-5 h-5" />}
          label="Redo (Ctrl+Shift+Z)"
          onClick={redo}
          disabled={!canRedo}
        />

        <div className="toolbar-divider" />

        {/* Zoom Controls */}
        <ToolButton
          icon={<ZoomOut className="w-5 h-5" />}
          label="Zoom Out"
          onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
        />
        <div className="px-2 text-xs font-medium text-muted-foreground min-w-[45px] text-center">
          {Math.round(zoom * 100)}%
        </div>
        <ToolButton
          icon={<ZoomIn className="w-5 h-5" />}
          label="Zoom In"
          onClick={() => setZoom(Math.min(5, zoom + 0.1))}
        />
        <ToolButton
          icon={<Maximize2 className="w-5 h-5" />}
          label="Reset View"
          onClick={() => {
            setZoom(1);
            setPan(0, 0);
          }}
        />

        <div className="toolbar-divider" />

        {/* Clear Canvas */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="tool-button w-10 h-10 text-destructive hover:bg-destructive/10"
                onClick={clearCanvas}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Clear Canvas
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
};
