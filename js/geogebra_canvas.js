/**
 * Motor de Plano Cartesiano Interactivo Estilo "GeoGebra" para Ondas
 * Cuaderno Digital de Física III - Movimiento Ondulatorio
 * Universidad Tecnológica de Pereira (UTP)
 * Autores: David Alejandro Ramirez Bolaños, Steven Vélez Garces, Sergio Andrés Velásquez Arana
 */

class GeoGebraWavePlane {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Configuración de escalas y vista
    this.originX = 80;
    this.originY = 0;
    this.pixelsPerUnitX = options.pixelsPerUnitX || 70; // Píxeles por metro en X
    this.pixelsPerUnitY = options.pixelsPerUnitY || 70; // Píxeles por metro en Y

    // Parámetros físicos de la onda
    this.A = options.A !== undefined ? options.A : 1.8;          // Amplitud [m]
    this.lambda = options.lambda !== undefined ? options.lambda : 3.0; // Longitud de onda [m]
    this.f = options.f !== undefined ? options.f : 1.0;          // Frecuencia [Hz]
    this.phi = options.phi !== undefined ? options.phi : 0.0;    // Fase inicial [rad]
    this.direction = 1; // 1 = hacia la derecha (-ωt), -1 = izquierda (+ωt)

    // Curvas activas
    this.showY1 = true;   // Onda progresiva y1(x,t)
    this.showY2 = false;  // Onda regresiva y2(x,t)
    this.showYtot = true; // Superposición y_tot(x,t)

    // Estilos de curvas
    this.styles = {
      colorY1: '#0284c7',   // Azul cian
      colorY2: '#10b981',   // Verde esmeralda
      colorYtot: '#f59e0b', // Ámbar / Oro
      lineWidth: 2.5,
      lineDash: [],
      gridMinor: true,
      gridMajor: true
    };

    // Estado interactivo y animación
    this.activeTool = 'pan'; // 'pan', 'select', 'scale-x', 'scale-y'
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hoverCoord = null;
    this.time = 0;
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.lastFrameTime = performance.now();

    // Recuadro de Selección de Partícula y Vectores (x, y, t)
    this.inspectX = 2.5;     // Posición de análisis x [m]
    this.inspectY = 0.0;     // Posición de análisis y [m]
    this.lockYToWave = true; // Si está fijada a la onda y(x,t) o libre (x,y)
    this.isDraggingParticle = false;
    this.showVectorVy = true; // Mostrar vector velocidad transversal
    this.showVectorAy = true; // Mostrar vector aceleración transversal
    this.vectorScale = 1.0;   // Factor de escala de vectores

    this.initDPI();
    this.resetView();
    this.bindEvents();
    this.startLoop();
  }

  get k() { return (2 * Math.PI) / this.lambda; }
  get omega() { return 2 * Math.PI * this.f; }
  get v() { return this.lambda * this.f; }

  initDPI() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    if (this.originY === 0) {
      this.originY = this.displayHeight / 2;
    }
  }

  resetView() {
    this.originX = 70;
    this.originY = this.displayHeight / 2;
    this.pixelsPerUnitX = 70;
    this.pixelsPerUnitY = 70;
    this.render();
  }

  zoom(factor, centerX = this.displayWidth / 2, centerY = this.displayHeight / 2) {
    const prevXUnits = (centerX - this.originX) / this.pixelsPerUnitX;
    const prevYUnits = (this.originY - centerY) / this.pixelsPerUnitY;

    this.pixelsPerUnitX = Math.max(15, Math.min(600, this.pixelsPerUnitX * factor));
    this.pixelsPerUnitY = Math.max(15, Math.min(600, this.pixelsPerUnitY * factor));

    this.originX = centerX - prevXUnits * this.pixelsPerUnitX;
    this.originY = centerY + prevYUnits * this.pixelsPerUnitY;
    this.render();
  }

  toPixelX(xMath) { return this.originX + xMath * this.pixelsPerUnitX; }
  toPixelY(yMath) { return this.originY - yMath * this.pixelsPerUnitY; }
  toMathX(pixelX) { return (pixelX - this.originX) / this.pixelsPerUnitX; }
  toMathY(pixelY) { return (this.originY - pixelY) / this.pixelsPerUnitY; }

  calculateNiceStep(pixelsPerUnit, targetPixelStep = 80) {
    const rawStep = targetPixelStep / pixelsPerUnit;
    const power = Math.floor(Math.log10(rawStep));
    const fraction = rawStep / Math.pow(10, power);
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * Math.pow(10, power);
  }

  drawGrid() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const stepX = this.calculateNiceStep(this.pixelsPerUnitX, 75);
    const stepY = this.calculateNiceStep(this.pixelsPerUnitY, 75);

    // Cuadrícula Menor
    if (this.styles.gridMinor) {
      const minorStepX = stepX / 5;
      const minorStepY = stepY / 5;
      const startMathX = Math.floor(this.toMathX(0) / minorStepX) * minorStepX;
      const endMathX = Math.ceil(this.toMathX(w) / minorStepX) * minorStepX;

      ctx.save();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startMathX; x <= endMathX; x += minorStepX) {
        const px = this.toPixelX(x);
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      const startMathY = Math.floor(this.toMathY(h) / minorStepY) * minorStepY;
      const endMathY = Math.ceil(this.toMathY(0) / minorStepY) * minorStepY;
      for (let y = startMathY; y <= endMathY; y += minorStepY) {
        const py = this.toPixelY(y);
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Cuadrícula Mayor y Marcas
    if (this.styles.gridMajor) {
      const startMathX = Math.floor(this.toMathX(0) / stepX) * stepX;
      const endMathX = Math.ceil(this.toMathX(w) / stepX) * stepX;
      const startMathY = Math.floor(this.toMathY(h) / stepY) * stepY;
      const endMathY = Math.ceil(this.toMathY(0) / stepY) * stepY;

      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startMathX; x <= endMathX; x += stepX) {
        const px = this.toPixelX(x);
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      for (let y = startMathY; y <= endMathY; y += stepY) {
        const py = this.toPixelY(y);
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();
      ctx.restore();

      // Números y Ticks
      ctx.save();
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const axisYPos = Math.max(20, Math.min(h - 20, this.originY));
      for (let x = startMathX; x <= endMathX; x += stepX) {
        if (Math.abs(x) < 1e-6) continue;
        const px = this.toPixelX(x);
        ctx.beginPath();
        ctx.moveTo(px, this.originY - 5);
        ctx.lineTo(px, this.originY + 5);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const label = parseFloat(x.toPrecision(5)).toString();
        ctx.fillText(label, px, axisYPos + 6);
      }

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const axisXPos = Math.max(40, Math.min(w - 20, this.originX));
      for (let y = startMathY; y <= endMathY; y += stepY) {
        if (Math.abs(y) < 1e-6) continue;
        const py = this.toPixelY(y);
        ctx.beginPath();
        ctx.moveTo(this.originX - 5, py);
        ctx.lineTo(this.originX + 5, py);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const label = parseFloat(y.toPrecision(5)).toString();
        ctx.fillText(label, axisXPos - 8, py);
      }
      ctx.restore();
    }

    // Ejes Principales X e Y con Flechas
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(w, this.originY);
    ctx.moveTo(this.originX, 0);
    ctx.lineTo(this.originX, h);
    ctx.stroke();

    this.drawArrowhead(ctx, w - 10, this.originY, 0);
    this.drawArrowhead(ctx, this.originX, 10, -Math.PI / 2);

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('x [m] (Posición espacial)', w - 12, this.originY - 14);
    ctx.fillText('y [m] (Ondulación transversal)', this.originX + 10, 16);
    ctx.restore();
  }

  drawArrowhead(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-9, -4.5);
    ctx.lineTo(-9, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.drawGrid();

    const w = this.displayWidth;
    const startXMath = this.toMathX(0);
    const endXMath = this.toMathX(w);
    const stepMath = (endXMath - startXMath) / (w * 1.2);

    const k = this.k;
    const wAng = this.omega;
    const t = this.time;
    const phi = this.phi;

    // 1. Onda 1 (Progresiva hacia la derecha: kx - ωt + φ)
    if (this.showY1) {
      this.ctx.save();
      this.ctx.strokeStyle = this.styles.colorY1;
      this.ctx.lineWidth = this.styles.lineWidth;
      if (this.styles.lineDash.length > 0) this.ctx.setLineDash(this.styles.lineDash);
      this.ctx.beginPath();

      let first = true;
      for (let x = startXMath; x <= endXMath; x += stepMath) {
        const y = this.A * Math.sin(k * x - wAng * t + phi);
        const px = this.toPixelX(x);
        const py = this.toPixelY(y);
        if (first) { this.ctx.moveTo(px, py); first = false; }
        else { this.ctx.lineTo(px, py); }
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 2. Onda 2 (Regresiva hacia la izquierda: kx + ωt)
    if (this.showY2) {
      this.ctx.save();
      this.ctx.strokeStyle = this.styles.colorY2;
      this.ctx.lineWidth = this.styles.lineWidth;
      this.ctx.setLineDash([5, 4]);
      this.ctx.beginPath();

      let first = true;
      for (let x = startXMath; x <= endXMath; x += stepMath) {
        const y = this.A * Math.sin(k * x + wAng * t);
        const px = this.toPixelX(x);
        const py = this.toPixelY(y);
        if (first) { this.ctx.moveTo(px, py); first = false; }
        else { this.ctx.lineTo(px, py); }
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Onda Resultante (Superposición y_tot = y1 + y2 o solo y1 si y2 está apagada)
    if (this.showYtot && this.showY2) {
      this.ctx.save();
      this.ctx.strokeStyle = this.styles.colorYtot;
      this.ctx.lineWidth = this.styles.lineWidth + 1;
      this.ctx.beginPath();

      let first = true;
      for (let x = startXMath; x <= endXMath; x += stepMath) {
        const y1 = this.A * Math.sin(k * x - wAng * t + phi);
        const y2 = this.A * Math.sin(k * x + wAng * t);
        const ytot = y1 + y2; // Onda Estacionaria resultante: 2A*sin(kx)*cos(wt) si phi=0
        const px = this.toPixelX(x);
        const py = this.toPixelY(ytot);
        if (first) { this.ctx.moveTo(px, py); first = false; }
        else { this.ctx.lineTo(px, py); }
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Marcador de inspección interactivo por hover
    if (this.hoverCoord && this.activeTool === 'select') {
      this.drawInspectionMarker(this.hoverCoord.mathX);
    }

    // Sonda de vectores analíticos interactiva en x = this.inspectX
    this.drawVectorAnalysis();
  }

  drawVectorAnalysis() {
    const ctx = this.ctx;
    const x0 = this.inspectX;
    const k = this.k;
    const wAng = this.omega;
    const t = this.time;
    const phi = this.phi;

    // Componentes de desplazamiento de la onda
    const y1 = this.A * Math.sin(k * x0 - wAng * t + phi);
    const y2 = this.showY2 ? (this.A * Math.sin(k * x0 + wAng * t)) : 0;
    const yWave = (this.showYtot && this.showY2) ? (y1 + y2) : y1;

    // Si está vinculada a la onda, y sigue la elongación en tiempo real
    if (this.lockYToWave) {
      this.inspectY = yWave;
    }
    const yVal = this.inspectY;

    // Velocidades transversales: vy = dy/dt
    const vy1 = -wAng * this.A * Math.cos(k * x0 - wAng * t + phi);
    const vy2 = this.showY2 ? (wAng * this.A * Math.cos(k * x0 + wAng * t)) : 0;
    const vyWave = (this.showYtot && this.showY2) ? (vy1 + vy2) : vy1;
    const vyVal = vyWave;

    // Aceleración transversal restauradora: ay = -w^2 * y
    const ayVal = -Math.pow(wAng, 2) * yVal;

    const px = this.toPixelX(x0);
    const py = this.toPixelY(yVal);
    const pAxisY = this.toPixelY(0);
    const pWaveY = this.toPixelY(yWave);

    // 1. Línea guía vertical punteada desde el eje horizontal hasta la partícula
    ctx.save();
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px, pAxisY);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.restore();

    // 2. Si la partícula está en modo libre y alejada de la onda, marcar la posición de la onda
    if (!this.lockYToWave && Math.abs(yVal - yWave) > 0.04) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, pWaveY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(2, 132, 199, 0.5)';
      ctx.beginPath();
      ctx.arc(px, pWaveY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`y_onda=${yWave.toFixed(2)}m`, px + 8, pWaveY + 3);
      ctx.restore();
    }

    // 3. Marcador de posición en el eje X
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(px, pAxisY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'center';
    ctx.fillText(`x=${x0.toFixed(2)}m`, px, pAxisY + 14);
    ctx.restore();

    // 4. Perla de partícula inspeccionada en (x, y)
    ctx.save();
    ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pastilla flotante con coordenadas exactas (x, y)
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const coordLabel = `(${x0.toFixed(2)}m, ${yVal.toFixed(2)}m)`;
    const tw = ctx.measureText(coordLabel).width;
    const tagX = px + 10;
    const tagY = py - 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY - 10, tw + 8, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(coordLabel, tagX + 4, tagY - 2);
    ctx.restore();

    // 5. Vector Velocidad Transversal (vy)
    if (this.showVectorVy) {
      const maxVy = wAng * this.A * (this.showY2 && this.showYtot ? 2 : 1);
      const vyLenPx = (vyVal / (maxVy || 1)) * (55 * this.vectorScale);
      if (Math.abs(vyLenPx) > 2) {
        this.drawArrowVector(ctx, px - 6, py, px - 6, py - vyLenPx, '#10b981', `vy=${vyVal.toFixed(2)}m/s`, 'left');
      }
    }

    // 6. Vector Aceleración Transversal (ay)
    if (this.showVectorAy) {
      const maxAy = Math.pow(wAng, 2) * this.A * (this.showY2 && this.showYtot ? 2 : 1);
      const ayLenPx = (ayVal / (maxAy || 1)) * (55 * this.vectorScale);
      if (Math.abs(ayLenPx) > 2) {
        this.drawArrowVector(ctx, px + 6, py, px + 6, py - ayLenPx, '#ea580c', `ay=${ayVal.toFixed(1)}m/s²`, 'right');
      }
    }

    // 7. Actualización de telemetría numérica y sincronización de controles
    this.updateTelemetry(x0, yVal, yWave, t, vyVal, ayVal);
  }

  drawArrowVector(ctx, fromX, fromY, toX, toY, color, label, align) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 8 * Math.cos(angle - Math.PI / 6), toY - 8 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - 8 * Math.cos(angle + Math.PI / 6), toY - 8 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = align === 'left' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    const textX = align === 'left' ? fromX - 6 : fromX + 6;
    const textY = (fromY + toY) / 2;

    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const pillX = align === 'left' ? textX - tw - 4 : textX - 2;
    ctx.fillRect(pillX, textY - 7, tw + 6, 14);

    ctx.fillStyle = color;
    ctx.fillText(label, textX, textY);
    ctx.restore();
  }

  updateTelemetry(x, y, yWave, t, vy, ay) {
    const badges = [
      document.getElementById('ggbVectorTelemetry'),
      document.getElementById('modalGgbVectorTelemetry')
    ];
    badges.forEach(badge => {
      if (badge) {
        badge.innerHTML = `
          <span>📍 Partícula: (x: <strong>${x.toFixed(2)} m</strong>, y: <strong>${y.toFixed(2)} m</strong>)</span>
          <span>🌊 y_onda: <strong>${yWave.toFixed(2)} m</strong></span>
          <span>⏱️ t: <strong>${t.toFixed(2)} s</strong></span>
          <span style="color:#047857;">🟢 vy: <strong>${vy.toFixed(2)} m/s</strong></span>
          <span style="color:#c2410c;">🟠 ay: <strong>${ay.toFixed(1)} m/s²</strong></span>
        `;
      }
    });

    const valX = document.getElementById('ggbValX');
    if (valX) valX.textContent = `${x.toFixed(2)} m`;
    const modalValX = document.getElementById('modalGgbValX');
    if (modalValX) modalValX.textContent = `${x.toFixed(2)} m`;

    const valY = document.getElementById('ggbValY');
    if (valY) valY.textContent = `${y.toFixed(2)} m`;
    const modalValY = document.getElementById('modalGgbValY');
    if (modalValY) modalValY.textContent = `${y.toFixed(2)} m`;

    // Si está vinculada a la onda, actualizar inputs y sliders de Y automáticamente
    if (this.lockYToWave) {
      const numY = document.getElementById('ggbNumY');
      if (numY && document.activeElement !== numY) numY.value = y.toFixed(2);
      const modalNumY = document.getElementById('modalGgbNumY');
      if (modalNumY && document.activeElement !== modalNumY) modalNumY.value = y.toFixed(2);

      const sliderY = document.getElementById('ggbSliderY');
      if (sliderY) sliderY.value = y.toFixed(2);
      const modalSliderY = document.getElementById('modalGgbSliderY');
      if (modalSliderY) modalSliderY.value = y.toFixed(2);
    }

    const sliderT = document.getElementById('ggbSliderT');
    const valT = document.getElementById('ggbValT');
    if (sliderT && this.isPlaying) {
      sliderT.value = (t % 10).toFixed(2);
      if (valT) valT.textContent = `${t.toFixed(2)} s`;
    }
    const modalSliderT = document.getElementById('modalGgbSliderT');
    const modalValT = document.getElementById('modalGgbValT');
    if (modalSliderT && this.isPlaying) {
      modalSliderT.value = (t % 10).toFixed(2);
      if (modalValT) modalValT.textContent = `${t.toFixed(2)} s`;
    }
  }

  setInspectX(x) {
    this.inspectX = Math.max(0, Math.min(30, x));
    this.render();
  }

  setInspectY(y) {
    this.inspectY = Math.max(-10, Math.min(10, y));
    this.lockYToWave = false;
    this.render();
  }

  setLockYToWave(locked) {
    this.lockYToWave = !!locked;
    this.render();
  }

  setTime(t) {
    this.time = Math.max(0, t);
    this.render();
  }

  setVectorScale(scale) {
    this.vectorScale = Math.max(0.1, Math.min(5.0, scale));
    this.render();
  }

  setVectorVisibility(vy, ay) {
    if (vy !== undefined) this.showVectorVy = vy;
    if (ay !== undefined) this.showVectorAy = ay;
    this.render();
  }

  drawInspectionMarker(xMath) {
    const k = this.k;
    const wAng = this.omega;
    const t = this.time;
    const phi = this.phi;

    const y = this.A * Math.sin(k * xMath - wAng * t + phi);
    const px = this.toPixelX(xMath);
    const py = this.toPixelY(y);

    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#e11d48';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, this.displayHeight);
    ctx.moveTo(0, py);
    ctx.lineTo(this.displayWidth, py);
    ctx.stroke();

    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const badge = document.getElementById('ggbCoordsBadge') || document.getElementById('modalGgbCoordsBadge');
    if (badge) {
      badge.textContent = `x: ${xMath.toFixed(2)} m | y(x) [Ondulación]: ${y.toFixed(2)} m | v: ${this.v.toFixed(2)} m/s`;
    }
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.05, Math.min(5.0, multiplier));
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  startLoop() {
    const loop = (now) => {
      const dt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;

      if (this.isPlaying) {
        this.time += dt * this.speedMultiplier;
        this.render();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  setTool(tool) {
    this.activeTool = tool;
    if (tool === 'pan') this.canvas.style.cursor = 'grab';
    else if (tool === 'select') this.canvas.style.cursor = 'crosshair';
  }

  bindEvents() {
    const canvas = this.canvas;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const probePx = this.toPixelX(this.inspectX);
      const probePy = this.toPixelY(this.inspectY);

      // Si el usuario hace click cerca de la perla de la partícula, arrastrarla libremente
      if (Math.hypot(mouseX - probePx, mouseY - probePy) < 18) {
        this.isDraggingParticle = true;
        this.lockYToWave = false;
        canvas.style.cursor = 'grabbing';
        this.notifyParticleModeChange(false);
        return;
      }

      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      if (this.activeTool === 'pan') canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
        this.hoverCoord = {
          pixelX: mouseX,
          pixelY: mouseY,
          mathX: this.toMathX(mouseX),
          mathY: this.toMathY(mouseY)
        };

        const probePx = this.toPixelX(this.inspectX);
        const probePy = this.toPixelY(this.inspectY);
        if (Math.hypot(mouseX - probePx, mouseY - probePy) < 18 && !this.isDragging) {
          canvas.style.cursor = 'grab';
        } else if (!this.isDraggingParticle && this.activeTool === 'pan') {
          canvas.style.cursor = 'grab';
        }
      }

      // Arrastre directo de la partícula por el usuario
      if (this.isDraggingParticle) {
        const mathX = Math.max(0.0, Math.min(15.0, this.toMathX(mouseX)));
        const mathY = Math.max(-3.5, Math.min(3.5, this.toMathY(mouseY)));
        this.inspectX = mathX;
        this.inspectY = mathY;
        this.syncInputsFromDrag(mathX, mathY);
        this.render();
        return;
      }

      if (this.isDragging && this.activeTool === 'pan') {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        this.originX += dx;
        this.originY += dy;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isDraggingParticle = false;
      if (this.activeTool === 'pan') canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      this.zoom(factor, mouseX, mouseY);
    }, { passive: false });
  }

  syncInputsFromDrag(x, y) {
    const ids = [
      { numX: 'ggbNumX', sliderX: 'ggbSliderX', valX: 'ggbValX', numY: 'ggbNumY', sliderY: 'ggbSliderY', valY: 'ggbValY' },
      { numX: 'modalGgbNumX', sliderX: 'modalGgbSliderX', valX: 'modalGgbValX', numY: 'modalGgbNumY', sliderY: 'modalGgbSliderY', valY: 'modalGgbValY' }
    ];
    ids.forEach(pair => {
      const numX = document.getElementById(pair.numX);
      if (numX) numX.value = x.toFixed(2);
      const sliderX = document.getElementById(pair.sliderX);
      if (sliderX) sliderX.value = x.toFixed(2);
      const valX = document.getElementById(pair.valX);
      if (valX) valX.textContent = `${x.toFixed(2)} m`;

      const numY = document.getElementById(pair.numY);
      if (numY) numY.value = y.toFixed(2);
      const sliderY = document.getElementById(pair.sliderY);
      if (sliderY) sliderY.value = y.toFixed(2);
      const valY = document.getElementById(pair.valY);
      if (valY) valY.textContent = `${y.toFixed(2)} m`;
    });
  }

  notifyParticleModeChange(locked) {
    const btnsLock = [document.getElementById('btnGgbLockWave'), document.getElementById('modalBtnGgbLockWave')];
    const btnsManual = [document.getElementById('btnGgbManualY'), document.getElementById('modalBtnGgbManualY')];
    btnsLock.forEach(b => b?.classList.toggle('active', locked));
    btnsManual.forEach(b => b?.classList.toggle('active', !locked));
  }
}

window.GeoGebraWavePlane = GeoGebraWavePlane;
