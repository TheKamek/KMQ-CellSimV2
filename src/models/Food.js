export class Food {
  constructor(x, y, type = 'PLANT') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 3;
    this.energy = 30;
    this.color = '#33ff33';
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}