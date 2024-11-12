import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Cell } from '../models/Cell';
import { Food } from '../models/Food';
import { TRAITS } from '../constants/traits';

const INITIAL_CELLS = 10;
const INITIAL_FOOD = 20;
const MAX_FOOD = 1000;
const FADE_ALPHA = 0.1;
const SIMULATION_TICK_RATE = 1000 / 60; // 60 FPS target

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

export function useSimulation(settings) {
  // Core state
  const [cells, setCells] = useState([]);
  const [food, setFood] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    cells: 0,
    food: 0,
    fps: 0,
    averageEnergy: 0,
    dominantTrait: null,
    generation: 0,
    totalBirths: 0,
    totalDeaths: 0,
  });

  // Initialize quadtree with window dimensions
  useEffect(() => {
    const boundary = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
    quadTreeRef.current = new QuadTree(boundary);
  }, []);

  // Refs for canvas and animation
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const fpsCounterRef = useRef({ frames: 0, lastCheck: Date.now() });

  // Performance optimization refs
  const quadTreeRef = useRef(null);
  const cellsMapRef = useRef(new Map());
  const foodMapRef = useRef(new Map());
  // Memoized settings
  const simulationSettings = useMemo(
    () => ({
      strengthThreshold: settings.strengthThreshold ?? 60,
      mergeSpeedBonus: settings.mergeSpeedBonus ?? 150,
      foodSpawnRate: settings.foodSpawnRate ?? 5,
      foodSpawningEnabled: settings.foodSpawningEnabled ?? true,
      mutationRate: settings.mutationRate ?? 0.1,
      environmentalFactors: settings.environmentalFactors ?? {
        temperature: 1,
        resources: 1,
        predatorPressure: 1,
      },
    }),
    [settings]
  );

  // Initialize canvas context
  const initializeContext = useCallback(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      contextRef.current = ctx;
    }
  }, []);

  // Add a new cell with optional position
  const addCell = useCallback((traits = null, position = null) => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    const x = position?.x ?? Math.random() * width;
    const y = position?.y ?? Math.random() * height;

    if (!traits) {
      const mainTraits = Object.keys(TRAITS).filter(
        (t) => !['FAST', 'EFFICIENT', 'STRONG'].includes(t)
      );
      traits = [mainTraits[Math.floor(Math.random() * mainTraits.length)]];
    }

    const newCell = new Cell(x, y, traits);
    setCells((prev) => [...prev, newCell]);
    cellsMapRef.current.set(newCell.id, newCell);

    setStats((prev) => ({
      ...prev,
      totalBirths: prev.totalBirths + 1,
    }));

    return newCell;
  }, []);

  // Spawn new food particle
  const spawnFood = useCallback(() => {
    if (
      !canvasRef.current ||
      !simulationSettings.foodSpawningEnabled ||
      food.length >= MAX_FOOD
    )
      return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    const newFood = new Food(Math.random() * width, Math.random() * height);

    setFood((prev) => [...prev, newFood]);
    foodMapRef.current.set(newFood.id, newFood);
  }, [simulationSettings.foodSpawningEnabled, food.length]);

  // Handle cell selection
  const handleCellClick = useCallback((event) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Use quadtree for efficient collision detection
    const nearbyEntities =
      quadTreeRef.current?.query({
        x: x - 20,
        y: y - 20,
        width: 40,
        height: 40,
      }) ?? [];

    const clickedCell = nearbyEntities
      .filter((entity) => entity instanceof Cell)
      .find((cell) => {
        const distance = Math.hypot(cell.x - x, cell.y - y);
        return distance < cell.radius;
      });

    setSelectedCell(clickedCell ?? null);
  }, []);

  // Update simulation statistics
  const updateStats = useCallback(() => {
    const currentTime = Date.now();
    const fps = Math.round(
      (fpsCounterRef.current.frames * 1000) /
        (currentTime - fpsCounterRef.current.lastCheck)
    );

    if (currentTime - fpsCounterRef.current.lastCheck >= 1000) {
      fpsCounterRef.current = {
        frames: 0,
        lastCheck: currentTime,
      };
    }

    const traitCount = new Map();
    let totalEnergy = 0;

    cells.forEach((cell) => {
      totalEnergy += cell.energy;
      const trait = cell.mainTrait;
      traitCount.set(trait, (traitCount.get(trait) ?? 0) + 1);
    });

    const dominantTrait = Array.from(traitCount.entries()).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['none', 0]
    )[0];

    setStats((prev) => ({
      ...prev,
      cells: cells.length,
      food: food.length,
      fps,
      averageEnergy: cells.length ? totalEnergy / cells.length : 0,
      dominantTrait,
    }));
  }, [cells, food]);

  const clearAll = useCallback(() => {
    setCells([]);
    setFood([]);
    setSelectedCell(null);
    cellsMapRef.current.clear();
    foodMapRef.current.clear();
    setStats((prev) => ({
      ...prev,
      cells: 0,
      food: 0,
      generation: 0,
    }));
  }, []);

  // Main simulation update loop
  const updateSimulation = useCallback(() => {
    if (!contextRef.current || !canvasRef.current || isPaused) return;

    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000;
    lastUpdateTimeRef.current = currentTime;
    fpsCounterRef.current.frames++;

    const ctx = contextRef.current;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Apply fade effect
    ctx.fillStyle = `rgba(26, 26, 26, ${FADE_ALPHA})`;
    ctx.fillRect(0, 0, width, height);

    // Update quadtree
    quadTreeRef.current.clear();
    cells.forEach((cell) => quadTreeRef.current.insert(cell));
    food.forEach((f) => quadTreeRef.current.insert(f));

    // Spawn food based on rate and environmental factors
    if (
      Math.random() <
      (simulationSettings.foodSpawnRate *
        simulationSettings.environmentalFactors.resources) /
        1000
    ) {
      spawnFood();
    }

    // Update and draw food
    food.forEach((f) => f.draw(ctx));

    // Process cell updates and interactions
    const updates = {
      newCells: [],
      deadCells: new Set(),
      eatenFood: new Set(),
    };

    cells.forEach((cell) => {
      // Get nearby entities for collision checking
      const nearby = quadTreeRef.current.query({
        x: cell.x - cell.radius * 2,
        y: cell.y - cell.radius * 2,
        width: cell.radius * 4,
        height: cell.radius * 4,
      });

      // Process interactions
      nearby.forEach((entity) => {
        if (entity === cell) return;

        if (entity instanceof Food && !updates.eatenFood.has(entity.id)) {
          if (cell.checkCollision(entity)) {
            updates.eatenFood.add(entity.id);
          }
        } else if (
          entity instanceof Cell &&
          !updates.deadCells.has(entity.id)
        ) {
          if (cell.checkCollision(entity)) {
            updates.deadCells.add(entity.id);
          }
        }
      });

      // Update cell state
      const offspring = cell.update(
        width,
        height,
        nearby.filter((e) => e instanceof Cell),
        nearby.filter((e) => e instanceof Food),
        deltaTime,
        simulationSettings
      );

      if (offspring) {
        // Apply mutations based on rate
        if (Math.random() < simulationSettings.mutationRate) {
          offspring.mutate(simulationSettings);
        }
        updates.newCells.push(offspring);
      }

      // Check cell survival
      if (cell.energy <= 0) {
        updates.deadCells.add(cell.id);
        if (cell === selectedCell) {
          setSelectedCell(null);
        }
      } else {
        cell.draw(ctx);
      }
    });

    // Apply updates
    setFood((prev) => prev.filter((f) => !updates.eatenFood.has(f.id)));
    setCells((prev) => [
      ...prev.filter((cell) => !updates.deadCells.has(cell.id)),
      ...updates.newCells,
    ]);

    // Update maps
    updates.deadCells.forEach((id) => cellsMapRef.current.delete(id));
    updates.eatenFood.forEach((id) => foodMapRef.current.delete(id));
    updates.newCells.forEach((cell) => cellsMapRef.current.set(cell.id, cell));

    // Update statistics
    if (updates.deadCells.size > 0) {
      setStats((prev) => ({
        ...prev,
        totalDeaths: prev.totalDeaths + updates.deadCells.size,
      }));
    }

    updateStats();
  }, [
    cells,
    food,
    isPaused,
    simulationSettings,
    selectedCell,
    spawnFood,
    updateStats,
  ]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || isPaused) return;

    let lastFrame = Date.now();
    const animate = () => {
      const now = Date.now();
      if (now - lastFrame >= SIMULATION_TICK_RATE) {
        updateSimulation();
        lastFrame = now;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isPaused, updateSimulation]);

  // Initialize simulation
  useEffect(() => {
    initializeContext();

    // Add initial cells
    for (let i = 0; i < INITIAL_CELLS; i++) {
      addCell();
    }

    // Add initial food
    for (let i = 0; i < INITIAL_FOOD; i++) {
      spawnFood();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cellsMapRef.current.clear();
      foodMapRef.current.clear();
    };
  }, [addCell, spawnFood, initializeContext]);

  // Expose simulation controls and state
  return {
    canvasRef,
    stats,
    selectedCell,
    isRunning,
    isPaused,
    controls: {
      addCell,
      spawnFood,
      handleCellClick,
      togglePause: () => setIsPaused((prev) => !prev),
      toggleSimulation: () => setIsRunning((prev) => !prev),
      clearAll,
      reset: () => {
        clearAll();
        for (let i = 0; i < INITIAL_CELLS; i++) {
          addCell();
        }
        for (let i = 0; i < INITIAL_FOOD; i++) {
          spawnFood();
        }
      },
    },
  };
}
