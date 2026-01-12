import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { useStore, CanvasElement } from '@/store/useStore';

interface DrawingLine {
  points: number[];
  color: string;
  strokeWidth: number;
  opacity: number;
  tool: 'pen' | 'highlighter' | 'eraser';
}

export const Canvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map());

  const {
    activeTool,
    activeColor,
    strokeWidth,
    fontSize,
    activeShapeType,
    stickyColor,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    addElement,
    updateElement,
    deleteElement,
    getCurrentPage,
    saveToHistory,
  } = useStore();

  const currentPage = getCurrentPage();
  const elements = currentPage?.canvasElements || [];

  // Load images for image elements
  useEffect(() => {
    elements.forEach((element) => {
      if (element.type === 'image' && element.props.imageUrl && !images.has(element.id)) {
        const img = new window.Image();
        img.src = element.props.imageUrl;
        img.onload = () => {
          setImages((prev) => new Map(prev).set(element.id, img));
        };
      }
    });
  }, [elements]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      if (selectedId) {
        const selectedNode = stage.findOne('#' + selectedId);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteElement(selectedId);
          setSelectedId(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.getState().redo();
        } else {
          useStore.getState().undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteElement, editingTextId]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.1, Math.min(5, oldScale + direction * 0.1));

    setZoom(newScale);
    setPan(
      pointer.x - mousePointTo.x * newScale,
      pointer.y - mousePointTo.y * newScale
    );
  }, [zoom, panX, panY, setZoom, setPan]);

  const getCanvasPosition = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - panX) / zoom,
      y: (pointer.y - panY) / zoom,
    };
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getCanvasPosition(e);
    const clickedOnEmpty = e.target === e.target.getStage();

    if (clickedOnEmpty) {
      setSelectedId(null);
      setEditingTextId(null);
    }
    
    if (activeTool === 'pan') return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentLine({
        points: [pos.x, pos.y],
        color: activeColor,
        strokeWidth: activeTool === 'highlighter' ? strokeWidth * 3 : strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.4 : 1,
        tool: activeTool,
      });
    }

    if (activeTool === 'eraser') {
      // Find and delete element at click position
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const shape = stage.getIntersection(pos);
          if (shape && !(shape instanceof Konva.Stage)) {
            const id = shape.id() || shape.getParent()?.id();
            if (id) {
              deleteElement(id);
            }
          }
        }
      }
    }

    if (activeTool === 'shape' && clickedOnEmpty) {
      addElement({
        type: 'shape',
        x: pos.x,
        y: pos.y,
        width: 100,
        height: activeShapeType === 'arrow' || activeShapeType === 'line' ? 0 : 100,
        props: { shapeType: activeShapeType, color: activeColor, strokeWidth },
      });
    }

    if (activeTool === 'sticky' && clickedOnEmpty) {
      addElement({
        type: 'sticky',
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 150,
        props: { stickyColor, text: 'Click to edit...' },
      });
    }

    if (activeTool === 'text' && clickedOnEmpty) {
      addElement({
        type: 'text',
        x: pos.x,
        y: pos.y,
        props: { text: 'Double click to edit', fontSize, color: activeColor },
      });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !currentLine) return;
    const pos = getCanvasPosition(e);
    
    if (activeTool === 'eraser') {
      // Continuous erasing while dragging
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const shape = stage.getIntersection(pos);
          if (shape && !(shape instanceof Konva.Stage)) {
            const id = shape.id() || shape.getParent()?.id();
            if (id) {
              deleteElement(id);
            }
          }
        }
      }
    } else {
      setCurrentLine({ ...currentLine, points: [...currentLine.points, pos.x, pos.y] });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentLine && currentLine.points.length > 2) {
      addElement({
        type: 'draw',
        x: 0,
        y: 0,
        props: {
          points: currentLine.points,
          color: currentLine.color,
          strokeWidth: currentLine.strokeWidth,
          opacity: currentLine.opacity,
        },
      });
    }
    setIsDrawing(false);
    setCurrentLine(null);
  };

  const handleTextDblClick = (element: CanvasElement) => {
    setEditingTextId(element.id);
    setSelectedId(element.id);
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const textNode = stage.findOne('#' + element.id) as Konva.Text;
    if (!textNode) return;
    
    const textPosition = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    
    textarea.value = element.props.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = stageBox.top + textPosition.y + 'px';
    textarea.style.left = stageBox.left + textPosition.x + 'px';
    textarea.style.width = (textNode.width() * zoom) + 'px';
    textarea.style.height = 'auto';
    textarea.style.fontSize = (element.props.fontSize || 16) * zoom + 'px';
    textarea.style.border = '2px solid hsl(217 91% 60%)';
    textarea.style.padding = '4px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'white';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.fontFamily = 'Inter, sans-serif';
    textarea.style.transformOrigin = 'left top';
    textarea.style.color = element.props.color || '#000';
    textarea.style.zIndex = '1000';
    textarea.style.borderRadius = '4px';

    textarea.focus();

    const removeTextarea = () => {
      if (document.body.contains(textarea)) {
        const newText = textarea.value;
        updateElement(element.id, { props: { ...element.props, text: newText } });
        document.body.removeChild(textarea);
        setEditingTextId(null);
        saveToHistory();
      }
    };

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        removeTextarea();
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        removeTextarea();
      }
    });
  };

  const handleTransformEnd = (element: CanvasElement, node: Konva.Node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    updateElement(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, (element.width || 100) * scaleX),
      height: Math.max(20, (element.height || 100) * scaleY),
      rotation: node.rotation(),
    });
    saveToHistory();
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedId === element.id;
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      draggable: activeTool === 'select',
      onClick: () => {
        if (activeTool === 'select') {
          setSelectedId(element.id);
        } else if (activeTool === 'eraser') {
          deleteElement(element.id);
        }
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        updateElement(element.id, { x: e.target.x(), y: e.target.y() });
        saveToHistory();
      },
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
        handleTransformEnd(element, e.target);
      },
    };

    switch (element.type) {
      case 'draw':
        return (
          <Line
            key={element.id}
            id={element.id}
            points={element.props.points}
            stroke={element.props.color}
            strokeWidth={element.props.strokeWidth}
            opacity={element.props.opacity || 1}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
            onClick={() => {
              if (activeTool === 'eraser') {
                deleteElement(element.id);
              }
            }}
          />
        );
        
      case 'sticky':
        return (
          <Group key={element.id} {...commonProps} onDblClick={() => handleTextDblClick(element)}>
            <Rect
              width={element.width || 200}
              height={element.height || 150}
              fill={element.props.stickyColor}
              cornerRadius={12}
              shadowColor="rgba(0,0,0,0.2)"
              shadowBlur={15}
              shadowOpacity={0.3}
              shadowOffsetY={5}
              stroke={isSelected ? 'hsl(217, 91%, 60%)' : undefined}
              strokeWidth={isSelected ? 2 : 0}
            />
            <Text
              text={element.props.text}
              width={(element.width || 200) - 24}
              height={(element.height || 150) - 24}
              x={12}
              y={12}
              fontSize={14}
              fill="#333"
              fontFamily="Inter, sans-serif"
            />
          </Group>
        );
        
      case 'text':
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={element.props.text}
            fontSize={element.props.fontSize || 16}
            fill={element.props.color}
            fontFamily="Inter, sans-serif"
            visible={editingTextId !== element.id}
            onDblClick={() => handleTextDblClick(element)}
          />
        );
        
      case 'image':
        const img = images.get(element.id);
        if (!img) return null;
        return (
          <KonvaImage
            key={element.id}
            {...commonProps}
            image={img}
            width={element.width || 200}
            height={element.height || 200}
          />
        );
        
      case 'shape':
        if (element.props.shapeType === 'rectangle') {
          return (
            <Rect
              key={element.id}
              {...commonProps}
              width={element.width || 100}
              height={element.height || 100}
              stroke={element.props.color}
              strokeWidth={element.props.strokeWidth}
              fill="transparent"
            />
          );
        }
        if (element.props.shapeType === 'circle') {
          return (
            <Circle
              key={element.id}
              {...commonProps}
              radius={(element.width || 100) / 2}
              stroke={element.props.color}
              strokeWidth={element.props.strokeWidth}
              fill="transparent"
            />
          );
        }
        if (element.props.shapeType === 'arrow') {
          return (
            <Arrow
              key={element.id}
              {...commonProps}
              points={[0, 0, element.width || 100, 0]}
              stroke={element.props.color}
              strokeWidth={element.props.strokeWidth}
              fill={element.props.color}
              pointerLength={10}
              pointerWidth={10}
            />
          );
        }
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={[0, 0, element.width || 100, 0]}
            stroke={element.props.color}
            strokeWidth={element.props.strokeWidth}
          />
        );
        
      default:
        return null;
    }
  };

  const getCursor = () => {
    switch (activeTool) {
      case 'pan': return 'grab';
      case 'select': return 'default';
      case 'eraser': return 'crosshair';
      case 'pen':
      case 'highlighter':
        return 'crosshair';
      default: return 'crosshair';
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container w-full h-full"
      style={{ cursor: getCursor() }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        draggable={activeTool === 'pan'}
        onDragEnd={(e) => activeTool === 'pan' && setPan(e.target.x(), e.target.y())}
      >
        <Layer>
          {elements.map(renderElement)}
          {currentLine && (
            <Line
              points={currentLine.points}
              stroke={currentLine.color}
              strokeWidth={currentLine.strokeWidth}
              opacity={currentLine.opacity}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            borderStroke="hsl(217, 91%, 60%)"
            anchorFill="white"
            anchorStroke="hsl(217, 91%, 60%)"
            anchorSize={10}
            anchorCornerRadius={2}
          />
        </Layer>
      </Stage>
    </div>
  );
};
