import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Whiteboard.css';
import useLoginContext from '../hooks/useLoginContext.ts';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colour: string;
  size: number;
  isEraser: boolean;
}

interface WhiteboardProps {
  readonly?: boolean;
  gameId: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ readonly = false, gameId = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [lastPos, setLastPos] = useState<Point | null>(null);
  const [brushSize, setBrushSize] = useState(2);
  const { socket } = useLoginContext();

  const drawStroke = useCallback(
    (s: Stroke) => {
      if (!ctx || !canvasRef.current) return;
      ctx.globalCompositeOperation = s.isEraser ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.colour;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x1, s.y1);
      ctx.stroke();
      ctx.closePath();
    },
    [ctx],
  );

  // Initialise canvas context once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Make the canvas match its displayed size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Set up drawing defaults
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;

    setCtx(context);
    // ignore the error below, fixing it causes the canvas to be reset after adjusting brush size
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gameId || !ctx) return;

    // 1) ask for existing strokes
    socket.emit('whiteboardInit', { gameId });

    // 2) render full history
    socket.on('whiteboardInit', (strokes: Stroke[]) => strokes.forEach(drawStroke));
    // 3) render each new stroke
    socket.on('whiteboardDraw', (s: Stroke) => drawStroke(s));
    // 4) clear canvas when requested
    socket.on('whiteboardClear', () => {
      if (canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    return () => {
      socket.off('whiteboardInit');
      socket.off('whiteboardDraw');
      socket.off('whiteboardClear');
    };
  }, [gameId, drawStroke, ctx, socket]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly || !ctx || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastPos({ x, y });

    // Choose pen or eraser
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : penColor;
    ctx.lineWidth = brushSize;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly || !isDrawing || !ctx || !lastPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    // send this segment to the server
    const stroke: Stroke = {
      x0: lastPos.x,
      y0: lastPos.y,
      x1: x,
      y1: y,
      colour: ctx.strokeStyle as string,
      size: ctx.lineWidth,
      isEraser: ctx.globalCompositeOperation === 'destination-out',
    };
    socket.emit('whiteboardDraw', { gameId, stroke });
    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
    setLastPos(null);
  };

  const clearCanvas = () => {
    if (readonly || !ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit('whiteboardClear', { gameId });
  };

  return (
    <div className='whiteboard-container'>
      {!readonly && (
        <div className='toolbar'>
          <label>
            Pen colour:{' '}
            <input
              type='color'
              value={penColor}
              onChange={e => {
                setPenColor(e.target.value);
                setIsEraser(false);
              }}
            />
          </label>
          <button onClick={() => setIsEraser(!isEraser)} className={isEraser ? 'active' : ''}>
            {isEraser ? '🧽' : '🖊️'}
          </button>
          <label>
            Brush size:
            <input
              type='range'
              min={1}
              max={20}
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
            />
            {brushSize}px
          </label>
          <button onClick={clearCanvas} className='clear-canvas-btn' title='Clear canvas'>
            🗑️
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className='whiteboard-canvas'
        onPointerDown={readonly ? undefined : startDrawing}
        onPointerMove={readonly ? undefined : draw}
        onPointerUp={readonly ? undefined : stopDrawing}
        onPointerLeave={readonly ? undefined : stopDrawing}
        style={{
          touchAction: 'none',
          cursor: readonly ? 'default' : 'crosshair',
        }}
      />
    </div>
  );
};

export default Whiteboard;
