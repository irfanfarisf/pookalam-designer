import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MousePointer,
  Flower2,
  PenTool,
  Shapes,
  PaintBucket,
  Eraser,
  Sparkles,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Shuffle,
  Info,
  Sliders,
  Sun,
  Move,
  RotateCw as RotateIcon,
  Scaling,
  Palette,
  ArrowRight,
  Menu,
  X,
  Upload,
  HelpCircle,
  Share2,
  Heart,
  PlusCircle,
  Eye,
  BookOpen,
  CheckCircle2,
  Tag,
} from 'lucide-react';

// ============================================================================
// TYPES & DATA ARCHITECTURE
// ============================================================================

export type ToolType =
  | 'select'
  | 'flower'
  | 'draw'
  | 'shape'
  | 'fill'
  | 'eraser';

export type FlowerType =
  | 'marigold'
  | 'lotus'
  | 'star'
  | 'rose'
  | 'layered'
  | 'jasmine';

export type ShapeType =
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'leaf'
  | 'petal'
  | 'lotus';

export type SymmetryMode = 0 | 2 | 4 | 6 | 8 | 12;

export interface Point {
  x: number;
  y: number;
}

export interface CanvasObjectBase {
  id: string;
  type: 'flower' | 'stroke' | 'shape' | 'region' | 'fill_image';
  layer: number;
  rotation: number;
  color: string;
}

export interface FlowerObject extends CanvasObjectBase {
  type: 'flower';
  x: number;
  y: number;
  size: number;
  flowerType: FlowerType;
  petalCount: number;
}

export interface StrokeObject extends CanvasObjectBase {
  type: 'stroke';
  points: Point[];
  strokeWidth: number;
  smooth: boolean;
}

export interface ShapeObject extends CanvasObjectBase {
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeWidth: number;
}

export interface RegionObject extends CanvasObjectBase {
  type: 'region';
  pathPoints: Point[];
  fillColor: string;
}

export interface FillImageObject extends CanvasObjectBase {
  type: 'fill_image';
  dataUrl: string;
  width: number;
  height: number;
}

export type CanvasObject =
  | FlowerObject
  | StrokeObject
  | ShapeObject
  | RegionObject
  | FillImageObject;

type TransformAction = 'drag' | 'resize' | 'rotate' | null;

export interface ShowcaseDesign {
  id: string;
  title: string;
  artist: string;
  likes: number;
  tags: string[];
  image: string;
  description: string;
  date: string;
}

// ============================================================================
// PALETTE & PRESETS DATA
// ============================================================================

const ONAM_PALETTE = [
  { name: 'Marigold Yellow', hex: '#FFC107' },
  { name: 'Deep Gold', hex: '#FF9800' },
  { name: 'Flame Red', hex: '#E53935' },
  { name: 'Sunset Pink', hex: '#E91E63' },
  { name: 'Jasmine White', hex: '#FDFBF7' },
  { name: 'Fresh Leaf Green', hex: '#4CAF50' },
  { name: 'Emerald Teal', hex: '#009688' },
  { name: 'Royal Purple', hex: '#7B1FA2' },
  { name: 'Traditional Maroon', hex: '#880E4F' },
  { name: 'Deep Crimson', hex: '#B71C1C' },
];

const FLOWER_TYPES: { type: FlowerType; label: string }[] = [
  { type: 'marigold', label: 'Chethi (Marigold)' },
  { type: 'lotus', label: 'Thamara (Lotus)' },
  { type: 'star', label: 'Mukkutti (Star)' },
  { type: 'rose', label: 'Rose' },
  { type: 'layered', label: 'Jamanthi (Dahlia)' },
  { type: 'jasmine', label: 'Pichakam (Jasmine)' },
];

const SHAPE_TYPES: { type: ShapeType; label: string }[] = [
  { type: 'circle', label: 'Circle' },
  { type: 'ellipse', label: 'Ellipse' },
  { type: 'square', label: 'Square' },
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'star', label: 'Star' },
  { type: 'leaf', label: 'Leaf' },
  { type: 'petal', label: 'Petal' },
  { type: 'lotus', label: 'Lotus Motif' },
];

const INITIAL_SHOWCASE: ShowcaseDesign[] = [
  {
    id: 'sc-1',
    title: 'Mahabali Swaagatham',
    artist: 'Ananya Nair',
    likes: 342,
    tags: ['Traditional', 'Lotus Center'],
    image:
      'https://images.unsplash.com/photo-1605885121974-ab128d8b13d2?auto=format&fit=crop&q=80&w=600',
    description:
      'A classic ten-ring traditional pookalam layout featuring vibrant orange Chethi and white Pichakam outer borders welcoming King Mahabali.',
    date: '2026-08-10',
  },
  {
    id: 'sc-2',
    title: 'Thiru Onam Radiance',
    artist: 'Vishnu Dev',
    likes: 218,
    tags: ['Symmetric', 'Modern'],
    image:
      '',
    description:
      'A multi-layered 12-way radial design crafted with deep crimson petals and glowing golden geometric star centers.',
    date: '2026-08-15',
  },
  {
    id: 'sc-3',
    title: 'Atham Bloom Harmony',
    artist: 'Meera Kurup',
    likes: 189,
    tags: ['Minimalist', 'Floral'],
    image:
      '',
    description:
      'Designed to represent the simplicity of Atham, the first day of Onam. Focuses on pure jasmine whites and marigold yellows.',
    date: '2026-08-18',
  },
];

const imageCache = new Map<string, HTMLImageElement>();

function getLoadedImage(dataUrl: string): HTMLImageElement | null {
  if (imageCache.has(dataUrl)) {
    return imageCache.get(dataUrl)!;
  }
  const img = new Image();
  img.src = dataUrl;
  imageCache.set(dataUrl, img);
  return img.complete ? img : null;
}

// ============================================================================
// HELPER FUNCTIONS & SHAPE RECOGNITION
// ============================================================================

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function recognizeShape(points: Point[]): {
  recognized: ShapeType | null;
  confidence: number;
  bounds?: any;
} {
  if (points.length < 5) return { recognized: null, confidence: 0 };

  const first = points[0];
  const last = points[points.length - 1];
  const endDist = distance(first, last);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  let cx = 0,
    cy = 0;
  points.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    cx += p.x;
    cy += p.y;
  });
  cx /= points.length;
  cy /= points.length;

  const width = maxX - minX;
  const height = maxY - minY;
  const isClosed = endDist < Math.max(width, height) * 0.35 || endDist < 40;

  if (isClosed) {
    const avgRadius = (width + height) / 4;
    let radiusVariance = 0;
    points.forEach((p) => {
      const r = distance(p, { x: cx, y: cy });
      radiusVariance += Math.abs(r - avgRadius);
    });
    radiusVariance /= points.length;

    if (radiusVariance / avgRadius < 0.25) {
      const isCircle = Math.abs(width - height) / Math.max(width, height) < 0.25;
      return {
        recognized: isCircle ? 'circle' : 'ellipse',
        confidence: 0.88,
        bounds: { x: cx, y: cy, width, height },
      };
    }

    if (points.length >= 8) {
      return {
        recognized: Math.abs(width - height) < 20 ? 'square' : 'rectangle',
        confidence: 0.75,
        bounds: { x: minX + width / 2, y: minY + height / 2, width, height },
      };
    }
  }

  return { recognized: null, confidence: 0 };
}

function closeGapIfNear(points: Point[], threshold = 35): Point[] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) <= threshold) {
    return [...points, { ...first }];
  }
  return points;
}

function hexToRgba(hex: string): [number, number, number, number] {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

// ============================================================================
// CANVAS RENDERING ENGINE
// ============================================================================

function renderFlower(ctx: CanvasRenderingContext2D, flower: FlowerObject) {
  ctx.save();
  ctx.translate(flower.x, flower.y);
  ctx.rotate((flower.rotation * Math.PI) / 180);

  const radius = flower.size / 2;
  const petals = flower.petalCount || 8;

  switch (flower.flowerType) {
    case 'marigold': {
      for (let layer = 3; layer >= 1; layer--) {
        const layerRadius = (radius * layer) / 3;
        const count = petals * layer;
        ctx.fillStyle =
          layer === 3 ? flower.color : layer === 2 ? '#FFA000' : '#FFD54F';
        for (let i = 0; i < count; i++) {
          const angle = (i * 2 * Math.PI) / count;
          const px = Math.cos(angle) * layerRadius;
          const py = Math.sin(angle) * layerRadius;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#3E2723';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lotus': {
      ctx.fillStyle = flower.color;
      for (let i = 0; i < petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(radius * 0.5, -radius * 0.6, 0, -radius);
        ctx.quadraticCurveTo(-radius * 0.5, -radius * 0.6, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#FFF59D';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'star':
    case 'jasmine': {
      ctx.fillStyle = flower.color;
      for (let i = 0; i < petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius * 0.3, -radius * 0.3);
        ctx.lineTo(0, -radius);
        ctx.lineTo(-radius * 0.3, -radius * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#FF6F00';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rose': {
      ctx.fillStyle = flower.color;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF88';
      ctx.lineWidth = 2;
      for (let r = radius * 0.8; r > 2; r -= 5) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.5);
        ctx.stroke();
      }
      break;
    }
    default: {
      ctx.fillStyle = flower.color;
      for (let i = 0; i < petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, -radius * 0.5, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function renderShape(ctx: CanvasRenderingContext2D, shape: ShapeObject) {
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate((shape.rotation * Math.PI) / 180);

  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  if (shape.fillColor) ctx.fillStyle = shape.fillColor;

  const w = shape.width;
  const h = shape.height;

  ctx.beginPath();
  switch (shape.shapeType) {
    case 'circle':
      ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
      break;
    case 'ellipse':
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'rectangle':
    case 'square':
      ctx.rect(-w / 2, -h / 2, w, h);
      break;
    case 'triangle':
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(0, h / 2);
      ctx.lineTo(-w / 2, 0);
      ctx.closePath();
      break;
    case 'star': {
      const points = 5;
      const outerR = w / 2;
      const innerR = outerR * 0.4;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case 'leaf':
    case 'petal':
      ctx.moveTo(0, -h / 2);
      ctx.quadraticCurveTo(w / 2, 0, 0, h / 2);
      ctx.quadraticCurveTo(-w / 2, 0, 0, -h / 2);
      break;
    case 'lotus':
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w / 2, -h / 4, w / 2, h / 4, 0, h / 2);
      ctx.bezierCurveTo(-w / 2, h / 4, -w / 2, -h / 4, 0, -h / 2);
      break;
  }

  if (shape.fillColor) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: StrokeObject) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  if (stroke.smooth && stroke.points.length > 2) {
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }
    ctx.lineTo(
      stroke.points[stroke.points.length - 1].x,
      stroke.points[stroke.points.length - 1].y
    );
  } else {
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

function renderRegion(ctx: CanvasRenderingContext2D, region: RegionObject) {
  if (region.pathPoints.length < 3) return;
  ctx.save();
  ctx.fillStyle = region.fillColor;
  ctx.beginPath();
  ctx.moveTo(region.pathPoints[0].x, region.pathPoints[0].y);
  for (let i = 1; i < region.pathPoints.length; i++) {
    ctx.lineTo(region.pathPoints[i].x, region.pathPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderFillImage(
  ctx: CanvasRenderingContext2D,
  fillObj: FillImageObject
) {
  const img = getLoadedImage(fillObj.dataUrl);
  if (img) {
    ctx.save();
    ctx.drawImage(
      img,
      -fillObj.width / 2,
      -fillObj.height / 2,
      fillObj.width,
      fillObj.height
    );
    ctx.restore();
  }
}

function renderSelectionControls(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject
) {
  let cx = 0,
    cy = 0,
    w = 0,
    h = 0,
    rot = 0;

  if (obj.type === 'flower') {
    const f = obj as FlowerObject;
    cx = f.x;
    cy = f.y;
    w = f.size;
    h = f.size;
    rot = f.rotation;
  } else if (obj.type === 'shape') {
    const s = obj as ShapeObject;
    cx = s.x;
    cy = s.y;
    w = s.width;
    h = s.height;
    rot = s.rotation;
  } else {
    return;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);

  const halfW = w / 2;
  const halfH = h / 2;

  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(-halfW, -halfH, w, h);
  ctx.setLineDash([]);

  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3B82F6';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(halfW + 12, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -halfH);
  ctx.lineTo(0, -halfH - 18);
  ctx.strokeStyle = '#10B981';
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(0, -halfH - 18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// DESIGNER STUDIO COMPONENT
// ============================================================================

function PookalamCanvasStudio({ onBackToHome }: { onBackToHome: () => void }) {
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [history, setHistory] = useState<CanvasObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [activeTool, setActiveTool] = useState<ToolType>('flower');
  const [selectedColor, setSelectedColor] = useState<string>('#FF9800');
  const [flowerType, setFlowerType] = useState<FlowerType>('marigold');
  const [flowerSize, setFlowerSize] = useState<number>(50);
  const [petalCount] = useState<number>(8);
  const [shapeType, setShapeType] = useState<ShapeType>('circle');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [symmetry, setSymmetry] = useState<SymmetryMode>(0);
  const [smartMode, setSmartMode] = useState<boolean>(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTransform, setActiveTransform] = useState<TransformAction>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  const [statusMessage, setStatusMessage] = useState<string>(
    'Ready! Tap or click canvas to start drawing.'
  );
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Mobile drawer controls & Modals
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pushState = useCallback(
    (newObjects: CanvasObject[]) => {
      const updatedHistory = history.slice(0, historyIndex + 1);
      setHistory([...updatedHistory, newObjects]);
      setHistoryIndex(updatedHistory.length);
      setObjects(newObjects);
    },
    [history, historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setObjects(history[prevIdx]);
      setStatusMessage('Undo performed.');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setObjects(history[nextIdx]);
      setStatusMessage('Redo performed.');
    }
  }, [history, historyIndex]);

  const clearAllDesign = useCallback(() => {
    if (objects.length === 0) return;
    if (window.confirm('Are you sure you want to clear your current design?')) {
      pushState([]);
      setSelectedId(null);
      setStatusMessage('Cleared entire design workspace.');
    }
  }, [objects, pushState]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushState(objects.filter((o) => o.id !== selectedId));
    setSelectedId(null);
    setStatusMessage('Object deleted.');
  }, [objects, selectedId, pushState]);

  const saveDesign = useCallback(() => {
    try {
      const serialized = JSON.stringify({ objects, symmetry, smartMode });
      localStorage.setItem('pookalam_designer_save', serialized);
      setStatusMessage('Pookalam design saved to local browser storage!');
    } catch (e) {
      setStatusMessage('Error saving design.');
    }
  }, [objects, symmetry, smartMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDesign();
      } else if (e.key === 'Delete' && selectedId) {
        deleteSelected();
      } else if (e.key === 'f') setActiveTool('fill');
      else if (e.key === 'd') setActiveTool('draw');
      else if (e.key === 's') setActiveTool('select');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, saveDesign, deleteSelected, selectedId]);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const radius = 260;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFDF5';
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();

    const sorted = [...objects].sort((a, b) => a.layer - b.layer);
    sorted.forEach((obj) => {
      if (obj.type === 'fill_image') renderFillImage(ctx, obj as FillImageObject);
      else if (obj.type === 'region') renderRegion(ctx, obj as RegionObject);
      else if (obj.type === 'stroke') renderStroke(ctx, obj as StrokeObject);
      else if (obj.type === 'shape') renderShape(ctx, obj as ShapeObject);
      else if (obj.type === 'flower') renderFlower(ctx, obj as FlowerObject);

      if (obj.id === selectedId) {
        renderSelectionControls(ctx, obj);
      }
    });

    if (isDrawing && currentStroke.length > 1) {
      renderStroke(ctx, {
        id: 'preview',
        type: 'stroke',
        layer: 4,
        rotation: 0,
        color: selectedColor,
        points: currentStroke,
        strokeWidth: brushSize,
        smooth: true,
      });
    }

    ctx.restore();
  }, [
    objects,
    zoom,
    pan,
    selectedId,
    isDrawing,
    currentStroke,
    selectedColor,
    brushSize,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        redrawCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  const handleFloodFill = (clickPt: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    offCtx.save();
    offCtx.translate(pan.x, pan.y);
    offCtx.scale(zoom, zoom);

    const radius = 260;
    offCtx.beginPath();
    offCtx.arc(0, 0, radius, 0, Math.PI * 2);
    offCtx.fillStyle = '#FFFDF5';
    offCtx.fill();
    offCtx.clip();

    const sorted = [...objects].sort((a, b) => a.layer - b.layer);
    sorted.forEach((obj) => {
      if (obj.type === 'fill_image') renderFillImage(offCtx, obj as FillImageObject);
      else if (obj.type === 'region') renderRegion(offCtx, obj as RegionObject);
      else if (obj.type === 'stroke') renderStroke(offCtx, obj as StrokeObject);
      else if (obj.type === 'shape') renderShape(offCtx, obj as ShapeObject);
      else if (obj.type === 'flower') renderFlower(offCtx, obj as FlowerObject);
    });
    offCtx.restore();

    const screenX = Math.floor(clickPt.x * zoom + pan.x);
    const screenY = Math.floor(clickPt.y * zoom + pan.y);

    if (screenX < 0 || screenX >= width || screenY < 0 || screenY >= height)
      return;

    const imgData = offCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const startOffset = (screenY * width + screenX) * 4;
    const targetColor = [
      data[startOffset],
      data[startOffset + 1],
      data[startOffset + 2],
      data[startOffset + 3],
    ];

    const fillRGBA = hexToRgba(selectedColor);

    const colorsMatch = (c1: number[], c2: number[]) => {
      return (
        Math.abs(c1[0] - c2[0]) < 32 &&
        Math.abs(c1[1] - c2[1]) < 32 &&
        Math.abs(c1[2] - c2[2]) < 32 &&
        Math.abs(c1[3] - c2[3]) < 32
      );
    };

    if (colorsMatch(targetColor, fillRGBA)) return;

    const fillCanvas = document.createElement('canvas');
    fillCanvas.width = width;
    fillCanvas.height = height;
    const fillCtx = fillCanvas.getContext('2d');
    if (!fillCtx) return;

    const fillData = fillCtx.createImageData(width, height);
    const outData = fillData.data;

    const queue: [number, number][] = [[screenX, screenY]];
    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
      const [x, y] = queue.pop()!;
      const idx = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) continue;
      visited[idx] = 1;

      const offset = idx * 4;
      const curColor = [
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3],
      ];

      if (colorsMatch(curColor, targetColor)) {
        outData[offset] = fillRGBA[0];
        outData[offset + 1] = fillRGBA[1];
        outData[offset + 2] = fillRGBA[2];
        outData[offset + 3] = fillRGBA[3];

        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }
    }

    fillCtx.putImageData(fillData, 0, 0);

    const fillImageObj: FillImageObject = {
      id: `fill_${Date.now()}`,
      type: 'fill_image',
      layer: 1,
      rotation: 0,
      color: selectedColor,
      dataUrl: fillCanvas.toDataURL(),
      width: width / zoom,
      height: height / zoom,
    };

    pushState([...objects, fillImageObj]);
    setStatusMessage('Filled enclosed region.');
  };

  const generateSymmetricObjects = (
    baseObj: CanvasObject,
    symCount: SymmetryMode
  ): CanvasObject[] => {
    if (symCount <= 0) return [baseObj];

    const result: CanvasObject[] = [];
    const stepAngle = 360 / symCount;

    for (let i = 0; i < symCount; i++) {
      const angleRad = (i * stepAngle * Math.PI) / 180;

      if (baseObj.type === 'flower') {
        const f = baseObj as FlowerObject;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        result.push({
          ...f,
          id: `${f.id}_sym_${i}`,
          x: f.x * cos - f.y * sin,
          y: f.x * sin + f.y * cos,
          rotation: f.rotation + i * stepAngle,
        });
      } else if (baseObj.type === 'shape') {
        const s = baseObj as ShapeObject;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        result.push({
          ...s,
          id: `${s.id}_sym_${i}`,
          x: s.x * cos - s.y * sin,
          y: s.x * sin + s.y * cos,
          rotation: s.rotation + i * stepAngle,
        });
      } else if (baseObj.type === 'stroke') {
        const str = baseObj as StrokeObject;
        const newPoints = str.points.map((p) => {
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          return {
            x: p.x * cos - p.y * sin,
            y: p.x * sin + p.y * cos,
          };
        });
        result.push({
          ...str,
          id: `${str.id}_sym_${i}`,
          points: newPoints,
        });
      }
    }
    return result;
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    const distFromCenter = Math.sqrt(pt.x ** 2 + pt.y ** 2);

    if (selectedId) {
      const selectedObj = objects.find((o) => o.id === selectedId);
      if (
        selectedObj &&
        (selectedObj.type === 'flower' || selectedObj.type === 'shape')
      ) {
        let cx = 0,
          cy = 0,
          w = 0,
          h = 0,
          rot = 0;
        if (selectedObj.type === 'flower') {
          const f = selectedObj as FlowerObject;
          cx = f.x;
          cy = f.y;
          w = f.size;
          h = f.size;
          rot = f.rotation;
        } else {
          const s = selectedObj as ShapeObject;
          cx = s.x;
          cy = s.y;
          w = s.width;
          h = s.height;
          rot = s.rotation;
        }

        const rad = (rot * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        if (distance({ x: localX, y: localY }, { x: w / 2 + 12, y: 0 }) <= 12) {
          setActiveTransform('resize');
          setDragStartPoint(pt);
          return;
        }

        if (distance({ x: localX, y: localY }, { x: 0, y: -h / 2 - 18 }) <= 12) {
          setActiveTransform('rotate');
          setDragStartPoint(pt);
          return;
        }

        if (distance({ x: localX, y: localY }, { x: 0, y: 0 }) <= 16) {
          setActiveTransform('drag');
          setDragStartPoint(pt);
          return;
        }
      }
    }

    if (distFromCenter > 260 && activeTool !== 'select') {
      setStatusMessage('Stay inside the circular boundary!');
      return;
    }

    if (activeTool === 'select') {
      const clicked = [...objects].reverse().find((obj) => {
        if (obj.type === 'flower') {
          const f = obj as FlowerObject;
          return distance(pt, { x: f.x, y: f.y }) <= f.size / 2 + 10;
        } else if (obj.type === 'shape') {
          const s = obj as ShapeObject;
          return (
            distance(pt, { x: s.x, y: s.y }) <=
            Math.max(s.width, s.height) / 2 + 10
          );
        }
        return false;
      });

      setSelectedId(clicked ? clicked.id : null);
      if (clicked) {
        setActiveTransform('drag');
        setDragStartPoint(pt);
        setStatusMessage(`Selected ${clicked.type}. Use handles to modify.`);
      }
    } else if (activeTool === 'flower') {
      const newFlower: FlowerObject = {
        id: `flower_${Date.now()}`,
        type: 'flower',
        layer: 5,
        x: pt.x,
        y: pt.y,
        size: flowerSize,
        rotation: 0,
        color: selectedColor,
        flowerType: flowerType,
        petalCount: petalCount,
      };
      const symItems = generateSymmetricObjects(newFlower, symmetry);
      pushState([...objects, ...symItems]);
      setSelectedId(newFlower.id);
      setStatusMessage(`Placed ${flowerType} flower.`);
    } else if (activeTool === 'shape') {
      const newShape: ShapeObject = {
        id: `shape_${Date.now()}`,
        type: 'shape',
        layer: 3,
        shapeType: shapeType,
        x: pt.x,
        y: pt.y,
        width: flowerSize * 1.5,
        height: flowerSize * 1.5,
        rotation: 0,
        color: selectedColor,
        strokeWidth: brushSize,
      };
      const symItems = generateSymmetricObjects(newShape, symmetry);
      pushState([...objects, ...symItems]);
      setSelectedId(newShape.id);
      setStatusMessage(`Created ${shapeType} shape.`);
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentStroke([pt]);
    } else if (activeTool === 'fill') {
      handleFloodFill(pt);
    } else if (activeTool === 'eraser') {
      const filtered = objects.filter((obj) => {
        if (obj.type === 'flower') {
          const f = obj as FlowerObject;
          return distance(pt, { x: f.x, y: f.y }) > f.size / 2;
        }
        return true;
      });
      if (filtered.length !== objects.length) {
        pushState(filtered);
        setStatusMessage('Erased element.');
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);

    if (activeTransform && selectedId) {
      const dx = pt.x - dragStartPoint.x;
      const dy = pt.y - dragStartPoint.y;

      setObjects((prev) =>
        prev.map((obj) => {
          if (obj.id !== selectedId) return obj;

          if (activeTransform === 'drag') {
            if (obj.type === 'flower') {
              return {
                ...obj,
                x: (obj as FlowerObject).x + dx,
                y: (obj as FlowerObject).y + dy,
              };
            } else if (obj.type === 'shape') {
              return {
                ...obj,
                x: (obj as ShapeObject).x + dx,
                y: (obj as ShapeObject).y + dy,
              };
            }
          } else if (activeTransform === 'resize') {
            if (obj.type === 'flower') {
              const f = obj as FlowerObject;
              return { ...f, size: Math.max(15, f.size + dx) };
            } else if (obj.type === 'shape') {
              const s = obj as ShapeObject;
              return {
                ...s,
                width: Math.max(15, s.width + dx),
                height: Math.max(15, s.height + dx),
              };
            }
          } else if (activeTransform === 'rotate') {
            let cx = 0,
              cy = 0;
            if (obj.type === 'flower') {
              cx = (obj as FlowerObject).x;
              cy = (obj as FlowerObject).y;
            }
            if (obj.type === 'shape') {
              cx = (obj as ShapeObject).x;
              cy = (obj as ShapeObject).y;
            }

            const angleRad = Math.atan2(pt.y - cy, pt.x - cx);
            const deg = (angleRad * 180) / Math.PI + 90;
            return { ...obj, rotation: Math.round(deg) };
          }
          return obj;
        })
      );

      setDragStartPoint(pt);
      return;
    }

    if (isDrawing && activeTool === 'draw') {
      setCurrentStroke((prev) => [...prev, pt]);
    }
  };

  const handlePointerUp = () => {
    if (activeTransform) {
      setActiveTransform(null);
      pushState(objects);
      return;
    }

    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);

      if (currentStroke.length > 2) {
        let finalPoints = currentStroke;

        if (smartMode) {
          finalPoints = closeGapIfNear(finalPoints);
          const recognition = recognizeShape(finalPoints);

          if (recognition.recognized && recognition.bounds) {
            const recognizedShape: ShapeObject = {
              id: `shape_${Date.now()}`,
              type: 'shape',
              layer: 3,
              shapeType: recognition.recognized,
              x: recognition.bounds.x,
              y: recognition.bounds.y,
              width: recognition.bounds.width,
              height: recognition.bounds.height,
              rotation: 0,
              color: selectedColor,
              strokeWidth: brushSize,
            };
            const symItems = generateSymmetricObjects(
              recognizedShape,
              symmetry
            );
            pushState([...objects, ...symItems]);
            setStatusMessage(
              `Smart Mode perfected a ${recognition.recognized}!`
            );
            setCurrentStroke([]);
            return;
          }
        }

        const newStroke: StrokeObject = {
          id: `stroke_${Date.now()}`,
          type: 'stroke',
          layer: 4,
          rotation: 0,
          color: selectedColor,
          points: finalPoints,
          strokeWidth: brushSize,
          smooth: true,
        };
        const symItems = generateSymmetricObjects(newStroke, symmetry);
        pushState([...objects, ...symItems]);
        setStatusMessage('Stroke added.');
      }
      setCurrentStroke([]);
    }
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const target = objects.find((o) => o.id === selectedId);
    if (target) {
      const dup = { ...target, id: `${target.id}_copy_${Date.now()}` };
      if ('x' in dup) dup.x += 15;
      if ('y' in dup) dup.y += 15;
      pushState([...objects, dup]);
      setSelectedId(dup.id);
      setStatusMessage('Object duplicated.');
    }
  };

  const updateSelectedColor = (color: string) => {
    setSelectedColor(color);
    if (!selectedId) return;
    pushState(
      objects.map((o) => {
        if (o.id === selectedId) {
          if (o.type === 'shape' && (o as ShapeObject).fillColor) {
            return { ...o, fillColor: color, color: color };
          }
          return { ...o, color: color };
        }
        return o;
      })
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const fillObj: FillImageObject = {
          id: `image_${Date.now()}`,
          type: 'fill_image',
          layer: 2,
          rotation: 0,
          color: selectedColor,
          dataUrl: dataUrl,
          width: Math.min(250, img.width),
          height: Math.min(250, img.height),
        };
        pushState([...objects, fillObj]);
        setStatusMessage('Image uploaded onto canvas!');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const loadPreset = (presetType: 'traditional' | 'grand' | 'minimal') => {
    const newObjs: CanvasObject[] = [];
    if (presetType === 'traditional') {
      newObjs.push({
        id: 'center_lotus',
        type: 'flower',
        layer: 5,
        x: 0,
        y: 0,
        size: 80,
        rotation: 0,
        color: '#E91E63',
        flowerType: 'lotus',
        petalCount: 12,
      });
      for (let i = 0; i < 12; i++) {
        const angle = (i * 360) / 12;
        const rad = (angle * Math.PI) / 180;
        newObjs.push({
          id: `trad_ring_${i}`,
          type: 'flower',
          layer: 5,
          x: Math.cos(rad) * 120,
          y: Math.sin(rad) * 120,
          size: 40,
          rotation: angle,
          color: '#FF9800',
          flowerType: 'marigold',
          petalCount: 8,
        });
      }
    } else if (presetType === 'grand') {
      newObjs.push({
        id: 'grand_center',
        type: 'shape',
        layer: 2,
        shapeType: 'star',
        x: 0,
        y: 0,
        width: 180,
        height: 180,
        color: '#FFC107',
        fillColor: '#880E4F',
        rotation: 0,
        strokeWidth: 4,
      });
      for (let i = 0; i < 16; i++) {
        const angle = (i * 360) / 16;
        const rad = (angle * Math.PI) / 180;
        newObjs.push({
          id: `grand_fl_${i}`,
          type: 'flower',
          layer: 5,
          x: Math.cos(rad) * 180,
          y: Math.sin(rad) * 180,
          size: 36,
          rotation: angle,
          color: '#E53935',
          flowerType: 'layered',
          petalCount: 10,
        });
      }
    } else if (presetType === 'minimal') {
      newObjs.push({
        id: 'min_star',
        type: 'shape',
        layer: 3,
        shapeType: 'lotus',
        x: 0,
        y: 0,
        width: 140,
        height: 140,
        color: '#009688',
        rotation: 0,
        strokeWidth: 3,
      });
    }

    pushState(newObjs);
    setStatusMessage(`Loaded ${presetType} preset!`);
  };

  const generateRandomPookalam = () => {
    const colors = ONAM_PALETTE.map((c) => c.hex);
    const randomColor = () =>
      colors[Math.floor(Math.random() * colors.length)];
    const newObjs: CanvasObject[] = [];

    newObjs.push({
      id: `rnd_center`,
      type: 'flower',
      layer: 5,
      x: 0,
      y: 0,
      size: 70 + Math.random() * 30,
      rotation: 0,
      color: randomColor(),
      flowerType: 'lotus',
      petalCount: 8,
    });

    const count = 8 + Math.floor(Math.random() * 8);
    const radius = 100 + Math.random() * 100;
    const fType =
      FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)].type;
    const ringColor = randomColor();

    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      newObjs.push({
        id: `rnd_ring_${i}`,
        type: 'flower',
        layer: 5,
        x: Math.cos(rad) * radius,
        y: Math.sin(rad) * radius,
        size: 35 + Math.random() * 15,
        rotation: angle,
        color: ringColor,
        flowerType: fType,
        petalCount: 8,
      });
    }

    pushState(newObjs);
    setStatusMessage('Generated random Pookalam!');
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1200;
    exportCanvas.height = 1200;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(600, 600);
    const radius = 520;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFDF5';
    ctx.fill();
    ctx.clip();

    ctx.scale(2, 2);

    const sorted = [...objects].sort((a, b) => a.layer - b.layer);
    sorted.forEach((obj) => {
      if (obj.type === 'fill_image')
        renderFillImage(ctx, obj as FillImageObject);
      else if (obj.type === 'region') renderRegion(ctx, obj as RegionObject);
      else if (obj.type === 'stroke') renderStroke(ctx, obj as StrokeObject);
      else if (obj.type === 'shape') renderShape(ctx, obj as ShapeObject);
      else if (obj.type === 'flower') renderFlower(ctx, obj as FlowerObject);
    });

    const dataURL = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pookalam-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    setStatusMessage('Exported High-Resolution PNG!');
  };

  const selectedObj = objects.find((o) => o.id === selectedId);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF6EE] text-[#4A0E17] font-sans overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#4A0E17] text-[#FFFDF5] shadow-md border-b-2 border-[#D4AF37] z-20">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onBackToHome}
            className="p-1.5 hover:bg-[#5C141E] rounded-full transition text-[#D4AF37]"
            title="Back to Landing Page"
          >
            <ArrowRight className="w-5 h-5 transform rotate-180" />
          </button>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#FF9800] to-[#E53935] flex items-center justify-center shadow-lg border border-[#D4AF37]">
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-wide text-[#FDFBF7] font-serif leading-none">
              POOKALAM STUDIO
            </h1>
            <p className="hidden sm:block text-[10px] text-[#D4AF37] tracking-widest uppercase font-medium">
              Digital Floral Carpet Designer
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setSmartMode(!smartMode)}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition ${
              smartMode
                ? 'bg-[#D4AF37] text-[#4A0E17]'
                : 'bg-[#5C141E] text-[#D4AF37]'
            }`}
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden md:inline">
              {smartMode ? 'Smart ON' : 'Manual'}
            </span>
          </button>

          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 hover:bg-[#5C141E] rounded-md disabled:opacity-40 transition"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4 text-[#D4AF37]" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 hover:bg-[#5C141E] rounded-md disabled:opacity-40 transition"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw className="w-4 h-4 text-[#D4AF37]" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-[#5C141E] hover:bg-[#6E1A26] border border-[#D4AF37]/40 text-[#FFFDF5] rounded-md flex items-center"
            title="Import Image"
          >
            <Upload className="w-4 h-4 text-[#D4AF37]" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={saveDesign}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-[#5C141E] hover:bg-[#6E1A26] border border-[#D4AF37]/40 text-[#FFFDF5] text-xs font-medium rounded-md flex items-center space-x-1"
            title="Save Local"
          >
            <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={exportPNG}
            className="px-3 py-1.5 bg-gradient-to-r from-[#FF9800] to-[#E53935] text-white text-xs font-bold rounded-md flex items-center space-x-1 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-1.5 text-[#D4AF37] hover:bg-[#5C141E] rounded-md"
          >
            {mobileDrawerOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Primary Tool Switcher Bar */}
        <aside className="w-14 sm:w-16 bg-[#FFFDF5] border-r border-[#E0D6C3] flex flex-col items-center py-4 space-y-3 z-10 shadow-sm shrink-0">
          {[
            { id: 'select', label: 'Select', icon: MousePointer },
            { id: 'flower', label: 'Flower', icon: Flower2 },
            { id: 'draw', label: 'Draw', icon: PenTool },
            { id: 'shape', label: 'Shape', icon: Shapes },
            { id: 'fill', label: 'Fill', icon: PaintBucket },
            { id: 'eraser', label: 'Eraser', icon: Eraser },
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ToolType)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#4A0E17] text-[#D4AF37] shadow-md scale-105 border border-[#D4AF37]'
                    : 'text-[#6B3A42] hover:bg-[#F3EBDD]'
                }`}
                title={tool.label}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[9px] mt-0.5 font-medium">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Secondary Inspector Panel (Responsive Slide-over on Mobile) */}
        <aside
          className={`fixed lg:relative inset-y-0 right-0 lg:right-auto z-30 lg:z-10 w-72 lg:w-64 bg-[#F9F3E5] border-l lg:border-l-0 lg:border-r border-[#E0D6C3] p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-300 transform ${
            mobileDrawerOpen
              ? 'translate-x-0'
              : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between lg:hidden border-b border-[#E0D6C3] pb-2">
              <span className="font-bold text-xs text-[#880E4F] uppercase tracking-wider">
                Studio Settings
              </span>
              <button onClick={() => setMobileDrawerOpen(false)}>
                <X className="w-5 h-5 text-[#4A0E17]" />
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#880E4F] mb-3 flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Tool Settings</span>
              </h3>

              {activeTool === 'flower' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#4A0E17] block mb-1">
                      Flower Motif
                    </label>
                    <select
                      value={flowerType}
                      onChange={(e) =>
                        setFlowerType(e.target.value as FlowerType)
                      }
                      className="w-full text-xs bg-[#FFFDF5] border border-[#D4AF37]/50 rounded-lg p-2 text-[#4A0E17] focus:outline-none"
                    >
                      {FLOWER_TYPES.map((f) => (
                        <option key={f.type} value={f.type}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium text-[#4A0E17] mb-1">
                      <span>Size</span>
                      <span>{flowerSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      value={flowerSize}
                      onChange={(e) => setFlowerSize(Number(e.target.value))}
                      className="w-full accent-[#880E4F]"
                    />
                  </div>
                </div>
              )}

              {activeTool === 'shape' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#4A0E17] block mb-1">
                      Geometry Shape
                    </label>
                    <select
                      value={shapeType}
                      onChange={(e) => setShapeType(e.target.value as ShapeType)}
                      className="w-full text-xs bg-[#FFFDF5] border border-[#D4AF37]/50 rounded-lg p-2 text-[#4A0E17] focus:outline-none"
                    >
                      {SHAPE_TYPES.map((s) => (
                        <option key={s.type} value={s.type}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTool === 'draw' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-[#4A0E17] mb-1">
                      <span>Brush Thickness</span>
                      <span>{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-[#880E4F]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Radial Symmetry */}
            <div className="pt-3 border-t border-[#E0D6C3]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#880E4F] mb-2 flex items-center space-x-1">
                <Sun className="w-3.5 h-3.5 text-[#FF9800]" />
                <span>Radial Symmetry</span>
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {([0, 2, 4, 6, 8, 12] as SymmetryMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSymmetry(mode)}
                    className={`py-1.5 text-xs font-semibold rounded-md border transition ${
                      symmetry === mode
                        ? 'bg-[#880E4F] text-[#FFFDF5] border-[#880E4F]'
                        : 'bg-[#FFFDF5] text-[#4A0E17] border-[#D4AF37]/40 hover:bg-[#F3EBDD]'
                    }`}
                  >
                    {mode === 0 ? 'Off' : `${mode}-Way`}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="pt-3 border-t border-[#E0D6C3]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#880E4F] mb-2">
                Onam Colors
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {ONAM_PALETTE.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => updateSelectedColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${
                      selectedColor === color.hex
                        ? 'border-[#4A0E17] scale-110 shadow-md'
                        : 'border-white'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-[#E0D6C3]/60 flex items-center justify-between">
                <label className="text-xs font-medium text-[#4A0E17] flex items-center space-x-1.5 cursor-pointer">
                  <Palette className="w-3.5 h-3.5 text-[#880E4F]" />
                  <span>Custom Color</span>
                </label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => updateSelectedColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#D4AF37]/50 p-0.5 bg-[#FFFDF5]"
                />
              </div>
            </div>

            {/* Controls for Selected Object */}
            {selectedObj &&
              (selectedObj.type === 'flower' ||
                selectedObj.type === 'shape') && (
                <div className="pt-3 border-t border-[#E0D6C3] bg-[#FFFDF5] p-3 rounded-xl border border-[#D4AF37]/40 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#880E4F] uppercase">
                      Selected Element
                    </h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={duplicateSelected}
                        className="p-1 text-[#4A0E17] hover:bg-[#F3EBDD] rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={deleteSelected}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#4A0E17] mb-1">
                      <span>Scale / Size</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="200"
                      value={
                        selectedObj.type === 'flower'
                          ? (selectedObj as FlowerObject).size
                          : (selectedObj as ShapeObject).width
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        pushState(
                          objects.map((o) => {
                            if (o.id === selectedId) {
                              if (o.type === 'flower')
                                return { ...o, size: val };
                              if (o.type === 'shape')
                                return { ...o, width: val, height: val };
                            }
                            return o;
                          })
                        );
                      }}
                      className="w-full accent-[#880E4F]"
                    />
                  </div>
                </div>
              )}

            {/* Presets & Actions */}
            <div className="pt-3 border-t border-[#E0D6C3] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#880E4F] mb-1">
                Presets & Actions
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => loadPreset('traditional')}
                  className="py-1 text-[11px] bg-[#FFFDF5] border border-[#D4AF37]/50 rounded hover:bg-[#F3EBDD]"
                >
                  Classic
                </button>
                <button
                  onClick={() => loadPreset('grand')}
                  className="py-1 text-[11px] bg-[#FFFDF5] border border-[#D4AF37]/50 rounded hover:bg-[#F3EBDD]"
                >
                  Grand
                </button>
                <button
                  onClick={() => loadPreset('minimal')}
                  className="py-1 text-[11px] bg-[#FFFDF5] border border-[#D4AF37]/50 rounded hover:bg-[#F3EBDD]"
                >
                  Minimal
                </button>
              </div>
              <button
                onClick={generateRandomPookalam}
                className="w-full py-2 bg-gradient-to-r from-[#D4AF37] to-[#FF9800] text-[#4A0E17] font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5 mt-2 hover:opacity-95"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Layout</span>
              </button>
              <button
                onClick={clearAllDesign}
                className="w-full py-2 bg-red-100 border border-red-300 text-red-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-1 hover:bg-red-200 transition mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Workspace</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Drawer */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          />
        )}

        {/* Center Canvas */}
        <main
          className="flex-1 relative bg-[#FAF6EE] flex items-center justify-center overflow-hidden"
          ref={containerRef}
        >
          {objects.length === 0 && (
            <div className="absolute top-8 pointer-events-none bg-[#FFFDF5]/90 border border-[#D4AF37] px-4 py-2 rounded-full shadow-md z-10 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#FF9800]" />
              <span className="text-xs font-semibold text-[#880E4F]">
                Click or draw inside the circular floral base!
              </span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-crosshair touch-none select-none"
          />

          <div className="hidden sm:flex absolute bottom-4 left-4 bg-[#FFFDF5]/90 backdrop-blur border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full text-[11px] text-[#4A0E17] shadow-sm z-10 items-center space-x-3">
            <span className="flex items-center gap-1 font-medium">
              <Move className="w-3 h-3 text-blue-600" /> Center: Move
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Scaling className="w-3 h-3 text-blue-500" /> Blue: Scale
            </span>
            <span className="flex items-center gap-1 font-medium">
              <RotateIcon className="w-3 h-3 text-emerald-600" /> Green: Rotate
            </span>
          </div>

          {/* Zoom and Help Floating Toolbar */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-[#FFFDF5] p-1 rounded-full border border-[#D4AF37]/40 shadow-md z-10">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 hover:bg-[#F3EBDD] rounded-full text-[#4A0E17]"
              title="Help & Shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="p-1.5 hover:bg-[#F3EBDD] rounded-full text-[#4A0E17]"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-1.5 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 hover:bg-[#F3EBDD] rounded-full text-[#4A0E17]"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  setPan({ x: rect.width / 2, y: rect.height / 2 });
                }
              }}
              className="p-1.5 hover:bg-[#F3EBDD] rounded-full text-[#4A0E17]"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="px-4 py-1.5 bg-[#F3EBDD] border-t border-[#E0D6C3] text-[11px] font-medium text-[#6B3A42] flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Info className="w-3.5 h-3.5 text-[#880E4F] shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 text-[10px] text-[#8C6B71] shrink-0">
          <span>Items: {objects.length}</span>
          <span>Symmetry: {symmetry === 0 ? 'Off' : `${symmetry}-Way`}</span>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF5] border border-[#D4AF37] rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-[#4A0E17]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-serif text-[#4A0E17] mb-3">
              Canvas Controls & Shortcuts
            </h3>
            <ul className="space-y-2 text-xs text-[#6B3A42] mb-4">
              <li>
                <strong className="text-[#4A0E17]">
                  Ctrl + Z / Ctrl + Shift + Z:
                </strong>{' '}
                Undo & Redo
              </li>
              <li>
                <strong className="text-[#4A0E17]">Ctrl + S:</strong> Save design
                state
              </li>
              <li>
                <strong className="text-[#4A0E17]">Delete:</strong> Delete selected
                flower/shape
              </li>
              <li>
                <strong className="text-[#4A0E17]">Smart Mode:</strong>{' '}
                Auto-detects rough circles, triangles & squares while drawing
              </li>
              <li>
                <strong className="text-[#4A0E17]">Radial Symmetry:</strong>{' '}
                Automatically duplicates motif elements in circular patterns
              </li>
            </ul>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-[#880E4F] text-white text-xs font-bold rounded-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
    
  );
}

// ============================================================================
// HOMEPAGE / LANDING PAGE COMPONENT
// ============================================================================

function HomepageLanding({ onLaunchStudio }: { onLaunchStudio: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseDesign[]>(INITIAL_SHOWCASE);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewDetailDesign, setViewDetailDesign] = useState<ShowcaseDesign | null>(null);

  // Share form states
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('Traditional, Floral');
  const [newImage, setNewImage] = useState(
    'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600'
  );

  const handleLike = (id: string) => {
    setShowcaseItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      )
    );
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newArtist) return;

    const newItem: ShowcaseDesign = {
      id: `sc-${Date.now()}`,
      title: newTitle,
      artist: newArtist,
      likes: 1,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      image: newImage,
      description: newDescription || 'A beautiful community shared Pookalam carpet.',
      date: new Date().toISOString().split('T')[0],
    };

    setShowcaseItems([newItem, ...showcaseItems]);
    setIsShareModalOpen(false);
    setNewTitle('');
    setNewArtist('');
    setNewDescription('');
  };

  const allTags = ['All', ...Array.from(new Set(showcaseItems.flatMap((i) => i.tags)))];

  const filteredShowcase =
    selectedTag === 'All'
      ? showcaseItems
      : showcaseItems.filter((item) => item.tags.includes(selectedTag));

  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#4A0E17] flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#FFFDF5]/90 backdrop-blur-md border-b border-[#E0D6C3] px-6 lg:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF9800] to-[#E53935] flex items-center justify-center shadow-md border border-[#D4AF37]">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wide text-[#4A0E17] font-serif block leading-none">
              POOKALAM DESIGNER
            </span>
            <span className="text-[10px] text-[#880E4F] tracking-widest uppercase font-semibold">
              Poovum Code-um Studio
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#6B3A42]">
          <a href="#features" className="hover:text-[#880E4F] transition">
            Features
          </a>
          <a href="#about-onam" className="hover:text-[#880E4F] transition">
            About Onam
          </a>
          <a href="#showcase" className="hover:text-[#880E4F] transition">
            Showcase
          </a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={onLaunchStudio}
            className="px-5 py-2.5 bg-gradient-to-r from-[#880E4F] to-[#B71C1C] hover:from-[#A2135F] text-white text-xs font-bold rounded-full shadow-md flex items-center space-x-2 border border-[#D4AF37]/30 transition transform hover:scale-105"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#4A0E17]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFDF5] border-b border-[#E0D6C3] px-6 py-4 flex flex-col space-y-4 shadow-lg z-40">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#6B3A42]"
          >
            Features
          </a>
          <a
            href="#about-onam"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#6B3A42]"
          >
            About Onam
          </a>
          <a
            href="#showcase"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#6B3A42]"
          >
            Showcase
          </a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLaunchStudio();
            }}
            className="w-full py-3 bg-gradient-to-r from-[#880E4F] to-[#B71C1C] text-white text-xs font-bold rounded-xl shadow flex items-center justify-center space-x-2"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-16 pb-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF9800]/20 to-[#E53935]/20 border border-[#D4AF37]/50 text-[#880E4F] text-xs font-bold tracking-wide shadow-sm">
            <Sparkles className="w-4 h-4 text-[#FF9800]" />
            <span>Celebrate Onam Digitally</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold font-serif text-[#4A0E17] leading-tight">
            Craft Elegant <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E53935] via-[#FF9800] to-[#7B1FA2]">
              Floral Pookalams
            </span>{' '}
            Digitally.
          </h1>

          <p className="text-base md:text-lg text-[#6B3A42] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
            Design traditional floral carpets with vector tools, instant flood fill, smart shape perfection, and interactive radial symmetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={onLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FF9800] via-[#E53935] to-[#880E4F] text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 border border-[#D4AF37]/40 transition transform hover:-translate-y-0.5"
            >
              <span>Start Designing Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#showcase"
              className="w-full sm:w-auto px-6 py-4 bg-[#FFFDF5] border border-[#D4AF37] text-[#4A0E17] font-bold text-base rounded-2xl shadow-sm hover:bg-[#F3EBDD] flex items-center justify-center space-x-2 transition"
            >
              <Eye className="w-5 h-5 text-[#880E4F]" />
              <span>Explore Gallery</span>
            </a>
          </div>
        </div>

        {/* Hero Preview Card */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square bg-[#FFFDF5] rounded-full p-4 shadow-2xl border-4 border-[#D4AF37] flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-full border-2 border-dashed border-[#D4AF37]/60 flex items-center justify-center relative bg-[radial-gradient(#E0D6C3_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E91E63] to-[#880E4F] flex items-center justify-center shadow-2xl animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FFC107] to-[#FF9800] flex items-center justify-center shadow-inner" />
              </div>
              <button
                onClick={onLaunchStudio}
                className="absolute inset-0 bg-[#4A0E17]/70 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-full p-6 text-center"
              >
                <Sparkles className="w-10 h-10 text-[#FFC107] mb-2" />
                <span className="font-bold text-xl font-serif">Open Studio App</span>
                <span className="text-xs text-[#D4AF37] mt-1">Create your floral masterwork</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="px-6 lg:px-12 py-16 bg-[#FFFDF5] border-y border-[#E0D6C3]"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold font-serif text-[#4A0E17]">
              Studio Features
            </h2>
            <p className="text-sm text-[#6B3A42]">
              Powerful digital tools tailored specifically for creating intricate floral art.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sun,
                title: 'Radial Symmetry',
                desc: 'Duplicate motifs effortlessly in 2, 4, 6, 8, or 12-way symmetry.',
              },
              {
                icon: Flower2,
                title: 'Kerala Motifs',
                desc: 'Authentic Chethi, Lotus, Pichakam, and Dahlia preset blooms.',
              },
              {
                icon: Sparkles,
                title: 'Smart Shapes',
                desc: 'Auto-perfect rough drawn lines into precise concentric geometry.',
              },
              {
                icon: PaintBucket,
                title: 'Vector Flood Fill',
                desc: 'Fill enclosed canvas regions seamlessly with festive Onam colors.',
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-[#FAF6EE] p-6 rounded-2xl border border-[#E0D6C3] space-y-3 hover:shadow-md transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#880E4F] to-[#B71C1C] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#FFC107]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#4A0E17]">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#6B3A42] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT ONAM & POOKALAM SECTION [source: 6] */}
      <section
        id="about-onam"
        className="px-6 lg:px-12 py-20 bg-gradient-to-b from-[#FAF6EE] to-[#FFFDF5] border-b border-[#E0D6C3]"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#880E4F]/10 text-[#880E4F] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cultural Heritage</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#4A0E17]">
              About Onam & The Pookalam
            </h2>
            <p className="text-sm text-[#6B3A42]">
              Discover the legend, symbolism, and traditional floral art of Kerala's grandest harvest festival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Onam Festival Card */}
            <div className="bg-[#FFFDF5] p-8 rounded-3xl border border-[#D4AF37]/50 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9800]/15 flex items-center justify-center text-[#FF9800]">
                  <Sun className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#4A0E17]">
                  The Onam Festival
                </h3>
                <p className="text-sm text-[#6B3A42] leading-relaxed">
                  Onam is the official state festival of Kerala, celebrated with immense joy and unity across ten festive days during the Malayalam month of Chingam (August–September). It marks the annual homecoming of the mythical, benevolent King Mahabali, under whose legendary reign Kerala experienced complete prosperity, equality, and peace.
                </p>
                <p className="text-sm text-[#6B3A42] leading-relaxed">
                  Beyond myth, Onam is a grand harvest festival celebrating nature's bounty, featured by elaborate grand feasts (Onasadya), traditional snake boat races (Vallamkali), tiger dances (Pulikali), and vibrant cultural gatherings.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E0D6C3]/60 flex items-center space-x-2 text-xs font-bold text-[#880E4F]">
                <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
                <span>Celebration of Prosperity & Unity</span>
              </div>
            </div>

            {/* Pookalam Artform Card */}
            <div className="bg-[#FFFDF5] p-8 rounded-3xl border border-[#D4AF37]/50 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E53935]/15 flex items-center justify-center text-[#E53935]">
                  <Flower2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#4A0E17]">
                  The Art of Pookalam
                </h3>
                <p className="text-sm text-[#6B3A42] leading-relaxed">
                  'Pookalam' (derived from 'Poo' meaning flower and 'Kalam' meaning color sketch) is a intricate floral carpet created at courtyard entrances to welcome King Mahabali. Traditionally starting on 'Atham' day with a single small circle of flowers, the carpet grows systematically in size and complexity each day until reaching its maximum splendour on 'Thiru Onam'.
                </p>
                <p className="text-sm text-[#6B3A42] leading-relaxed">
                  Each floral ring holds traditional significance, utilizing native blooms such as Yellow Chethi, Jasmine (Pichakam), Lotus (Thamara), and Dahlia (Jamanthi) arranged in geometric radial patterns that symbolize harmony, hospitality, and natural beauty.
                </p>
              </div>
              <div className="pt-4 border-t border-[#E0D6C3]/60 flex items-center space-x-2 text-xs font-bold text-[#880E4F]">
                <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
                <span>Traditional Radial Geometry & Bloom Crafting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY SHOWCASE SECTION [source: 6] */}
      <section id="showcase" className="px-6 lg:px-12 py-20 bg-[#FFFDF5]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF9800]/15 text-[#880E4F] text-xs font-bold uppercase tracking-wider">
                <Share2 className="w-3.5 h-3.5" />
                <span>Community Gallery</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#4A0E17]">
                Pookalam Showcase
              </h2>
              <p className="text-sm text-[#6B3A42]">
                Explore floral designs created by artists, or submit your own custom carpet!
              </p>
            </div>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-6 py-3 bg-[#880E4F] hover:bg-[#A2135F] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 border border-[#D4AF37]/40 transition"
            >
              <PlusCircle className="w-4 h-4 text-[#FFC107]" />
              <span>Share Your Design</span>
            </button>
          </div>

          {/* Filter Tags */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-[#4A0E17] text-[#FFC107]'
                    : 'bg-[#FAF6EE] text-[#6B3A42] hover:bg-[#F3EBDD] border border-[#E0D6C3]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Showcase Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShowcase.map((item) => (
              <div
                key={item.id}
                className="bg-[#FAF6EE] rounded-3xl border border-[#E0D6C3] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-black/5">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-[#4A0E17]/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-[#D4AF37]/40 flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-[#FFC107]" />
                      <span>{item.tags[0]}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-xl text-[#4A0E17] group-hover:text-[#880E4F] transition">
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#880E4F] mt-0.5">
                        By {item.artist}
                      </p>
                    </div>

                    <p className="text-xs text-[#6B3A42] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-[#E0D6C3]/60 flex items-center justify-between">
                  <button
                    onClick={() => handleLike(item.id)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-[#E53935] hover:scale-110 transition transform"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{item.likes}</span>
                  </button>

                  <button
                    onClick={() => setViewDetailDesign(item)}
                    className="text-xs font-bold text-[#880E4F] hover:underline flex items-center space-x-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHARE DESIGN MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF5] border border-[#D4AF37] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-5 right-5 text-[#4A0E17] hover:bg-[#F3EBDD] p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-serif font-bold text-[#4A0E17]">
                Share Your Pookalam
              </h3>
              <p className="text-xs text-[#6B3A42] mt-1">
                Display your artwork in the community showcase gallery.
              </p>
            </div>

            <form onSubmit={handleShareSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A0E17] mb-1">
                  Design Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vibrant Onam Lotus"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E0D6C3] rounded-xl p-3 text-[#4A0E17] focus:outline-none focus:border-[#880E4F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A0E17] mb-1">
                  Artist Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Menon"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E0D6C3] rounded-xl p-3 text-[#4A0E17] focus:outline-none focus:border-[#880E4F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A0E17] mb-1">
                  Image URL / Data Link
                </label>
                <input
                  type="text"
                  placeholder="Paste image URL"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E0D6C3] rounded-xl p-3 text-[#4A0E17] focus:outline-none focus:border-[#880E4F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A0E17] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Traditional, Lotus, Modern"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E0D6C3] rounded-xl p-3 text-[#4A0E17] focus:outline-none focus:border-[#880E4F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A0E17] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your design choices and flowers used..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#E0D6C3] rounded-xl p-3 text-[#4A0E17] focus:outline-none focus:border-[#880E4F]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-5 py-2.5 bg-[#FAF6EE] text-[#6B3A42] font-bold rounded-xl hover:bg-[#F3EBDD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF9800] to-[#E53935] text-white font-bold rounded-xl shadow-md hover:opacity-95"
                >
                  Publish to Showcase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESIGN DETAIL MODAL */}
      {viewDetailDesign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF5] border border-[#D4AF37] rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setViewDetailDesign(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full relative bg-black/10">
              <img
                src={viewDetailDesign.image}
                alt={viewDetailDesign.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#4A0E17]">
                    {viewDetailDesign.title}
                  </h3>
                  <p className="text-xs font-bold text-[#880E4F]">
                    Created by {viewDetailDesign.artist}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-[#E53935] bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{viewDetailDesign.likes} Likes</span>
                </div>
              </div>

              <p className="text-xs text-[#6B3A42] leading-relaxed">
                {viewDetailDesign.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {viewDetailDesign.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-[#FAF6EE] border border-[#E0D6C3] text-[#4A0E17] rounded-full text-[10px] font-bold"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E0D6C3]/60 flex justify-end">
                <button
                  onClick={() => setViewDetailDesign(null)}
                  className="px-6 py-2.5 bg-[#880E4F] text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-[#3A0A12] px-6 py-8 text-center text-xs text-[#D4AF37]/70 border-t border-[#5C141E] mt-auto space-y-2">
        <p className="font-serif font-bold text-[#FFFDF5] text-sm">
          Happy Onam • Onashamsakal
        </p>
        <p>© {new Date().getFullYear()} Pookalam Designer • Digital Studio</p>
      </footer>
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [view, setView] = useState<'home' | 'studio'>('home');

  return view === 'home' ? (
    <HomepageLanding onLaunchStudio={() => setView('studio')} />
  ) : (
    <PookalamCanvasStudio onBackToHome={() => setView('home')} />
  );
}