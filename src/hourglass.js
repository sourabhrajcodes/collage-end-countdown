class Hourglass {
  constructor() {
    this.canvas = document.getElementById('hourglass-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.progress = 0;
    this.particles = [];
    this.grains = [];
    this.time = 0;
    this.running = true;

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: 0, y: 0, vy: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.6,
        active: false,
        delay: Math.random() * 60,
      });
    }

    for (let i = 0; i < 40; i++) {
      this.grains.push({
        x: 0, y: 0, size: 2 + Math.random() * 3,
        settled: false, targetY: 0,
      });
    }

    this.animate();
  }

  update(progress) {
    this.progress = Math.max(0, Math.min(1, progress));
  }

  animate() {
    if (!this.running) return;
    this.time++;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const topY = 30;
    const botY = H - 30;
    const midY = cy;
    const glassW = 120;
    const neckW = 12;
    const rimH = 12;

    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;

    this.drawGlassFrame(ctx, cx, topY, botY, midY, glassW, neckW, rimH);
    ctx.restore();

    this.drawSandInTop(ctx, cx, topY, midY, glassW, neckW);
    this.drawSandStream(ctx, cx, midY);
    this.drawSandInBottom(ctx, cx, botY, midY, glassW, neckW);
    this.drawGlassHighlights(ctx, cx, topY, botY, midY, glassW, neckW, rimH);

    this.updateParticles(cx, midY);
    this.drawParticles(ctx);
  }

  drawGlassFrame(ctx, cx, topY, botY, midY, glassW, neckW, rimH) {
    const halfW = glassW / 2;
    const halfNeck = neckW / 2;

    ctx.beginPath();
    ctx.moveTo(cx - halfW - 8, topY);
    ctx.lineTo(cx + halfW + 8, topY);
    ctx.lineTo(cx + halfW + 8, topY + rimH);
    ctx.lineTo(cx + halfW, topY + rimH);
    ctx.lineTo(cx + halfNeck, midY - 8);
    ctx.lineTo(cx + halfNeck, midY + 8);
    ctx.lineTo(cx + halfW, botY - rimH);
    ctx.lineTo(cx + halfW + 8, botY - rimH);
    ctx.lineTo(cx + halfW + 8, botY);
    ctx.lineTo(cx - halfW - 8, botY);
    ctx.lineTo(cx - halfW - 8, botY - rimH);
    ctx.lineTo(cx - halfW, botY - rimH);
    ctx.lineTo(cx - halfNeck, midY + 8);
    ctx.lineTo(cx - halfNeck, midY - 8);
    ctx.lineTo(cx - halfW, topY + rimH);
    ctx.lineTo(cx - halfW - 8, topY + rimH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - halfW, topY, cx + halfW, topY);
    grad.addColorStop(0, '#3a3a5a');
    grad.addColorStop(0.3, '#5a5a8a');
    grad.addColorStop(0.5, '#7a7aaa');
    grad.addColorStop(0.7, '#5a5a8a');
    grad.addColorStop(1, '#3a3a5a');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#8888bb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.drawRim(ctx, cx, topY, glassW, rimH, true);
    this.drawRim(ctx, cx, botY - rimH, glassW, rimH, false);
  }

  drawRim(ctx, cx, y, glassW, rimH, isTop) {
    const halfW = glassW / 2 + 8;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, y);
    ctx.lineTo(cx + halfW, y);
    ctx.lineTo(cx + halfW, y + rimH);
    ctx.lineTo(cx - halfW, y + rimH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - halfW, y, cx - halfW, y + rimH);
    if (isTop) {
      grad.addColorStop(0, '#8a7040');
      grad.addColorStop(0.5, '#c0a050');
      grad.addColorStop(1, '#8a7040');
    } else {
      grad.addColorStop(0, '#8a7040');
      grad.addColorStop(0.5, '#c0a050');
      grad.addColorStop(1, '#8a7040');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#d4b060';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  drawSandInTop(ctx, cx, topY, midY, glassW, neckW) {
    const sandLevel = 1 - this.progress;
    const glassTop = topY + 14;
    const glassMid = midY - 12;
    const totalH = glassMid - glassTop;

    const sandH = totalH * sandLevel;
    const sandTop = glassTop + (totalH - sandH);

    if (sandH <= 0) return;

    const topW = glassW / 2;
    const botW = neckW / 2;

    for (let y = sandTop; y < glassMid; y += 1) {
      const t = (y - glassTop) / totalH;
      const w = topW + (botW - topW) * t;

      const sandGrad = ctx.createLinearGradient(cx - w, y, cx + w, y);
      sandGrad.addColorStop(0, '#b08020');
      sandGrad.addColorStop(0.3, '#d4a030');
      sandGrad.addColorStop(0.5, '#f0c040');
      sandGrad.addColorStop(0.7, '#d4a030');
      sandGrad.addColorStop(1, '#b08020');

      ctx.beginPath();
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx + w, y);
      ctx.lineTo(cx + w, y + 1);
      ctx.lineTo(cx - w, y + 1);
      ctx.closePath();
      ctx.fillStyle = sandGrad;
      ctx.fill();
    }

    const surfW = topW + (botW - topW) * ((sandTop - glassTop) / totalH);
    ctx.beginPath();
    ctx.ellipse(cx, sandTop, surfW, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f0c040';
    ctx.fill();
  }

  drawSandStream(ctx, cx, midY) {
    if (this.progress >= 1) return;

    const streamTop = midY - 10;
    const streamBot = midY + 10;
    const w = 2;

    ctx.beginPath();
    ctx.moveTo(cx - w, streamTop);
    ctx.lineTo(cx + w, streamTop);
    ctx.lineTo(cx + 1, streamBot);
    ctx.lineTo(cx - 1, streamBot);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx, streamTop, cx, streamBot);
    grad.addColorStop(0, 'rgba(240, 192, 64, 0.8)');
    grad.addColorStop(1, 'rgba(240, 192, 64, 0.3)');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  drawSandInBottom(ctx, cx, botY, midY, glassW, neckW) {
    if (this.progress <= 0) return;

    const glassBot = botY - 14;
    const glassMid = midY + 12;
    const totalH = glassBot - glassMid;

    const sandH = totalH * this.progress;
    const sandTop = glassBot - sandH;

    if (sandH <= 0) return;

    const topW = neckW / 2;
    const botW = glassW / 2;

    for (let y = sandTop; y < glassBot; y += 1) {
      const t = (y - glassMid) / totalH;
      const w = topW + (botW - topW) * t;

      const sandGrad = ctx.createLinearGradient(cx - w, y, cx + w, y);
      sandGrad.addColorStop(0, '#a07020');
      sandGrad.addColorStop(0.3, '#c09030');
      sandGrad.addColorStop(0.5, '#e0b040');
      sandGrad.addColorStop(0.7, '#c09030');
      sandGrad.addColorStop(1, '#a07020');

      ctx.beginPath();
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx + w, y);
      ctx.lineTo(cx + w, y + 1);
      ctx.lineTo(cx - w, y + 1);
      ctx.closePath();
      ctx.fillStyle = sandGrad;
      ctx.fill();
    }

    const surfW = topW + (botW - topW) * Math.min(1, (sandTop - glassMid) / totalH);
    ctx.beginPath();
    ctx.ellipse(cx, sandTop, Math.max(1, surfW), 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a030';
    ctx.fill();
  }

  drawGlassHighlights(ctx, cx, topY, botY, midY, glassW, neckW, rimH) {
    const halfW = glassW / 2;

    ctx.beginPath();
    ctx.moveTo(cx - halfW + 10, topY + 20);
    ctx.quadraticCurveTo(cx - halfW + 6, midY, cx - neckW / 2 + 2, midY - 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + halfW - 14, topY + 20);
    ctx.quadraticCurveTo(cx + halfW - 10, midY - 20, cx + neckW / 2 - 2, midY - 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  updateParticles(cx, midY) {
    if (this.progress >= 1) return;

    this.particles.forEach(p => {
      if (!p.active) {
        if (this.time > p.delay) {
          p.active = true;
          p.x = cx + (Math.random() - 0.5) * 6;
          p.y = midY - 8;
          p.vy = 0.5 + Math.random() * 1.5;
          p.delay = this.time + 30 + Math.random() * 60;
        }
        return;
      }

      p.y += p.vy;
      p.vy += 0.02;
      p.opacity -= 0.008;

      if (p.opacity <= 0 || p.y > midY + 20) {
        p.active = false;
        p.opacity = 0.4 + Math.random() * 0.6;
      }
    });
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      if (!p.active || p.opacity <= 0) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 192, 64, ${p.opacity})`;
      ctx.fill();
    });
  }

  flip() {
    this.progress = 0;
  }

  pulse() {
    this.canvas.style.transition = 'transform 0.3s ease';
    this.canvas.style.transform = 'scale(1.05)';
    setTimeout(() => {
      this.canvas.style.transform = 'scale(1)';
    }, 300);
  }

  destroy() {
    this.running = false;
  }
}
