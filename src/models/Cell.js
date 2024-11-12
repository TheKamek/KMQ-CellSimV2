// src/models/Cell.js

import { TRAITS } from '../constants/traits';

export class Cell {
  constructor(x, y, traits = ['HERBIVORE']) {
    this.x = x;
    this.y = y;
    this.traits = traits;
    this.mainTrait = traits[0];
    this.radius = TRAITS[this.mainTrait].baseSize;
    this.speed = TRAITS[this.mainTrait].baseSpeed;
    this.energy = 100;
    this.strength = this.calculateStrength();
    this.dx = (Math.random() - 0.5) * 2;
    this.dy = (Math.random() - 0.5) * 2;
    this.receptors = this.generateReceptors();
    this.mergeAnimation = null;

    if (traits.includes('FAST')) {
      this.speed *= TRAITS.FAST.speedBonus;
    }

    this.energyLoss = TRAITS[this.mainTrait].energyLoss;
    if (traits.includes('EFFICIENT')) {
      this.energyLoss *= 0.5;
    }
  }

  calculateStrength() {
    let baseStrength = TRAITS[this.mainTrait].strength;
    this.traits.forEach((trait) => {
      if (trait !== this.mainTrait) {
        baseStrength += TRAITS[trait].strength / 2;
      }
    });
    if (this.traits.includes('STRONG')) {
      baseStrength *= TRAITS.STRONG.strengthBonus;
    }
    return baseStrength;
  }

  generateReceptors() {
    const count = this.traits.length + 2;
    const receptors = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      receptors.push({
        angle,
        distance: this.radius * 1.2,
      });
    }
    return receptors;
  }
  mutate(settings) {
    const mainTraits = Object.keys(TRAITS).filter(
      (t) => !['FAST', 'EFFICIENT', 'STRONG'].includes(t)
    );
    
    // Chance to change main trait
    if (Math.random() < settings.mutationRate) {
      const newMainTrait = mainTraits[Math.floor(Math.random() * mainTraits.length)];
      this.traits = [newMainTrait, ...this.traits.slice(1)];
      this.mainTrait = newMainTrait;
    }

    // Chance to add/remove secondary traits
    const secondaryTraits = ['FAST', 'EFFICIENT', 'STRONG'];
    secondaryTraits.forEach(trait => {
      if (Math.random() < settings.mutationRate) {
        if (this.traits.includes(trait)) {
          this.traits = this.traits.filter(t => t !== trait);
        } else {
          this.traits.push(trait);
        }
      }
    });

    // Recalculate properties
    this.radius = TRAITS[this.mainTrait].baseSize;
    this.speed = TRAITS[this.mainTrait].baseSpeed;
    this.strength = this.calculateStrength();
    this.energyLoss = TRAITS[this.mainTrait].energyLoss;
    
    if (this.traits.includes('FAST')) {
      this.speed *= TRAITS.FAST.speedBonus;
    }
    if (this.traits.includes('EFFICIENT')) {
      this.energyLoss *= 0.5;
    }

    this.receptors = this.generateReceptors();
  }

  draw(ctx) {
    // Draw cell body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = TRAITS[this.mainTrait].color;
    ctx.fill();

    // Draw receptors
    this.receptors.forEach((receptor, i) => {
      const x = this.x + Math.cos(receptor.angle + this.dx) * receptor.distance;
      const y = this.y + Math.sin(receptor.angle + this.dy) * receptor.distance;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle =
        i < this.traits.length
          ? TRAITS[this.traits[i]].color
          : 'rgba(255, 255, 255, 0.5)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();
    });

    // Draw energy bar
    ctx.fillStyle = `rgb(${255 - this.energy * 2.55}, ${
      this.energy * 2.55
    }, 0)`;
    ctx.fillRect(this.x - 10, this.y - this.radius - 5, this.energy / 5, 2);

    // Draw strength bar
    ctx.fillStyle = `rgb(${this.strength * 2.55}, 0, ${
      255 - this.strength * 2.55
    })`;
    ctx.fillRect(this.x - 10, this.y - this.radius - 8, this.strength / 5, 2);

    // Draw merge animation if active
    if (this.mergeAnimation) {
      const progress = (Date.now() - this.mergeAnimation.startTime) / 1000;
      if (progress < 1) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1 + progress), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
        ctx.stroke();
      } else {
        this.mergeAnimation = null;
      }
    }
  }

  update(canvasWidth, canvasHeight, allCells, allFood) {
    // Find and move towards target
    let target = this.findClosestTarget(allCells, allFood);
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      this.dx = (dx / distance) * this.speed;
      this.dy = (dy / distance) * this.speed;
    }

    // Update position
    this.x += this.dx;
    this.y += this.dy;

    // Handle canvas boundaries
    if (this.x + this.radius > canvasWidth || this.x - this.radius < 0) {
      this.dx = -this.dx;
      this.x = Math.max(
        this.radius,
        Math.min(canvasWidth - this.radius, this.x)
      );
    }
    if (this.y + this.radius > canvasHeight || this.y - this.radius < 0) {
      this.dy = -this.dy;
      this.y = Math.max(
        this.radius,
        Math.min(canvasHeight - this.radius, this.y)
      );
    }

    // Update energy
    this.energy -= this.energyLoss;

    // Handle reproduction
    if (this.energy > 80) {
      return this.reproduce();
    }

    return null;
  }

  findClosestTarget(cells, food) {
    let closest = null;
    let closestDist = Infinity;

    // Check for food if herbivore or omnivore
    if (TRAITS[this.mainTrait].eats.includes('PLANT')) {
      for (let f of food) {
        const dist = Math.hypot(f.x - this.x, f.y - this.y);
        if (dist < closestDist) {
          closest = f;
          closestDist = dist;
        }
      }
    }

    // Check for prey if carnivore or omnivore
    if (TRAITS[this.mainTrait].hunts.length > 0) {
      for (let cell of cells) {
        if (
          cell !== this &&
          TRAITS[this.mainTrait].hunts.includes(cell.mainTrait) &&
          this.strength > cell.strength
        ) {
          const dist = Math.hypot(cell.x - this.x, cell.y - this.y);
          if (dist < closestDist) {
            closest = cell;
            closestDist = dist;
          }
        }
      }
    }

    return closest;
  }

  checkCollision(other) {
    const distance = Math.hypot(other.x - this.x, other.y - this.y);

    // Handle food collision
    if (
      other.type === 'PLANT' &&
      TRAITS[this.mainTrait].eats.includes('PLANT')
    ) {
      if (distance < this.radius + other.radius) {
        this.energy = Math.min(100, this.energy + other.energy);
        return true;
      }
    }

    // Handle cell collision
    if (other instanceof Cell) {
      // Handle hunting
      if (
        TRAITS[this.mainTrait].hunts.includes(other.mainTrait) &&
        this.strength > other.strength
      ) {
        if (distance < this.radius + other.radius) {
          this.energy = Math.min(100, this.energy + 50);
          return true;
        }
      }

      // Handle merging
      if (
        this.traits.length === 1 &&
        other.traits.length === 1 &&
        TRAITS[this.mainTrait].compatibleWith.includes(other.mainTrait)
      ) {
        if (distance < this.radius + other.radius) {
          return this.merge(other);
        }
      }
    }

    return false;
  }

  merge(other) {
    this.traits = [...new Set([...this.traits, ...other.traits])];
    this.energy = Math.min(100, this.energy + other.energy / 2);
    this.strength = this.calculateStrength();
    this.speed *= 1.5; // Merge speed bonus
    this.receptors = this.generateReceptors();
    this.mergeAnimation = {
      startTime: Date.now(),
      otherCell: other,
    };
    return true;
  }

  reproduce() {
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    const newCell = new Cell(this.x + offsetX, this.y + offsetY, [
      ...this.traits,
    ]);
    this.energy *= 0.5;
    return newCell;
  }
}
