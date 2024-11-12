/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/CellCanvas.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useThrottledCallback } from 'use-callback-enhancer';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useThrottle } from '../hooks/useThrottle';
import { TRAITS } from '../constants/traits';

export function CellCanvas({
  cells,
  food,
  settings,
  onCellClick,
  onCellHover,
  selectedCell,
  renderQuality = 1,
  showGrid = false,
  showStats = false,
  debugMode = false,
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const animationFrameRef = useRef(null);
  const gridRef = useRef(null);
  const quadTreeRef = useRef(null);
  const statsRef = useRef({
    fps: 0,
    lastFrameTime: 0,
    frameCount: 0,
    lastFpsUpdate: 0,
  });

  class QuadTree {
    constructor(boundary, capacity = 4) {
      this.boundary = boundary;
      this.capacity = capacity;
      this.points = [];
      this.divided = false;
    }

    clear() {
      this.points = [];
      this.divided = false;
      this.northwest = null;
      this.northeast = null;
      this.southwest = null;
      this.southeast = null;
    }

    query(range) {
      let found = [];
      if (!this.intersects(range)) {
        return found;
      }

      for (let p of this.points) {
        if (this.includes(range, p)) {
          found.push(p);
        }
      }

      if (this.divided) {
        found = found.concat(this.northwest.query(range));
        found = found.concat(this.northeast.query(range));
        found = found.concat(this.southwest.query(range));
        found = found.concat(this.southeast.query(range));
      }

      return found;
    }

    includes(range, point) {
      return (
        point.x >= range.x &&
        point.x <= range.x + range.width &&
        point.y >= range.y &&
        point.y <= range.y + range.height
      );
    }

    intersects(range) {
      return !(
        range.x > this.boundary.x + this.boundary.width ||
        range.x + range.width < this.boundary.x ||
        range.y > this.boundary.y + this.boundary.height ||
        range.y + range.height < this.boundary.y
      );
    }

    insert(point) {
      if (!this.includes(this.boundary, point)) {
        return false;
      }

      if (this.points.length < this.capacity) {
        this.points.push(point);
        return true;
      }

      if (!this.divided) {
        this.subdivide();
      }

      return (
        this.northwest.insert(point) ||
        this.northeast.insert(point) ||
        this.southwest.insert(point) ||
        this.southeast.insert(point)
      );
    }

    subdivide() {
      const x = this.boundary.x;
      const y = this.boundary.y;
      const w = this.boundary.width / 2;
      const h = this.boundary.height / 2;

      const nw = { x: x, y: y, width: w, height: h };
      const ne = { x: x + w, y: y, width: w, height: h };
      const sw = { x: x, y: y + h, width: w, height: h };
      const se = { x: x + w, y: y + h, width: w, height: h };

      this.northwest = new QuadTree(nw, this.capacity);
      this.northeast = new QuadTree(ne, this.capacity);
      this.southwest = new QuadTree(sw, this.capacity);
      this.southeast = new QuadTree(se, this.capacity);

      this.divided = true;
    }
  }

  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      contextRef.current = ctx;
    }

    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Initialize canvas context
  const initializeContext = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Update quadtree boundary
    if (quadTreeRef.current) {
      quadTreeRef.current = new QuadTree({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      contextRef.current = ctx;
    }
  }, []);
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width !== dimensions.width || height !== dimensions.height) {
          initializeCanvas();
        }
      }
    });

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [dimensions.width, dimensions.height, initializeCanvas]);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        initializeContext();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeContext]);

  // Pre-render grid
  const renderGrid = useCallback(
    (width, height) => {
      if (!showGrid) return;

      const gridCanvas = document.createElement('canvas');
      const gridCtx = gridCanvas.getContext('2d');
      const gridSize = 50;

      gridCanvas.width = width;
      gridCanvas.height = height;

      gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      gridCtx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, height);
        gridCtx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(width, y);
        gridCtx.stroke();
      }

      gridRef.current = gridCanvas;
    },
    [showGrid]
  );

  // Draw background
  const drawBackground = useCallback(
    (ctx) => {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      if (showGrid && gridRef.current) {
        ctx.drawImage(gridRef.current, 0, 0);
      }
    },
    [dimensions, showGrid]
  );

  // Draw food particles
  const drawFood = useCallback(
    (ctx) => {
      food.forEach((foodItem) => {
        ctx.beginPath();
        ctx.arc(foodItem.x, foodItem.y, foodItem.radius, 0, Math.PI * 2);
        ctx.fillStyle = foodItem.color;
        ctx.fill();
      });
    },
    [food]
  );

  // Draw cells
  const drawCells = useCallback(
    (ctx) => {
      cells.forEach((cell) => {
        // Draw cell body
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
        ctx.fillStyle = TRAITS[cell.mainTrait].color;
        ctx.fill();

        // Draw receptors
        cell.receptors.forEach((receptor, i) => {
          const x =
            cell.x + Math.cos(receptor.angle + cell.dx) * receptor.distance;
          const y =
            cell.y + Math.sin(receptor.angle + cell.dy) * receptor.distance;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle =
            i < cell.traits.length
              ? TRAITS[cell.traits[i]].color
              : 'rgba(255, 255, 255, 0.5)';
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(cell.x, cell.y);
          ctx.lineTo(x, y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.stroke();
        });

        // Draw energy and strength bars
        ctx.fillStyle = `rgb(${255 - cell.energy * 2.55}, ${
          cell.energy * 2.55
        }, 0)`;
        ctx.fillRect(cell.x - 10, cell.y - cell.radius - 5, cell.energy / 5, 2);

        ctx.fillStyle = `rgb(${cell.strength * 2.55}, 0, ${
          255 - cell.strength * 2.55
        })`;
        ctx.fillRect(
          cell.x - 10,
          cell.y - cell.radius - 8,
          cell.strength / 5,
          2
        );

        // Draw merge animation if active
        if (cell.mergeAnimation) {
          const progress = (Date.now() - cell.mergeAnimation.startTime) / 1000;
          if (progress < 1) {
            ctx.beginPath();
            ctx.arc(
              cell.x,
              cell.y,
              cell.radius * (1 + progress),
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
            ctx.stroke();
          }
        }

        // Highlight selected cell
        if (cell === selectedCell) {
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, cell.radius + 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.lineWidth = 1;
        }

        // Highlight hovered cell
        if (cell === hoveredCell) {
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, cell.radius + 1, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.stroke();
        }

        // Debug visualization
        if (debugMode) {
          // Draw velocity vector
          ctx.beginPath();
          ctx.moveTo(cell.x, cell.y);
          ctx.lineTo(cell.x + cell.dx * 20, cell.y + cell.dy * 20);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.stroke();

          // Draw detection radius
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, cell.radius * 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.stroke();
        }
      });
    },
    [cells, selectedCell, hoveredCell, debugMode]
  );

  // Draw statistics
  const drawStats = useCallback(
    (ctx) => {
      if (!showStats) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - statsRef.current.lastFrameTime;
      statsRef.current.frameCount++;

      if (currentTime - statsRef.current.lastFpsUpdate >= 1000) {
        statsRef.current.fps = Math.round(
          (statsRef.current.frameCount * 1000) /
            (currentTime - statsRef.current.lastFpsUpdate)
        );
        statsRef.current.frameCount = 0;
        statsRef.current.lastFpsUpdate = currentTime;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 150, 60);
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.fillText(`FPS: ${statsRef.current.fps}`, 20, 30);
      ctx.fillText(`Cells: ${cells.length}`, 20, 45);
      ctx.fillText(`Food: ${food.length}`, 20, 60);

      statsRef.current.lastFrameTime = currentTime;
    },
    [showStats, cells.length, food.length]
  );

  // Main render loop
  const render = useCallback(() => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    drawBackground(ctx);
    drawFood(ctx);
    drawCells(ctx);
    drawStats(ctx);

    animationFrameRef.current = requestAnimationFrame(render);
  }, [drawBackground, drawFood, drawCells, drawStats]);

  // Handle mouse move
  const handleMouseMove = useThrottle((event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x, y });

    // Find hovered cell
    const found = cells.find((cell) => {
      const distance = Math.hypot(cell.x - x, cell.y - y);
      return distance < cell.radius;
    });

    if (found !== hoveredCell) {
      setHoveredCell(found);
      onCellHover?.(found);
    }
  }, 16);

  // Handle click
  const handleClick = useCallback(
    (event) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const clicked = cells.find((cell) => {
        const distance = Math.hypot(cell.x - x, cell.y - y);
        return distance < cell.radius;
      });

      onCellClick?.(clicked);
    },
    [cells, onCellClick]
  );

  // Initialize canvas
  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Start render loop
  useEffect(() => {
    render();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className="absolute top-0 left-0 w-full h-full -z-10"
      style={{ cursor: hoveredCell ? 'pointer' : 'default' }}
    />
  );
}

export default CellCanvas;
