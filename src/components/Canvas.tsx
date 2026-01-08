import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, Group } from 'react-konva';
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [selectedId, deleteElement]);

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

    if (clickedOnEmpty) setSelectedId(null);
    if (activeTool === 'pan') return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentLine({
        points: [pos.x, pos.y],
        color: activeColor,
        strokeWidth: activeTool === 'highlighter' ? strokeWidth * 2 : strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.4 : 1,
      });
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

  const renderElement = (element: CanvasElement) => {
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: activeTool === 'select',
      onClick: () => activeTool === 'select' && setSelectedId(element.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        updateElement(element.id, { x: e.target.x(), y: e.target.y() });
        saveToHistory();
      },
    };

    switch (element.type) {
      case 'draw':
        return (
          <Line
            key={element.id}
            points={element.props.points}
            stroke={element.props.color}
            strokeWidth={element.props.strokeWidth}
            opacity={element.props.opacity || 1}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'sticky':
        return (
          <Group key={element.id} {...commonProps}>
            <Rect
              width={element.width || 200}
              height={element.height || 150}
              fill={element.props.stickyColor}
              cornerRadius={8}
              shadowColor="black"
              shadowBlur={10}
              shadowOpacity={0.2}
              shadowOffsetY={4}
            />
            <Text
              text={element.props.text}
              width={(element.width || 200) - 20}
              x={10}
              y={10}
              fontSize={14}
              fill="#333"
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
          />
        );
      case 'shape':
        if (element.props.shapeType === 'rectangle') {
          return <Rect key={element.id} {...commonProps} width={element.width} height={element.height} stroke={element.props.color} strokeWidth={element.props.strokeWidth} />;
        }
        if (element.props.shapeType === 'circle') {
          return <Circle key={element.id} {...commonProps} radius={(element.width || 100) / 2} stroke={element.props.color} strokeWidth={element.props.strokeWidth} />;
        }
        if (element.props.shapeType === 'arrow') {
          return <Arrow key={element.id} {...commonProps} points={[0, 0, element.width || 100, 0]} stroke={element.props.color} strokeWidth={element.props.strokeWidth} fill={element.props.color} />;
        }
        return <Line key={element.id} {...commonProps} points={[0, 0, element.width || 100, 0]} stroke={element.props.color} strokeWidth={element.props.strokeWidth} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container w-full h-full konva-container"
      style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair' }}
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
        </Layer>
      </Stage>
    </div>
  );
};
