/**
 * QUANTUM MACHINE LEARNING FOR PARKINSON'S DISEASE PREDICTION
 * Scientific Visualizations & 3D Interactive Engines:
 * 1. Hero Living Transformation Pipeline
 * 2. 3D Methodology & Zero-Leakage Subject Cluster (Interactive 3D Projection)
 * 3. Three Paradigms Computational Pathways
 * 4. Interactive 4-Qubit Quantum Circuit (PennyLane Architecture)
 */

/* ==========================================================================
   1. HERO LIVING TRANSFORMATION PIPELINE
   ========================================================================== */

export class HeroPipelineVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.animationId = null;
    this.hoveredStage = -1;

    // 5 Clean Scientific Stages
    this.stages = [
      { id: 'biomarkers', label: 'BIOMARKERS', sub: '12 Voice / UPDRS', color: '#38bdf8', badge: '12-D INPUT' },
      { id: 'features', label: 'FEATURE SPACE', sub: 'ANOVA Standardized', color: '#38bdf8', badge: 'ANOVA-12' },
      { id: 'learning', label: 'LEARNING SYSTEM', sub: '12→4 Projection', color: '#818cf8', badge: 'LATENT 4-D' },
      { id: 'quantum', label: 'QUANTUM STATE', sub: '|ψ(θ,x)⟩ 4-Qubit', color: '#a78bfa', badge: '2⁴ HILBERT' },
      { id: 'severity', label: 'SEVERITY CLASS', sub: 'Binary Classification', color: '#10b981', badge: 'CLASS {0,1}' }
    ];

    // Orderly data packets (clean traveling pulses, no chaos)
    this.particles = [];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        stage: i % 4,
        progress: (i / 8),
        speed: 0.0075,
        size: 3.2
      });
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.attachMouseEvents();
    this.animate();
  }

  attachMouseEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const count = this.stages.length;
      const padX = Math.max(50, this.width * 0.1);
      const stepX = (this.width - padX * 2) / (count - 1);
      const cy = this.height * 0.48;

      let found = -1;
      for (let i = 0; i < count; i++) {
        const sx = padX + i * stepX;
        const dist = Math.hypot(mx - sx, my - cy);
        if (dist < 32) {
          found = i;
          break;
        }
      }
      this.hoveredStage = found;
      this.canvas.style.cursor = found !== -1 ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredStage = -1;
      this.canvas.style.cursor = 'default';
    });
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 540;
    this.height = rect.height || 380;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  animate() {
    this.time += 0.022;
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const count = this.stages.length;
    const padX = Math.max(55, w * 0.1);
    const stepX = (w - padX * 2) / (count - 1);
    const cy = h * 0.48;

    const coords = [];
    for (let i = 0; i < count; i++) {
      coords.push({ x: padX + i * stepX, y: cy });
    }

    // 1. Subtle Background Grid Guide
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.moveTo(padX - 20, cy);
    ctx.lineTo(w - padX + 20, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Top Header Status Bar
    this.drawHeader(ctx, w, h);

    // 3. Connectors & Transmission Waves
    for (let i = 0; i < count - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];

      // Base transmission line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.6;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Stage 2 -> 3: Harmonic Quantum Amplitude Wave
      if (i === 2) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
        ctx.lineWidth = 2.0;
        const waveSteps = 40;
        for (let s = 0; s <= waveSteps; s++) {
          const prog = s / waveSteps;
          const x = p1.x + (p2.x - p1.x) * prog;
          const y = cy + Math.sin(prog * Math.PI * 4 - this.time * 3.5) * 8.5;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Stage 3 -> 4: Quantum Measurement Readout Wave
      if (i === 3) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
        ctx.lineWidth = 1.8;
        const waveSteps = 30;
        for (let s = 0; s <= waveSteps; s++) {
          const prog = s / waveSteps;
          const x = p1.x + (p2.x - p1.x) * prog;
          const y = cy + Math.sin(prog * Math.PI * 2 - this.time * 2.5) * 5.0;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // 4. Orderly Data Packet Photons
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        p.stage = (p.stage + 1) % (count - 1);
      }

      const p1 = coords[p.stage];
      const p2 = coords[p.stage + 1];
      const px = p1.x + (p2.x - p1.x) * p.progress;
      let py = p1.y;

      if (p.stage === 2) {
        py = cy + Math.sin(p.progress * Math.PI * 4 - this.time * 3.5) * 8.5;
      } else if (p.stage === 3) {
        py = cy + Math.sin(p.progress * Math.PI * 2 - this.time * 2.5) * 5.0;
      }

      const pColor = p.stage >= 2 ? '#a78bfa' : '#38bdf8';

      // Photon Glow Halo
      ctx.beginPath();
      ctx.fillStyle = pColor;
      ctx.globalAlpha = 0.35;
      ctx.arc(px, py, p.size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Photon Core
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.95;
      ctx.arc(px, py, p.size * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 5. Stage Nodes
    coords.forEach((c, i) => {
      const stage = this.stages[i];
      const isHovered = this.hoveredStage === i;
      const isActive = Math.floor(this.time * 0.8) % count === i;

      // Active / Hover Pulse Halo
      if (isActive || isHovered) {
        const pulseR = 24 + Math.sin(this.time * 3) * 3;
        ctx.beginPath();
        ctx.strokeStyle = stage.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = isHovered ? 0.65 : 0.35;
        ctx.arc(c.x, c.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Outer Ring
      ctx.beginPath();
      ctx.fillStyle = '#0a0f1d';
      ctx.strokeStyle = stage.color;
      ctx.lineWidth = 2.0;
      ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stage-Specific Clean Iconography
      if (i === 3) {
        // Quantum State Node: Clean rotating dual-axis orbit ring
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
        ctx.lineWidth = 1.4;
        ctx.ellipse(c.x, c.y, 11, 4.5, this.time * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.ellipse(c.x, c.y, 11, 4.5, -this.time * 1.5 + Math.PI / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Glowing center qubit point
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(c.x, c.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Inner Glowing Node Core
        ctx.beginPath();
        ctx.fillStyle = stage.color;
        ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Typography & Labels (Zero Collisions)
      // Main Stage Title (Above Node)
      ctx.font = '600 10px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(stage.label, c.x, c.y - 28);

      // Subtitle (Below Node)
      ctx.font = '500 8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(stage.sub, c.x, c.y + 28);

      // Compact Badge Box (Below Subtitle)
      const badgeW = 60;
      const badgeH = 17;
      const bx = c.x - badgeW / 2;
      const by = c.y + 38;

      ctx.beginPath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.roundRect(bx, by, badgeW, badgeH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 7.5px "JetBrains Mono", monospace';
      ctx.fillStyle = stage.color;
      ctx.fillText(stage.badge, c.x, by + 11.5);
    });

    // 7. Bottom Telemetry Strip
    this.drawFooter(ctx, w, h);
  }

  drawHeader(ctx, w, h) {
    ctx.font = '600 8.5px "JetBrains Mono", monospace';

    // Left: Live Status Indicator
    const pulseAlpha = 0.5 + Math.sin(this.time * 4) * 0.4;
    ctx.beginPath();
    ctx.fillStyle = `rgba(16, 185, 129, ${pulseAlpha})`;
    ctx.arc(22, 22, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('PIPELINE STATUS: ACTIVE', 32, 25);

    // Right: Framework Engine Spec
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('NISQ VQC SIMULATION · 4-QUBITS', w - 18, 25);
  }

  drawFooter(ctx, w, h) {
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';

    ctx.textAlign = 'left';
    ctx.fillText('INPUT: 12 ANOVA TELEMONITORING BIOMARKERS', 18, h - 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText('OUTPUT: UPDRS SEVERITY STRATIFICATION', w - 18, h - 18);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}

/* ==========================================================================
   2. 3D METHODOLOGY & ZERO-LEAKAGE SUBJECT CLUSTER (Vanilla 3D Projection)
   ========================================================================== */

export class Methodology3DVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.animationId = null;

    // Rotation angles in radians
    this.rotX = 0.3;
    this.rotY = 0;
    this.targetRotX = 0.3;
    this.targetRotY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Generate 42 subject 3D positions in spherical coordinates
    // 26 Development (cyan), 7 Validation (violet), 9 Locked-Test (emerald)
    this.subjects = [];
    this.initSubjects();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.attachMouseEvents();
    this.animate();
  }

  initSubjects() {
    this.subjects = [];
    const radius = 130;

    // Golden spiral distribution on sphere for 42 subjects
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < 42; i++) {
      const y = 1 - (i / 41) * 2; // y from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = 2 * Math.PI * i / phi;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      let split, color, label;
      if (i < 26) {
        split = 'Development';
        color = '#38bdf8';
        label = `S${String(i + 1).padStart(2, '0')} (Dev)`;
      } else if (i < 33) {
        split = 'Validation';
        color = '#8b5cf6';
        label = `S${String(i + 1).padStart(2, '0')} (Val)`;
      } else {
        split = 'Locked Test';
        color = '#10b981';
        label = `S${String(i + 1).padStart(2, '0')} (Test)`;
      }

      this.subjects.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        split,
        color,
        label,
        id: i + 1
      });
    }
  }

  attachMouseEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.targetRotY += dx * 0.008;
      this.targetRotX += dy * 0.008;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.targetRotY += dx * 0.008;
      this.targetRotX += dy * 0.008;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  animate() {
    this.time += 0.015;
    // Auto-rotation when not dragging
    if (!this.isDragging) {
      this.targetRotY += 0.004;
    }

    // Smooth damping
    this.rotX += (this.targetRotX - this.rotX) * 0.1;
    this.rotY += (this.targetRotY - this.rotY) * 0.1;

    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const cosY = Math.cos(this.rotY);
    const sinY = Math.sin(this.rotY);
    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);

    // Project subjects into 2D screen coordinates
    const projected = this.subjects.map(s => {
      // Rotate around Y
      let x1 = s.x * cosY - s.z * sinY;
      let z1 = s.x * sinY + s.z * cosY;

      // Rotate around X
      let y2 = s.y * cosX - z1 * sinX;
      let z2 = s.y * sinX + z1 * cosX;

      // Perspective projection
      const fov = 340;
      const scale = fov / (fov + z2);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;

      return {
        ...s,
        px,
        py,
        scale,
        depth: z2
      };
    });

    // Sort back-to-front for proper depth occlusion
    projected.sort((a, b) => b.depth - a.depth);

    // Draw subtle 3D orbital boundary rings
    this.drawOrbitalRing(ctx, cx, cy, 145, cosX, sinX, cosY, sinY, 'rgba(56, 189, 248, 0.12)');
    this.drawOrbitalRing(ctx, cx, cy, 110, cosX, sinX, cosY, sinY, 'rgba(139, 92, 246, 0.12)');

    // Draw connecting zero-leakage lines between nearby subjects of SAME split
    ctx.lineWidth = 0.8;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const a = projected[i];
        const b = projected[j];
        if (a.split === b.split) {
          const dist = Math.hypot(a.px - b.px, a.py - b.py);
          if (dist < 55) {
            ctx.beginPath();
            ctx.strokeStyle = a.color === '#38bdf8' 
              ? 'rgba(56, 189, 248, 0.15)' 
              : a.color === '#8b5cf6' 
                ? 'rgba(139, 92, 246, 0.15)' 
                : 'rgba(16, 185, 129, 0.18)';
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }
    }

    // Draw subject 3D nodes
    projected.forEach(s => {
      const radius = Math.max(2, 3.8 * s.scale);
      const alpha = Math.max(0.25, Math.min(1, 0.5 + (s.depth / 200)));

      // Outer glow
      ctx.beginPath();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.arc(s.px, s.py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Center bright core
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.min(1, alpha + 0.3);
      ctx.arc(s.px, s.py, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Node label for foreground nodes
      if (s.depth < -20 && s.scale > 1.05) {
        ctx.font = '500 7px "JetBrains Mono", monospace';
        ctx.fillStyle = s.color;
        ctx.textAlign = 'left';
        ctx.globalAlpha = 0.85;
        ctx.fillText(`S${s.id}`, s.px + radius + 4, s.py + 2.5);
      }
    });

    ctx.globalAlpha = 1.0;

    // Draw interactive 3D watermark/guide
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK & DRAG TO ROTATE 3D SUBJECT CONSTELLATION', cx, h - 16);
  }

  drawOrbitalRing(ctx, cx, cy, r, cosX, sinX, cosY, sinY, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    const points = 48;
    for (let i = 0; i <= points; i++) {
      const theta = (i / points) * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = 0;

      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      const fov = 340;
      const scale = fov / (fov + z2);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}

/* ==========================================================================
   3. THREE PARADIGMS COMPUTATIONAL PATHWAYS
   ========================================================================== */

export class ParadigmPathwaysVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.currentParadigm = 'centralized';
    this.time = 0;
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  setParadigm(paradigm) {
    this.currentParadigm = paradigm;
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  animate() {
    this.time += 0.025;
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.currentParadigm === 'centralized') {
      this.drawCentralized(ctx, w, h);
    } else if (this.currentParadigm === 'federated') {
      this.drawFederated(ctx, w, h);
    } else if (this.currentParadigm === 'quantum') {
      this.drawQuantum(ctx, w, h);
    }
  }

  drawCentralized(ctx, w, h) {
    const cy = h / 2;
    const subjects = [
      { y: cy - 70, label: 'Subject S01' },
      { y: cy - 25, label: 'Subject S02' },
      { y: cy + 25, label: 'Subject S03' },
      { y: cy + 70, label: 'Subject S26' }
    ];

    const centralX = w * 0.42;
    const modelX = w * 0.68;
    const predX = w * 0.88;

    // Connect subjects to central dataset
    subjects.forEach((s, idx) => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.moveTo(90, s.y);
      ctx.bezierCurveTo(centralX - 80, s.y, centralX - 80, cy, centralX, cy);
      ctx.stroke();

      // Moving particle
      const pProg = (this.time * 0.8 + idx * 0.25) % 1;
      const px = 90 + (centralX - 90) * pProg;
      const py = s.y + (cy - s.y) * pProg;
      ctx.beginPath();
      ctx.fillStyle = '#38bdf8';
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Subject Box
      ctx.fillStyle = '#0e1526';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(20, s.y - 14, 70, 28);
      ctx.fillRect(20, s.y - 14, 70, 28);
      ctx.font = '500 8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, 55, s.y + 3);
    });

    // Central dataset to model to prediction
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(centralX, cy);
    ctx.lineTo(modelX, cy);
    ctx.lineTo(predX, cy);
    ctx.stroke();

    this.drawBoxNode(ctx, centralX, cy, 95, 46, 'CENTRAL POOL', '3,602 Development Rows', '#38bdf8');
    this.drawBoxNode(ctx, modelX, cy, 100, 46, 'CENTRALIZED ML', 'Logistic / Extra Trees', '#38bdf8');
    this.drawBoxNode(ctx, predX, cy, 80, 46, 'PREDICTION', 'Severity Class', '#10b981');
  }

  drawFederated(ctx, w, h) {
    const cy = h / 2;
    const clients = [
      { y: cy - 90, label: 'Client S01 (Local RF)', rows: '148 rows' },
      { y: cy - 30, label: 'Client S02 (Local RF)', rows: '136 rows' },
      { y: cy + 30, label: 'Client S03 (Local RF)', rows: '142 rows' },
      { y: cy + 90, label: 'Client S26 (Local RF)', rows: '139 rows' }
    ];

    const serverX = w * 0.60;
    const predX = w * 0.88;

    clients.forEach((c, idx) => {
      ctx.fillStyle = '#0e1526';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.strokeRect(30, c.y - 18, 140, 36);
      ctx.fillRect(30, c.y - 18, 140, 36);

      ctx.font = '600 8.5px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(c.label, 40, c.y - 3);

      ctx.font = '400 7.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(c.rows + ' · Local weights only', 40, c.y + 10);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.moveTo(170, c.y);
      ctx.bezierCurveTo(serverX - 70, c.y, serverX - 70, cy, serverX, cy);
      ctx.stroke();

      const pProg = (this.time * 0.7 + idx * 0.25) % 1;
      const px = 170 + (serverX - 170) * pProg;
      const py = c.y + (cy - c.y) * pProg;
      ctx.beginPath();
      ctx.fillStyle = '#38bdf8';
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(serverX, cy);
    ctx.lineTo(predX, cy);
    ctx.stroke();

    this.drawBoxNode(ctx, serverX, cy, 140, 52, 'FEDERATED SERVER', 'Sample-Weighted Ensemble', '#38bdf8');
    this.drawBoxNode(ctx, predX, cy, 80, 46, 'PREDICTION', 'Consensus Class', '#10b981');
  }

  drawQuantum(ctx, w, h) {
    const cy = h / 2;
    const stages = [
      { x: w * 0.12, title: '12-DIM INPUT', sub: 'ANOVA Features', color: '#94a3b8' },
      { x: w * 0.30, title: '12→4 PROJECTION', sub: 'Classical Linear', color: '#38bdf8' },
      { x: w * 0.50, title: 'RYRZ ENCODING', sub: '4-Qubit Superposition', color: '#8b5cf6' },
      { x: w * 0.70, title: 'VARIATIONAL ANSATZ', sub: 'CNOT Entanglement', color: '#8b5cf6' },
      { x: w * 0.88, title: 'MEASUREMENT', sub: '⟨Z_i⟩ → Severity', color: '#10b981' }
    ];

    for (let i = 0; i < stages.length - 1; i++) {
      const p1 = stages[i];
      const p2 = stages[i + 1];

      ctx.beginPath();
      ctx.strokeStyle = i >= 1 ? 'rgba(139, 92, 246, 0.35)' : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(p1.x, cy);
      ctx.lineTo(p2.x, cy);
      ctx.stroke();

      if (i >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 1.2;
        for (let x = p1.x; x <= p2.x; x += 3) {
          const prog = (x - p1.x) / (p2.x - p1.x);
          const y = cy + Math.sin(prog * Math.PI * 4 - this.time * 4) * 8;
          if (x === p1.x) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    stages.forEach(s => {
      this.drawBoxNode(ctx, s.x, cy, 115, 48, s.title, s.sub, s.color);
    });
  }

  drawBoxNode(ctx, x, y, width, height, title, sub, color) {
    const hx = x - width / 2;
    const hy = y - height / 2;

    ctx.fillStyle = '#0e1526';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(hx, hy, width, height);
    ctx.fillRect(hx, hy, width, height);

    ctx.font = '600 8.5px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(title, x, y - 4);

    ctx.font = '400 7.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(sub, x, y + 11);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}
