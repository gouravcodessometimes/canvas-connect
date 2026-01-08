import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Image,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { useStore, ToolType, ShapeType } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const colors = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#000000', '#FFFFFF',
];

const stickyColors = [
  '#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3', '#E0E7FF',
  '#FED7AA', '#CFFAFE', '#F3E8FF',
];

interface ToolButtonProps {
  icon: React.ReactNode;
  tool: ToolType;
  label: string;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
}

const ToolButton = ({ icon, tool, label, hasSubmenu, children }: ToolButtonProps) => {
  const { activeTool, setActiveTool } = useStore();
  const isActive = activeTool === tool;

  if (hasSubmenu && children) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "tool-button relative flex flex-col items-center justify-center gap-1",
              "min-w-[52px] h-[52px]",
              isActive && "tool-button-active"
            )}
            title={label}
          >
            {icon}
            <span className="text-[10px] opacity-70">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-auto p-3">
          {children}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      className={cn(
        "tool-button relative flex flex-col items-center justify-center gap-1",
        "min-w-[52px] h-[52px]",
        isActive && "tool-button-active"
      )}
      onClick={() => setActiveTool(tool)}
      title={label}
    >
      {icon}
      <span className="text-[10px] opacity-70">{label}</span>
    </button>
  );
};

export const BottomToolbar = () => {
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
    history,
    historyIndex,
  } = useStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleShapeSelect = (shape: ShapeType) => {
    setActiveShapeType(shape);
    setActiveTool('shape');
  };

  const shapeIcons = {
    rectangle: <Square className="w-5 h-5" />,
    circle: <Circle className="w-5 h-5" />,
    arrow: <ArrowRight className="w-5 h-5" />,
    line: <Minus className="w-5 h-5" />,
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="toolbar-floating flex items-center gap-1 p-2">
        {/* Selection Tools */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <ToolButton icon={<MousePointer2 className="w-5 h-5" />} tool="select" label="Select" />
          <ToolButton icon={<Hand className="w-5 h-5" />} tool="pan" label="Pan" />
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <ToolButton icon={<Pencil className="w-5 h-5" />} tool="pen" label="Pen" hasSubmenu>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-2">Color</p>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                        activeColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setActiveColor(color);
                        setActiveTool('pen');
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Thickness: {strokeWidth}px</p>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([value]) => setStrokeWidth(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-40"
                />
              </div>
            </div>
          </ToolButton>

          <ToolButton icon={<Highlighter className="w-5 h-5" />} tool="highlighter" label="Highlight" hasSubmenu>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-2">Color</p>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {colors.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                        activeColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color, opacity: 0.5 }}
                      onClick={() => {
                        setActiveColor(color);
                        setActiveTool('highlighter');
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Thickness: {strokeWidth}px</p>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([value]) => setStrokeWidth(value)}
                  min={10}
                  max={40}
                  step={2}
                  className="w-40"
                />
              </div>
            </div>
          </ToolButton>

          <ToolButton icon={<Eraser className="w-5 h-5" />} tool="eraser" label="Eraser" />
        </div>

        {/* Shape Tools */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "tool-button relative flex flex-col items-center justify-center gap-1",
                  "min-w-[52px] h-[52px]",
                  activeTool === 'shape' && "tool-button-active"
                )}
                title="Shapes"
              >
                {shapeIcons[activeShapeType]}
                <span className="text-[10px] opacity-70">Shapes</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-3">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2">Shape</p>
                  <div className="flex gap-1">
                    {(Object.keys(shapeIcons) as ShapeType[]).map((shape) => (
                      <button
                        key={shape}
                        className={cn(
                          "p-2 rounded-lg hover:bg-accent transition-colors",
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
                  <p className="text-xs font-medium mb-2">Color</p>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform hover:scale-110",
                          activeColor === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setActiveColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Content Tools */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <ToolButton icon={<Type className="w-5 h-5" />} tool="text" label="Text" hasSubmenu>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-2">Font Size: {fontSize}px</p>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={12}
                  max={72}
                  step={2}
                  className="w-40"
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Color</p>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                        activeColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setActiveColor(color);
                        setActiveTool('text');
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ToolButton>

          <ToolButton icon={<StickyNote className="w-5 h-5" />} tool="sticky" label="Sticky" hasSubmenu>
            <div>
              <p className="text-xs font-medium mb-2">Sticky Color</p>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {stickyColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-lg transition-transform hover:scale-110 border",
                      stickyColor === color && "ring-2 ring-offset-2 ring-primary"
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
          </ToolButton>

          <ToolButton icon={<Image className="w-5 h-5" />} tool="image" label="Image" />
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <button
            className={cn(
              "tool-button flex flex-col items-center justify-center gap-1",
              "min-w-[52px] h-[52px]",
              !canUndo && "opacity-40 cursor-not-allowed"
            )}
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 className="w-5 h-5" />
            <span className="text-[10px] opacity-70">Undo</span>
          </button>
          <button
            className={cn(
              "tool-button flex flex-col items-center justify-center gap-1",
              "min-w-[52px] h-[52px]",
              !canRedo && "opacity-40 cursor-not-allowed"
            )}
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 className="w-5 h-5" />
            <span className="text-[10px] opacity-70">Redo</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <button
            className="tool-button flex flex-col items-center justify-center gap-1 min-w-[52px] h-[52px]"
            onClick={() => setZoom(zoom - 0.1)}
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
            <span className="text-[10px] opacity-70">Zoom-</span>
          </button>
          <div className="px-2 text-sm font-mono min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <button
            className="tool-button flex flex-col items-center justify-center gap-1 min-w-[52px] h-[52px]"
            onClick={() => setZoom(zoom + 0.1)}
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
            <span className="text-[10px] opacity-70">Zoom+</span>
          </button>
          <button
            className="tool-button flex flex-col items-center justify-center gap-1 min-w-[52px] h-[52px]"
            onClick={() => {
              setZoom(1);
              setPan(0, 0);
            }}
            title="Reset View"
          >
            <Maximize2 className="w-5 h-5" />
            <span className="text-[10px] opacity-70">Fit</span>
          </button>
        </div>

        {/* Clear Canvas */}
        <button
          className="tool-button flex flex-col items-center justify-center gap-1 min-w-[52px] h-[52px] text-destructive hover:bg-destructive/10"
          onClick={clearCanvas}
          title="Clear Canvas"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] opacity-70">Clear</span>
        </button>
      </div>
    </motion.div>
  );
};
