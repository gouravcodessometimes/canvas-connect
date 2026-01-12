import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { useStore, CanvasElement } from '@/store/useStore';

interface DrawingLine {
  points: number[];
  color: string;
  strokeWidth: number;
  opacity: number;
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
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

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

  // Load images
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === 'image' && el.props.imageUrl && !loadedImages.has(el.id)) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = el.props.imageUrl;
        img.onload = () => {
          setLoadedImages((prev) => new Map(prev).set(el.id, img));
        };
      }
    });
  }, [elements, loadedImages]);

  // Resize handler
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

  // Transformer update
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    
    if (selectedId && activeTool === 'select') {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, activeTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteElement(selectedId);
        setSelectedId(null);
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

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - panX) / zoom,
      y: (pointer.y - panY) / zoom,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.1, Math.min(5, zoom + direction * 0.1));

    setZoom(newZoom);
    setPan(pointer.x - mousePointTo.x * newZoom, pointer.y - mousePointTo.y * newZoom);
  }, [zoom, panX, panY, setZoom, setPan]);

  const getCanvasPos = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
    const pos = getCanvasPos(e);
    const stage = stageRef.current;
    const target = e.target;
    const clickedOnStage = target === stage;

    // Deselect when clicking on empty canvas
    if (clickedOnStage) {
      setSelectedId(null);
      setEditingTextId(null);
    }

    if (activeTool === 'pan') return;

    // Drawing tools
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentLine({
        points: [pos.x, pos.y],
        color: activeColor,
        strokeWidth: activeTool === 'highlighter' ? strokeWidth * 3 : strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.4 : 1,
      });
      return;
    }

    // Eraser - delete clicked element
    if (activeTool === 'eraser' && !clickedOnStage) {
      const id = target.id() || target.getParent()?.id();
      if (id) {
        deleteElement(id);
        saveToHistory();
      }
      return;
    }

    // Create sticky note
    if (activeTool === 'sticky' && clickedOnStage) {
      addElement({
        type: 'sticky',
        x: pos.x - 100,
        y: pos.y - 75,
        width: 200,
        height: 150,
        props: { stickyColor, text: 'Click to edit' },
      });
      return;
    }

    // Create shape
    if (activeTool === 'shape' && clickedOnStage) {
      addElement({
        type: 'shape',
        x: pos.x,
        y: pos.y,
        width: activeShapeType === 'line' || activeShapeType === 'arrow' ? 120 : 100,
        height: activeShapeType === 'line' || activeShapeType === 'arrow' ? 0 : 100,
        props: { shapeType: activeShapeType, color: activeColor, strokeWidth },
      });
      return;
    }

    // Create text
    if (activeTool === 'text' && clickedOnStage) {
      addElement({
        type: 'text',
        x: pos.x,
        y: pos.y,
        props: { text: 'Double-click to edit', fontSize, color: activeColor },
      });
      return;
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !currentLine) return;
    
    if (activeTool === 'eraser') {
      const target = e.target;
      const stage = stageRef.current;
      if (target !== stage) {
        const id = target.id() || target.getParent()?.id();
        if (id) {
          deleteElement(id);
        }
      }
      return;
    }

    const pos = getCanvasPos(e);
    setCurrentLine({ ...currentLine, points: [...currentLine.points, pos.x, pos.y] });
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

  const handleTextEdit = (element: CanvasElement) => {
    if (activeTool !== 'select') return;
    setEditingTextId(element.id);
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const textNode = stage.findOne('#' + element.id) as Konva.Text;
    if (!textNode) return;
    
    const textPos = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    
    textarea.value = element.props.text || '';
    textarea.style.cssText = `
      position: absolute;
      top: ${stageBox.top + textPos.y}px;
      left: ${stageBox.left + textPos.x}px;
      width: ${Math.max(200, (textNode.width() || 200) * zoom)}px;
      min-height: 40px;
      font-size: ${(element.props.fontSize || 16) * zoom}px;
      font-family: Inter, sans-serif;
      border: 2px solid hsl(217 91% 60%);
      padding: 4px 8px;
      margin: 0;
      background: white;
      color: ${element.props.color || '#000'};
      outline: none;
      resize: none;
      z-index: 1000;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    textarea.focus();
    textarea.select();

    const finish = () => {
      if (document.body.contains(textarea)) {
        updateElement(element.id, { props: { ...element.props, text: textarea.value } });
        document.body.removeChild(textarea);
        setEditingTextId(null);
        saveToHistory();
      }
    };

    textarea.addEventListener('blur', finish);
    textarea.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' || (ev.key === 'Enter' && !ev.shiftKey)) {
        finish();
      }
    });
  };

  const handleTransform = (element: CanvasElement, node: Konva.Node) => {
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
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      draggable: activeTool === 'select',
      onClick: () => {
        if (activeTool === 'select') setSelectedId(element.id);
        if (activeTool === 'eraser') { deleteElement(element.id); saveToHistory(); }
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        updateElement(element.id, { x: e.target.x(), y: e.target.y() });
        saveToHistory();
      },
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransform(element, e.target),
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
            onClick={() => activeTool === 'eraser' && deleteElement(element.id)}
          />
        );

      case 'sticky':
        return (
          <Group key={element.id} {...commonProps} onDblClick={() => handleTextEdit(element)}>
            <Rect
              width={element.width || 200}
              height={element.height || 150}
              fill={element.props.stickyColor}
              cornerRadius={8}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={12}
              shadowOffsetY={4}
              stroke={selectedId === element.id ? 'hsl(217, 91%, 60%)' : undefined}
              strokeWidth={selectedId === element.id ? 2 : 0}
            />
            <Text
              text={element.props.text}
              width={(element.width || 200) - 20}
              height={(element.height || 150) - 20}
              x={10}
              y={10}
              fontSize={14}
              fill="#333"
              fontFamily="Inter, sans-serif"
              wrap="word"
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
            onDblClick={() => handleTextEdit(element)}
          />
        );

      case 'image':
        const img = loadedImages.get(element.id);
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
        const shapeType = element.props.shapeType;
        if (shapeType === 'rectangle') {
          return (
            <Rect
              key={element.id}
              {...commonProps}
              width={element.width || 100}
              height={element.height || 100}
              stroke={element.props.color}
              strokeWidth={element.props.strokeWidth}
            />
          );
        }
        if (shapeType === 'circle') {
          return (
            <Circle
              key={element.id}
              {...commonProps}
              radius={(element.width || 100) / 2}
              stroke={element.props.color}
              strokeWidth={element.props.strokeWidth}
            />
          );
        }
        if (shapeType === 'arrow') {
          return (
            <Arrow
              key={element.id}
              {...commonProps}
              points={[0, 0, element.width || 100, 0]}
              stroke={element.props.color}
              strokeWidth={element.props.strokeWidth}
              fill={element.props.color}
              pointerLength={12}
              pointerWidth={12}
            />
          );
        }
        // Line
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
      default: return 'crosshair';
    }
  };

  return (
    <div ref={containerRef} className="canvas-container w-full h-full" style={{ cursor: getCursor() }}>
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
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
            borderStroke="hsl(217, 91%, 60%)"
            anchorFill="white"
            anchorStroke="hsl(217, 91%, 60%)"
            anchorSize={8}
            anchorCornerRadius={2}
          />
        </Layer>
      </Stage>
    </div>
  );
};
