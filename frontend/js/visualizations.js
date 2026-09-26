/**
 * QML-PD Research Platform - Focused Computational Visualizer
 * Single Clean Living Computational Transformation Pipeline
 */

export class HeroPipelineVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    this.time = 0;

    this.stages = [
      { id: 1, label: "BIOMARKERS", sub: "12 ANOVA Features", color: "#38bdf8", tag: "Input x ∈ ℝ¹²" },
      { id: 2, label: "NORMALIZATION", sub: "Dev Scaler N(0,1)", color: "#60a5fa", tag: "Zero-Leakage" },
      { id: 3, label: "ANGLE EMBEDDING", sub: "RY/RZ Rotations", color: "#a78bfa", tag: "θ, φ ∈ [0, π]" },
      { id: 4, label: "4-QUBIT CIRCUIT", sub: "Variational Ansatz", color: "#c084fc", tag: "|ψ(θ)⟩ Entangled" },
      { id: 5, label: "SEVERITY CLASS", sub: "motor_UPDRS", color: "#34d399", tag: "ŷ ∈ {0, 1}" }
    ];

    // Orderly data packets moving between stages
    this.packets = [];
    for (let i = 0; i < 6; i++) {
      this.packets.push({
        progress: (i / 6),
        speed: 0.0035 + (i % 2) * 0.0008,
        color: this.stages[i % this.stages.length].color
      });
    }

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(rect.height, 220);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  animate() {
    this.time += 0.02;
    this.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle background mesh
    ctx.strokeStyle = "rgba(56, 189, 248, 0.03)";
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const n = this.stages.length;
    const margin = 45;
    const usableW = w - margin * 2;
    const centerY = h * 0.44;

    const coords = [];
    for (let i = 0; i < n; i++) {
      coords.push({
        x: margin + (i / (n - 1)) * usableW,
        y: centerY
      });
    }

    // 1. Inter-stage connecting conduits
    for (let i = 0; i < n - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];

      // Base line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Subtle flowing quantum phase wave
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
      ctx.lineWidth = 1.5;
      const segs = 20;
      for (let s = 0; s <= segs; s++) {
        const u = s / segs;
        const cx = p1.x + (p2.x - p1.x) * u;
        const wave = Math.sin(this.time * 2.5 + u * Math.PI * 2 + i) * 6;
        if (s === 0) ctx.moveTo(cx, p1.y + wave);
        else ctx.lineTo(cx, p1.y + wave);
      }
      ctx.stroke();
    }

    // 2. Orderly data pulse packets
    this.packets.forEach(pkt => {
      pkt.progress = (pkt.progress + pkt.speed) % 1.0;
      const currX = margin + pkt.progress * usableW;
      const currY = centerY + Math.sin(this.time * 2.5 + pkt.progress * Math.PI * 4) * 5;

      ctx.save();
      ctx.beginPath();
      ctx.arc(currX, currY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = pkt.color;
      ctx.shadowColor = pkt.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });

    // 3. Stage nodes
    coords.forEach((pt, idx) => {
      const stage = this.stages[idx];
      const radius = 22;

      // Outer glow ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `${stage.color}44`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Filled node circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#0c1527";
      ctx.fill();
      ctx.strokeStyle = stage.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Internal node feature
      if (stage.id === 4) {
        // Rotating dual-axis miniature qubit ring inside node 4
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(this.time * 1.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = stage.color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      } else {
        // Node number
        ctx.fillStyle = stage.color;
        ctx.font = "600 11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`0${stage.id}`, pt.x, pt.y);
      }
      ctx.restore();

      // Top Tag Badge
      ctx.save();
      ctx.font = "500 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
      ctx.fillText(stage.tag, pt.x, pt.y - radius - 14);

      // Bottom Primary Label
      ctx.font = "700 11px 'Inter', sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(stage.label, pt.x, pt.y + radius + 18);

      // Bottom Secondary Label
      ctx.font = "400 9.5px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
      ctx.fillText(stage.sub, pt.x, pt.y + radius + 32);
      ctx.restore();
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
