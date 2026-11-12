/**
 * Laboratorio Virtual de Simulaciones Físicas de Ondas (Nivel Premium)
 * Cuaderno Digital de Física III - Movimiento Ondulatorio
 * Universidad Tecnológica de Pereira (UTP)
 * Autores: David Alejandro Ramirez Bolaños, Steven Vélez Garces, Sergio Andrés Velásquez Arana
 */

// ============================================================================
// SIMULADOR 1: ONDA TRANSVERSAL EN CUERDA TENSA (60 FPS)
// ============================================================================
class TautStringSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros físicos
    this.Ts = 40.0;    // Tensión de la cuerda [N]
    this.mu = 0.05;    // Densidad lineal de masa [kg/m]
    this.A = 1.2;      // Amplitud [m]
    this.f = 1.2;      // Frecuencia [Hz]
    this.showVectors = true; // Mostrar vectores vy y ay
    this.inspectX = 2.0;       // Posición de análisis x [m]
    this.inspectY = 0.0;       // Posición de análisis y [m]
    this.lockYToWave = true;   // Si está fijada a la onda o posición libre
    this.isDraggingParticle = false;
    this.showVectorVy = true;  // Vector velocidad transversal
    this.showVectorAy = true;  // Vector aceleración transversal
    this.showAllVectors = true;// Pequeños vectores a lo largo de la cuerda
    this.vectorScale = 1.0;    // Escala multiplicadora de vectores

    // Estado de simulación
    this.time = 0;
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.lengthMeters = 8.0; // Longitud total simulada en metros
    this.particleCount = 90; // Partículas discretizadas
    this.lastTime = performance.now();

    this.initDPI();
    this.bindEvents();
    this.startLoop();
  }

  get v() { return Math.sqrt(this.Ts / this.mu); }
  get lambda() { return this.v / this.f; }
  get k() { return (2 * Math.PI) / this.lambda; }
  get omega() { return 2 * Math.PI * this.f; }
  get Pmed() { return 0.5 * this.mu * this.v * Math.pow(this.omega, 2) * Math.pow(this.A, 2); }

  initDPI() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.05, Math.min(5.0, multiplier));
  }

  setInspectX(x) {
    this.inspectX = Math.max(0, Math.min(this.lengthMeters, x));
    this.render();
  }

  setInspectY(y) {
    this.inspectY = Math.max(-2.5, Math.min(2.5, y));
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

  setVectorVisibility(vy, ay, all) {
    if (vy !== undefined) this.showVectorVy = vy;
    if (ay !== undefined) this.showVectorAy = ay;
    if (all !== undefined) this.showAllVectors = all;
    this.render();
  }

  bindEvents() {
    const canvas = this.canvas;
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerY = this.displayHeight * 0.52;
      const pxPerMeterX = (this.displayWidth - 80) / this.lengthMeters;
      const pxPerMeterY = 70;
      const probePx = 40 + this.inspectX * pxPerMeterX;
      const probePy = centerY - this.inspectY * pxPerMeterY;

      if (Math.hypot(mouseX - probePx, mouseY - probePy) < 20) {
        this.isDraggingParticle = true;
        this.lockYToWave = false;
        canvas.style.cursor = 'grabbing';
        this.notifyParticleModeChange(false);
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerY = this.displayHeight * 0.52;
      const pxPerMeterX = (this.displayWidth - 80) / this.lengthMeters;
      const pxPerMeterY = 70;
      const probePx = 40 + this.inspectX * pxPerMeterX;
      const probePy = centerY - this.inspectY * pxPerMeterY;

      if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
        if (Math.hypot(mouseX - probePx, mouseY - probePy) < 20 && !this.isDraggingParticle) {
          canvas.style.cursor = 'grab';
        } else if (!this.isDraggingParticle) {
          canvas.style.cursor = 'default';
        }
      }

      if (this.isDraggingParticle) {
        const mathX = Math.max(0.0, Math.min(this.lengthMeters, (mouseX - 40) / pxPerMeterX));
        const mathY = Math.max(-1.5, Math.min(1.5, (centerY - mouseY) / pxPerMeterY));
        this.inspectX = mathX;
        this.inspectY = mathY;
        this.syncInputsFromDrag(mathX, mathY);
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingParticle) {
        this.isDraggingParticle = false;
        canvas.style.cursor = 'grab';
      }
    });
  }

  syncInputsFromDrag(x, y) {
    const ids = [
      { numX: 'tautNumX', sliderX: 'simSliderX', valX: 'simValX', numY: 'tautNumY', sliderY: 'tautSliderY', valY: 'tautValY' },
      { numX: 'modalTautNumX', sliderX: 'modalSimSliderX', valX: 'modalSimValX', numY: 'modalTautNumY', sliderY: 'modalTautSliderY', valY: 'modalTautValY' }
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
    const btnsLock = [document.getElementById('btnTautLockWave'), document.getElementById('modalBtnTautLockWave')];
    const btnsManual = [document.getElementById('btnTautManualY'), document.getElementById('modalBtnTautManualY')];
    btnsLock.forEach(b => b?.classList.toggle('active', locked));
    btnsManual.forEach(b => b?.classList.toggle('active', !locked));
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  startLoop() {
    const loop = (now) => {
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      if (this.isPlaying) {
        this.time += dt * this.speedMultiplier;
        this.render();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // Fondo degradado de laboratorio
    const gradBg = ctx.createLinearGradient(0, 0, 0, h);
    gradBg.addColorStop(0, '#f8fafc');
    gradBg.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, w, h);

    // Línea de referencia central (equilibrio de la cuerda)
    const centerY = h * 0.52;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, centerY);
    ctx.lineTo(w - 30, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Escalas de dibujo
    const usableWidth = w - 80;
    const pxPerMeterX = usableWidth / this.lengthMeters;
    const pxPerMeterY = Math.min(65, (h * 0.35) / Math.max(1, this.A));

    const k = this.k;
    const wAng = this.omega;
    const t = this.time;
    const A = this.A;

    // Dibujo de la cuerda elástica como curva suave
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0284c7';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = [];
    for (let i = 0; i <= this.particleCount; i++) {
      const frac = i / this.particleCount;
      const xMeters = frac * this.lengthMeters;
      const yMeters = A * Math.sin(k * xMeters - wAng * t);

      const px = 40 + xMeters * pxPerMeterX;
      const py = centerY - yMeters * pxPerMeterY;
      points.push({ x: px, y: py, xm: xMeters, ym: yMeters });

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // Sombra sutil de la cuerda
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.15)';
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y + 4);
      else ctx.lineTo(points[i].x, points[i].y + 4);
    }
    ctx.stroke();
    ctx.restore();

    // Dibujo de perlas/partículas y vectores en cada perla
    for (let i = 0; i < points.length; i += 3) {
      const p = points[i];
      // Perla
      ctx.fillStyle = (i === 0) ? '#e11d48' : '#0369a1';
      ctx.beginPath();
      ctx.arc(p.x, p.y, (i === 0) ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Vectores de velocidad transversal de partícula en perlas seleccionadas
      if (this.showVectors && this.showAllVectors && this.showVectorVy && i % 9 === 0 && i > 0 && i < points.length - 2) {
        const vy = -A * wAng * Math.cos(k * p.xm - wAng * t);
        const vectorLen = (vy / (A * wAng || 1)) * (28 * this.vectorScale);

        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - vectorLen);
        ctx.stroke();

        // Punta de flecha
        if (Math.abs(vectorLen) > 5) {
          const sign = vectorLen > 0 ? -1 : 1;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - vectorLen);
          ctx.lineTo(p.x - 3, p.y - vectorLen - sign * 5);
          ctx.lineTo(p.x + 3, p.y - vectorLen - sign * 5);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Dibujo destacado de la Partícula Inspeccionada en x = this.inspectX con sus Vectores
    this.drawProbeAnalysis(ctx, centerY, pxPerMeterX, pxPerMeterY, w, h);

    // Soporte del extremo emisor oscilante (x = 0)
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, centerY - 60, 16, 120);
    // Guía del actuador armónico
    ctx.fillStyle = '#64748b';
    ctx.fillRect(36, points[0].y - 8, 8, 16);
    ctx.restore();

    // Soporte del extremo derecho (abrazadera)
    const lastP = points[points.length - 1];
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(lastP.x, centerY - 45, 14, 90);
    ctx.restore();

    // HUD con Telemetría Física Instantánea
    this.drawHUD(ctx, w, h);
  }

  drawProbeAnalysis(ctx, centerY, pxPerMeterX, pxPerMeterY, w, h) {
    const x0 = this.inspectX;
    const k = this.k;
    const wAng = this.omega;
    const t = this.time;
    const A = this.A;

    const yWave = A * Math.sin(k * x0 - wAng * t);
    if (this.lockYToWave) {
      this.inspectY = yWave;
    }
    const yVal = this.inspectY;

    const vyVal = -wAng * A * Math.cos(k * x0 - wAng * t);
    const ayVal = -Math.pow(wAng, 2) * yVal;

    const px = 40 + x0 * pxPerMeterX;
    const py = centerY - yVal * pxPerMeterY;
    const pWaveY = centerY - yWave * pxPerMeterY;

    // 1. Línea guía vertical punteada desde eje de equilibrio hasta la partícula
    ctx.save();
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px, centerY);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.restore();

    // 2. Si la partícula está en modo libre, mostrar marcador de la onda
    if (!this.lockYToWave && Math.abs(yVal - yWave) > 0.04) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, pWaveY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.beginPath();
      ctx.arc(px, pWaveY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`y_onda=${yWave.toFixed(2)}m`, px + 8, pWaveY + 3);
      ctx.restore();
    }

    // 3. Marcador en el eje de equilibrio
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(px, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(`x=${x0.toFixed(2)}m`, px, centerY + 14);
    ctx.restore();

    // 4. Perla inspeccionada en la cuerda (destacada)
    ctx.save();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ec4899';
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
    ctx.fillStyle = '#f472b6';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(coordLabel, tagX + 4, tagY - 2);
    ctx.restore();

    // 5. Vector Velocidad Transversal (vy)
    if (this.showVectorVy) {
      const vyLenPx = (vyVal / (wAng * A || 1)) * (52 * this.vectorScale);
      if (Math.abs(vyLenPx) > 2) {
        this.drawVectorArrow(ctx, px - 6, py, px - 6, py - vyLenPx, '#10b981', `vy=${vyVal.toFixed(2)}m/s`, 'left');
      }
    }

    // 6. Vector Aceleración Transversal (ay)
    if (this.showVectorAy) {
      const ayLenPx = (ayVal / (Math.pow(wAng, 2) * A || 1)) * (52 * this.vectorScale);
      if (Math.abs(ayLenPx) > 2) {
        this.drawVectorArrow(ctx, px + 6, py, px + 6, py - ayLenPx, '#ea580c', `ay=${ayVal.toFixed(1)}m/s²`, 'right');
      }
    }

    // 7. Actualización de telemetría numérica
    this.updateTelemetry(x0, yVal, yWave, t, vyVal, ayVal);
  }

  drawVectorArrow(ctx, fromX, fromY, toX, toY, color, label, align) {
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
      document.getElementById('tautVectorTelemetry'),
      document.getElementById('modalTautVectorTelemetry')
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

    const valX = document.getElementById('simValX');
    if (valX) valX.textContent = `${x.toFixed(2)} m`;
    const modalValX = document.getElementById('modalSimValX');
    if (modalValX) modalValX.textContent = `${x.toFixed(2)} m`;

    const valY = document.getElementById('tautValY');
    if (valY) valY.textContent = `${y.toFixed(2)} m`;
    const modalValY = document.getElementById('modalTautValY');
    if (modalValY) modalValY.textContent = `${y.toFixed(2)} m`;

    if (this.lockYToWave) {
      const numY = document.getElementById('tautNumY');
      if (numY && document.activeElement !== numY) numY.value = y.toFixed(2);
      const modalNumY = document.getElementById('modalTautNumY');
      if (modalNumY && document.activeElement !== modalNumY) modalNumY.value = y.toFixed(2);

      const sliderY = document.getElementById('tautSliderY');
      if (sliderY) sliderY.value = y.toFixed(2);
      const modalSliderY = document.getElementById('modalTautSliderY');
      if (modalSliderY) modalSliderY.value = y.toFixed(2);
    }

    const sliderT = document.getElementById('simSliderT');
    const valT = document.getElementById('simValT');
    if (sliderT && this.isPlaying) {
      sliderT.value = (t % 10).toFixed(2);
      if (valT) valT.textContent = `${t.toFixed(2)} s`;
    }
    const modalSliderT = document.getElementById('modalSimSliderT');
    const modalValT = document.getElementById('modalSimValT');
    if (modalSliderT && this.isPlaying) {
      modalSliderT.value = (t % 10).toFixed(2);
      if (modalValT) modalValT.textContent = `${t.toFixed(2)} s`;
    }
  }

  drawHUD(ctx, w, h) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const boxW = Math.min(360, w - 32);
    const boxX = 16;
    const boxY = 14;
    const boxH = 64;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.fillText(`Rapidez v = √(Ts/μ): ${this.v.toFixed(2)} m/s`, boxX + 12, boxY + 20);

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText(`λ = ${this.lambda.toFixed(2)} m  |  k = ${this.k.toFixed(2)} rad/m`, boxX + 12, boxY + 38);
    ctx.fillText(`ω = ${this.omega.toFixed(2)} rad/s  |  Pmed = ${this.Pmed.toFixed(2)} W`, boxX + 12, boxY + 54);
    ctx.restore();
  }

  bindEvents() {}
}


// ============================================================================
// SIMULADOR 2: ONDAS ESTACIONARIAS (MODOS NORMALES) & EFECTO DOPPLER
// ============================================================================
class StandingWaveAndDopplerSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.mode = 'standing'; // 'standing' o 'doppler'

    // Parámetros Ondas Estacionarias
    this.harmonicN = 3;       // Modo normal n = 1, 2, 3, 4, 5...
    this.standingA = 1.0;     // Amplitud base [m]
    this.stringLength = 6.0;  // Longitud L [m]
    this.waveSpeed = 12.0;    // v [m/s]

    // Parámetros Efecto Doppler
    this.sourceSpeed = 140;   // vs [m/s]
    this.soundSpeed = 340;    // v [m/s]
    this.sourceFreq = 2.0;    // f0 [Hz]
    this.sourceX = 100;
    this.wavefronts = [];
    this.lastWavefrontEmit = 0;

    // Estado interactivo
    this.time = 0;
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.lastTime = performance.now();

    // Recuadro de Selección de Partícula y Vectores (x, y, t)
    this.inspectX = 1.0;      // Posición de análisis x [m] (0 <= x <= stringLength)
    this.inspectY = 0.0;      // Posición de análisis y [m]
    this.lockYToWave = true;  // Si está fijada a la onda o posición libre
    this.isDraggingParticle = false;
    this.showVectorVy = true; // Mostrar vector velocidad transversal
    this.showVectorAy = true; // Mostrar vector aceleración transversal
    this.vectorScale = 1.0;   // Factor de escala de vectores

    this.initDPI();
    this.bindEvents();
    this.startLoop();
  }

  get fn() { return (this.harmonicN * this.waveSpeed) / (2 * this.stringLength); }
  get lambdaN() { return (2 * this.stringLength) / this.harmonicN; }

  initDPI() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.05, Math.min(5.0, multiplier));
  }

  setInspectX(x) {
    this.inspectX = Math.max(0, Math.min(this.stringLength, x));
    if (this.mode === 'standing') this.renderStanding();
  }

  setInspectY(y) {
    this.inspectY = Math.max(-2.5, Math.min(2.5, y));
    this.lockYToWave = false;
    if (this.mode === 'standing') this.renderStanding();
  }

  setLockYToWave(locked) {
    this.lockYToWave = !!locked;
    if (this.mode === 'standing') this.renderStanding();
  }

  setTime(t) {
    this.time = Math.max(0, t);
    if (this.mode === 'standing') this.renderStanding();
  }

  setVectorScale(scale) {
    this.vectorScale = Math.max(0.1, Math.min(5.0, scale));
    if (this.mode === 'standing') this.renderStanding();
  }

  setVectorVisibility(vy, ay) {
    if (vy !== undefined) this.showVectorVy = vy;
    if (ay !== undefined) this.showVectorAy = ay;
    if (this.mode === 'standing') this.renderStanding();
  }

  bindEvents() {
    const canvas = this.canvas;
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      if (this.mode !== 'standing') return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerY = this.displayHeight * 0.54;
      const marginX = 50;
      const usableW = this.displayWidth - marginX * 2;
      const pxPerMeter = usableW / this.stringLength;
      const pxPerY = Math.min(55, (this.displayHeight * 0.28) / (this.standingA * 2));

      const probePx = marginX + this.inspectX * pxPerMeter;
      const probePy = centerY - this.inspectY * pxPerY;

      if (Math.hypot(mouseX - probePx, mouseY - probePy) < 20) {
        this.isDraggingParticle = true;
        this.lockYToWave = false;
        canvas.style.cursor = 'grabbing';
        this.notifyParticleModeChange(false);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mode !== 'standing') return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerY = this.displayHeight * 0.54;
      const marginX = 50;
      const usableW = this.displayWidth - marginX * 2;
      const pxPerMeter = usableW / this.stringLength;
      const pxPerY = Math.min(55, (this.displayHeight * 0.28) / (this.standingA * 2));

      const probePx = marginX + this.inspectX * pxPerMeter;
      const probePy = centerY - this.inspectY * pxPerY;

      if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
        if (Math.hypot(mouseX - probePx, mouseY - probePy) < 20 && !this.isDraggingParticle) {
          canvas.style.cursor = 'grab';
        } else if (!this.isDraggingParticle) {
          canvas.style.cursor = 'default';
        }
      }

      if (this.isDraggingParticle) {
        const mathX = Math.max(0.0, Math.min(this.stringLength, (mouseX - marginX) / pxPerMeter));
        const mathY = Math.max(-1.5, Math.min(1.5, (centerY - mouseY) / pxPerY));
        this.inspectX = mathX;
        this.inspectY = mathY;
        this.syncInputsFromDrag(mathX, mathY);
        this.renderStanding();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingParticle) {
        this.isDraggingParticle = false;
        canvas.style.cursor = 'grab';
      }
    });
  }

  syncInputsFromDrag(x, y) {
    const ids = [
      { numX: 'standingNumX', sliderX: 'sliderStandingX', valX: 'standingValX', numY: 'standingNumY', sliderY: 'sliderStandingY', valY: 'standingValY' },
      { numX: 'modalStandingNumX', sliderX: 'modalStandingSliderX', valX: 'modalStandingValX', numY: 'modalStandingNumY', sliderY: 'modalStandingSliderY', valY: 'modalStandingValY' }
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
    const btnsLock = [document.getElementById('btnStandingLockWave'), document.getElementById('modalBtnStandingLockWave')];
    const btnsManual = [document.getElementById('btnStandingManualY'), document.getElementById('modalBtnStandingManualY')];
    btnsLock.forEach(b => b?.classList.toggle('active', locked));
    btnsManual.forEach(b => b?.classList.toggle('active', !locked));
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  reset() {
    this.time = 0;
    this.sourceX = 100;
    this.wavefronts = [];
  }

  startLoop() {
    const loop = (now) => {
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      if (this.isPlaying) {
        const effectiveDt = dt * this.speedMultiplier;
        this.time += effectiveDt;
        if (this.mode === 'standing') {
          this.renderStanding();
        } else {
          this.updateAndRenderDoppler(effectiveDt);
        }
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // --------------------------------------------------------------------------
  // RENDER MODO 1: ONDAS ESTACIONARIAS
  // --------------------------------------------------------------------------
  renderStanding() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const centerY = h * 0.54;
    const marginX = 50;
    const usableW = w - marginX * 2;
    const pxPerMeter = usableW / this.stringLength;
    const pxPerY = Math.min(55, (h * 0.28) / (this.standingA * 2));

    const n = this.harmonicN;
    const L = this.stringLength;
    const kn = (n * Math.PI) / L;
    const wn = 2 * Math.PI * this.fn;
    const t = this.time;

    // Envolvente de amplitud máxima 2A * |sin(kn*x)|
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    ctx.beginPath();
    for (let x = 0; x <= L; x += 0.05) {
      const envY = 2 * this.standingA * Math.sin(kn * x);
      const px = marginX + x * pxPerMeter;
      const py = centerY - envY * pxPerY;
      if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= L; x += 0.05) {
      const envY = -2 * this.standingA * Math.sin(kn * x);
      const px = marginX + x * pxPerMeter;
      const py = centerY - envY * pxPerY;
      if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Eje de equilibrio horizontal
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, centerY);
    ctx.lineTo(marginX + usableW, centerY);
    ctx.stroke();

    // Trazo dinámico de la onda estacionaria: y(x,t) = 2A * sin(kn*x) * cos(wn*t)
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let x = 0; x <= L; x += 0.04) {
      const y = 2 * this.standingA * Math.sin(kn * x) * Math.cos(wn * t);
      const px = marginX + x * pxPerMeter;
      const py = centerY - y * pxPerY;
      if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // Identificación y Marcado de NODOS (Amplitud = 0)
    const nodeCoords = [];
    for (let i = 0; i <= n; i++) {
      const nodeX = (i * L) / n;
      const px = marginX + nodeX * pxPerMeter;
      nodeCoords.push(px);

      // Punto rojo de Nodo
      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(px, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = '#b91c1c';
      ctx.textAlign = 'center';
      ctx.fillText(`Nodo ${i + 1}`, px, centerY + 18);
      ctx.restore();
    }

    // Identificación y Marcado de CRESTAS (Arriba) y VALLES (Abajo)
    for (let i = 0; i < n; i++) {
      const antinodeX = ((2 * i + 1) * L) / (2 * n);
      const px = marginX + antinodeX * pxPerMeter;
      const curY = 2 * this.standingA * Math.sin(kn * antinodeX) * Math.cos(wn * t);
      const py = centerY - curY * pxPerY;

      // Determinamos si en este instante el lóbulo es Cresta (arriba) o Valle (abajo)
      const isCrest = curY >= 0;

      if (isCrest) {
        // --- CRESTA (punto superior de la onda) ---
        ctx.save();
        // Halo exterior translúcido
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();

        // Punto verde esmeralda
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Etiqueta "Cresta" en la parte superior
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const label = 'Cresta';
        const tw = ctx.measureText(label).width;
        const textY = Math.min(py - 10, centerY - 14);

        // Pastilla de fondo para legibilidad impecable
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.roundRect(px - tw / 2 - 5, textY - 14, tw + 10, 16, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#047857';
        ctx.fillText(label, px, textY);
        ctx.restore();
      } else {
        // --- VALLE (punto inferior de la onda) ---
        ctx.save();
        // Halo exterior translúcido
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();

        // Punto ámbar/naranja vibrante
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Etiqueta "Valle" en la parte inferior
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = 'Valle';
        const tw = ctx.measureText(label).width;
        const textY = Math.max(py + 10, centerY + 22);

        // Pastilla de fondo para legibilidad impecable
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.roundRect(px - tw / 2 - 5, textY - 2, tw + 10, 16, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.fillText(label, px, textY);
        ctx.restore();
      }
    }

    // Apoyos fijos en extremos x=0 y x=L
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(marginX - 12, centerY - 35, 12, 70);
    ctx.fillRect(marginX + usableW, centerY - 35, 12, 70);

    // Sonda de análisis de vectores y partícula en x = this.inspectX
    this.drawProbeAnalysis(ctx, centerY, marginX, pxPerMeter, pxPerY, w, h);

    // Caja informativa del modo armónico
    this.drawStandingHUD(ctx, w, h);
  }

  drawProbeAnalysis(ctx, centerY, marginX, pxPerMeter, pxPerY, w, h) {
    const x0 = this.inspectX;
    const kn = (this.harmonicN * Math.PI) / this.stringLength;
    const wn = 2 * Math.PI * this.fn;
    const t = this.time;

    const yWave = 2 * this.standingA * Math.sin(kn * x0) * Math.cos(wn * t);
    if (this.lockYToWave) {
      this.inspectY = yWave;
    }
    const yVal = this.inspectY;

    const vyVal = -2 * this.standingA * wn * Math.sin(kn * x0) * Math.sin(wn * t);
    const ayVal = -Math.pow(wn, 2) * yVal;

    const px = marginX + x0 * pxPerMeter;
    const py = centerY - yVal * pxPerY;
    const pWaveY = centerY - yWave * pxPerY;

    // 1. Línea guía vertical punteada
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px, centerY);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.restore();

    // 2. Si la partícula está en modo libre, mostrar marcador de la onda
    if (!this.lockYToWave && Math.abs(yVal - yWave) > 0.04) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, pWaveY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.beginPath();
      ctx.arc(px, pWaveY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`y_onda=${yWave.toFixed(2)}m`, px + 8, pWaveY + 3);
      ctx.restore();
    }

    // 3. Marcador en el eje de equilibrio
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(px, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(`x=${x0.toFixed(2)}m`, px, centerY + 14);
    ctx.restore();

    // 4. Perla inspeccionada en la onda estacionaria
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06b6d4';
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
    ctx.fillStyle = '#67e8f9';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(coordLabel, tagX + 4, tagY - 2);
    ctx.restore();

    // 5. Vector Velocidad Transversal (vy)
    if (this.showVectorVy) {
      const maxVy = 2 * this.standingA * wn;
      const vyLenPx = (vyVal / (maxVy || 1)) * (52 * this.vectorScale);
      if (Math.abs(vyLenPx) > 2) {
        this.drawVectorArrow(ctx, px - 6, py, px - 6, py - vyLenPx, '#10b981', `vy=${vyVal.toFixed(2)}m/s`, 'left');
      }
    }

    // 6. Vector Aceleración Transversal (ay)
    if (this.showVectorAy) {
      const maxAy = Math.pow(wn, 2) * 2 * this.standingA;
      const ayLenPx = (ayVal / (maxAy || 1)) * (52 * this.vectorScale);
      if (Math.abs(ayLenPx) > 2) {
        this.drawVectorArrow(ctx, px + 6, py, px + 6, py - ayLenPx, '#ea580c', `ay=${ayVal.toFixed(1)}m/s²`, 'right');
      }
    }

    // 7. Actualización de telemetría numérica
    this.updateStandingTelemetry(x0, yVal, yWave, t, vyVal, ayVal);
  }

  drawVectorArrow(ctx, fromX, fromY, toX, toY, color, label, align) {
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

  updateStandingTelemetry(x, y, yWave, t, vy, ay) {
    const badges = [
      document.getElementById('standingVectorTelemetry'),
      document.getElementById('modalStandingVectorTelemetry')
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

    const valX = document.getElementById('standingValX');
    if (valX) valX.textContent = `${x.toFixed(2)} m`;
    const modalValX = document.getElementById('modalStandingValX');
    if (modalValX) modalValX.textContent = `${x.toFixed(2)} m`;

    const valY = document.getElementById('standingValY');
    if (valY) valY.textContent = `${y.toFixed(2)} m`;
    const modalValY = document.getElementById('modalStandingValY');
    if (modalValY) modalValY.textContent = `${y.toFixed(2)} m`;

    if (this.lockYToWave) {
      const numY = document.getElementById('standingNumY');
      if (numY && document.activeElement !== numY) numY.value = y.toFixed(2);
      const modalNumY = document.getElementById('modalStandingNumY');
      if (modalNumY && document.activeElement !== modalNumY) modalNumY.value = y.toFixed(2);

      const sliderY = document.getElementById('sliderStandingY');
      if (sliderY) sliderY.value = y.toFixed(2);
      const modalSliderY = document.getElementById('modalStandingSliderY');
      if (modalSliderY) modalSliderY.value = y.toFixed(2);
    }

    const sliderT = document.getElementById('sliderStandingT');
    const valT = document.getElementById('standingValT');
    if (sliderT && this.isPlaying) {
      sliderT.value = (t % 5).toFixed(2);
      if (valT) valT.textContent = `${t.toFixed(2)} s`;
    }
    const modalSliderT = document.getElementById('modalStandingSliderT');
    const modalValT = document.getElementById('modalStandingValT');
    if (modalSliderT && this.isPlaying) {
      modalSliderT.value = (t % 5).toFixed(2);
      if (modalValT) modalValT.textContent = `${t.toFixed(2)} s`;
    }
  }

  drawStandingHUD(ctx, w, h) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const boxW = Math.min(340, w - 32);
    const boxX = 16;
    const boxY = 12;
    const boxH = 58;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#4338ca';
    ctx.fillText(`Modo Armónico: n = ${this.harmonicN} (${this.harmonicN === 1 ? 'Fundamental' : this.harmonicN + '° Armónico'})`, boxX + 12, boxY + 18);

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText(`fn = ${this.fn.toFixed(2)} Hz  |  λn = ${this.lambdaN.toFixed(2)} m`, boxX + 12, boxY + 34);
    ctx.fillText(`Nodos: ${this.harmonicN + 1}  |  Antinodos: ${this.harmonicN} (Crestas/Valles)`, boxX + 12, boxY + 50);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // RENDER MODO 2: EFECTO DOPPLER
  // --------------------------------------------------------------------------
  updateAndRenderDoppler(dt) {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090d16'; // Modo radar / oscuro para efecto visual impactante
    ctx.fillRect(0, 0, w, h);

    const centerY = h / 2;
    const scalePx = w / 800; // Factor de reescalado

    // Mover la fuente sonora hacia la derecha
    const vsPx = (this.sourceSpeed / 340) * 120 * scalePx;
    this.sourceX += vsPx * dt;
    if (this.sourceX > w + 50) this.sourceX = -40;

    // Emisión periódica de frentes de onda circulares
    const emitInterval = 1 / this.sourceFreq;
    if (this.time - this.lastWavefrontEmit >= emitInterval) {
      this.wavefronts.push({
        x: this.sourceX,
        y: centerY,
        r: 0,
        age: 0
      });
      this.lastWavefrontEmit = this.time;
    }

    // Expandir frentes de onda a rapidez del sonido c
    const soundSpeedPx = 120 * scalePx;
    for (let i = this.wavefronts.length - 1; i >= 0; i--) {
      const wf = this.wavefronts[i];
      wf.r += soundSpeedPx * dt;
      wf.age += dt;

      // Dibujar frente de onda circular
      const alpha = Math.max(0, 1 - wf.r / (w * 0.8));
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wf.x, wf.y, wf.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (alpha <= 0) this.wavefronts.splice(i, 1);
    }

    // Observador fijo adelante (en x = w - 80)
    const obsX = w - 80;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(obsX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText('Observador', obsX, centerY + 22);

    // Fuente móvil (pilar de audio emisora)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(this.sourceX, centerY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Flecha de velocidad de la fuente vs
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.sourceX, centerY);
    ctx.lineTo(this.sourceX + 24, centerY);
    ctx.stroke();

    // Cálculo teórico Doppler en tiempo real
    const vSound = this.soundSpeed;
    const vSrc = this.sourceSpeed;
    const f0 = this.sourceFreq;
    const fAhead = f0 * (vSound / (vSound - vSrc));
    const fBehind = f0 * (vSound / (vSound + vSrc));

    // Telemetría Doppler
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const boxW = Math.min(380, w - 32);
    const boxX = 16;
    const boxY = 14;
    const boxH = 66;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Efecto Doppler Acústico (Fuente Móvil vs = ${this.sourceSpeed} m/s)`, boxX + 12, boxY + 20);

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`Frecuencia al Acercarse: f' = ${fAhead.toFixed(1)} Hz`, boxX + 12, boxY + 38);
    ctx.fillStyle = '#f87171';
    ctx.fillText(`Frecuencia al Alejarse:   f' = ${fBehind.toFixed(1)} Hz`, boxX + 12, boxY + 54);
    ctx.restore();
  }

  setHarmonic(n) {
    this.harmonicN = Math.max(1, Math.min(10, n));
  }

  setMode(mode) {
    this.mode = mode;
    this.wavefronts = [];
  }
}

// ============================================================================
// SIMULADOR 3: POLARIZACIÓN TRANSVERSAL DEL ESPACIO-TIEMPO (h+ y hx)
// ============================================================================
class SpacetimePolarizationSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros físicos
    this.mode = 'plus';          // 'plus', 'cross', 'circular'
    this.strainA = 0.40;        // Amplitud de deformación fraccional
    this.freq = 0.8;            // Frecuencia en Hz
    this.showGrid = true;       // Malla elástica espaciotemporal
    this.showTidalVectors = true;// Vectores de aceleración de marea
    this.showParticles = true;  // Anillo de partículas de prueba
    this.showAxes = true;       // Ejes cuadrupolares

    // Estado de animación
    this.time = 0;
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.lastTime = performance.now();

    // Configuración de partículas
    this.particleCount = 20;    // Partículas libres en anillo de prueba
    this.gridLines = 14;        // Número de líneas en la cuadrícula

    this.initDPI();
    this.startLoop();
  }

  initDPI() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  setMode(mode) {
    this.mode = mode;
    this.render();
  }

  setStrain(val) {
    this.strainA = Math.max(0.05, Math.min(0.9, val));
    this.render();
  }

  setFreq(val) {
    this.freq = Math.max(0.1, Math.min(3.0, val));
    this.render();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.05, Math.min(4.0, multiplier));
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  reset() {
    this.time = 0;
    this.render();
  }

  startLoop() {
    const loop = (now) => {
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      if (this.isPlaying && dt > 0 && dt < 0.2) {
        this.time += dt * this.speedMultiplier;
      }

      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    if (!w || !h) return;

    // Fondo astrofísico profundo
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h));
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.32;
    const omega = 2 * Math.PI * this.freq;
    const phase = omega * this.time;

    // Cálculo de componentes de deformación del tensor métrico TT
    let hPlus = 0;
    let hCross = 0;

    if (this.mode === 'plus') {
      hPlus = this.strainA * Math.cos(phase);
      hCross = 0;
    } else if (this.mode === 'cross') {
      hPlus = 0;
      hCross = this.strainA * Math.cos(phase);
    } else if (this.mode === 'circular') {
      hPlus = this.strainA * Math.cos(phase);
      hCross = this.strainA * Math.sin(phase);
    }

    // Transformación métrica afín: (x0, y0) -> (x, y)
    const transformPoint = (x0, y0) => {
      // Ecuación geodésica linealizada en gauge TT:
      // x = x0 + 0.5 * (hPlus * x0 + hCross * y0)
      // y = y0 + 0.5 * (-hPlus * y0 + hCross * x0)
      const dx = 0.5 * (hPlus * x0 + hCross * y0);
      const dy = 0.5 * (-hPlus * y0 + hCross * x0);
      return { x: cx + x0 + dx, y: cy + y0 + dy, dx, dy };
    };

    // 1. DIBUJAR MALLA ESPACIOTEMPORAL DEFORMANTE
    if (this.showGrid) {
      ctx.lineWidth = 1;
      const extent = baseR * 1.55;
      const step = extent / 7;

      // Líneas horizontales deformadas
      for (let y0 = -extent; y0 <= extent; y0 += step) {
        ctx.beginPath();
        let isAxis = Math.abs(y0) < 0.1;
        ctx.strokeStyle = isAxis ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.14)';
        for (let x0 = -extent; x0 <= extent; x0 += 8) {
          const pt = transformPoint(x0, y0);
          if (x0 === -extent) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Líneas verticales deformadas
      for (let x0 = -extent; x0 <= extent; x0 += step) {
        ctx.beginPath();
        let isAxis = Math.abs(x0) < 0.1;
        ctx.strokeStyle = isAxis ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.14)';
        for (let y0 = -extent; y0 <= extent; y0 += 8) {
          const pt = transformPoint(x0, y0);
          if (y0 === -extent) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
    }

    // 2. CÍRCULO ORIGINAL EN REPOSO (LÍNEA DISCONTINUA DE REFERENCIA)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // 3. CURVA ELÍPTICA DEFORMADA DE LAS PARTÍCULAS
    ctx.beginPath();
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      const x0 = baseR * Math.cos(theta);
      const y0 = baseR * Math.sin(theta);
      const pt = transformPoint(x0, y0);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Relleno suave de la elipse
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.fill();

    // 4. EJES CUADRUPOLARES (ESTIRAMIENTO / COMPRESIÓN)
    if (this.showAxes) {
      ctx.save();
      ctx.lineWidth = 2;
      // Eje semimayor y semimenor instantáneo
      const ptRight = transformPoint(baseR, 0);
      const ptTop = transformPoint(0, -baseR);
      const ptLeft = transformPoint(-baseR, 0);
      const ptBottom = transformPoint(0, baseR);

      // Eje X
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
      ctx.beginPath();
      ctx.moveTo(ptLeft.x, ptLeft.y);
      ctx.lineTo(ptRight.x, ptRight.y);
      ctx.stroke();

      // Eje Y
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
      ctx.beginPath();
      ctx.moveTo(ptTop.x, ptTop.y);
      ctx.lineTo(ptBottom.x, ptBottom.y);
      ctx.stroke();
      ctx.restore();
    }

    // 5. PARTÍCULAS DE PRUEBA Y VECTORES DE FUERZA DE MAREA
    for (let i = 0; i < this.particleCount; i++) {
      const theta = (i / this.particleCount) * 2 * Math.PI;
      const x0 = baseR * Math.cos(theta);
      const y0 = baseR * Math.sin(theta);
      const pt = transformPoint(x0, y0);

      // Vectores de aceleración de marea: d2x/dt2 ~ -omega^2 * dx
      if (this.showTidalVectors) {
        const arrowScale = 1.35;
        const vx = pt.dx * arrowScale;
        const vy = pt.dy * arrowScale;
        const vLen = Math.hypot(vx, vy);

        if (vLen > 2) {
          ctx.strokeStyle = pt.dx * x0 + pt.dy * y0 > 0 ? '#34d399' : '#f87171'; // Verde expandiendo, rojo contrayendo
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x + vx, pt.y + vy);
          ctx.stroke();

          // Cabeza de flecha
          const headLen = 6;
          const angle = Math.atan2(vy, vx);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.moveTo(pt.x + vx, pt.y + vy);
          ctx.lineTo(pt.x + vx - headLen * Math.cos(angle - Math.PI / 6), pt.y + vy - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(pt.x + vx - headLen * Math.cos(angle + Math.PI / 6), pt.y + vy - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Partícula en sí (masa de prueba)
      if (this.showParticles) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 6. VECTOR DE PROPAGACIÓN SALIENDO DE LA PANTALLA (ONDA TRANSVERSAL ⊙)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('k⃗ (sale)', cx, cy + 28);
    ctx.restore();

    // 7. TELEMETRÍA EN VIVO SUPERPUESTA
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const boxW = Math.min(360, w - 24);
    const boxX = 12;
    const boxY = 12;
    const boxH = 64;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    const modeName = this.mode === 'plus' ? 'Polarización Cruzada h₊ (Plus)' : (this.mode === 'cross' ? 'Polarización en Aspa hₓ (Cross)' : 'Polarización Circular (h₊ + i hₓ)');
    ctx.fillText(`🌊 Onda Gravitacional Transversal: ${modeName}`, boxX + 10, boxY + 18);

    ctx.font = '600 10.5px "JetBrains Mono", monospace';
    const currentStrain = (this.mode === 'cross' ? hCross : hPlus) / this.strainA;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Strain Relativo h(t)/h₀: `, boxX + 10, boxY + 36);
    ctx.fillStyle = currentStrain >= 0 ? '#34d399' : '#f87171';
    ctx.fillText(`${(currentStrain >= 0 ? '+' : '')}${currentStrain.toFixed(3)}`, boxX + 182, boxY + 36);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Frecuencia: ${this.freq.toFixed(2)} Hz   |   Período: ${(1 / this.freq).toFixed(2)} s`, boxX + 10, boxY + 52);
    ctx.restore();
  }
}

// ============================================================================
// SIMULADOR 4: INTERFERÓMETRO LIGO & SEÑAL CHIRP (CON AUDIO GW150914)
// ============================================================================
class LigoInterferometerSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros astrofísicos del evento (Valores canónicos GW150914)
    this.m1 = 36;             // Masa solar M1 [M_sun]
    this.m2 = 29;             // Masa solar M2 [M_sun]
    this.distMpc = 410;       // Distancia en Megaparsecs
    this.armLengthKm = 4.0;   // Longitud nominal de los brazos [km]
    this.laserWavelengthNm = 1064; // Láser Nd:YAG infrarrojo [nm]

    // Estado del simulador
    this.simMode = 'chirp';   // 'chirp' (colisión binaria) o 'continuous' (onda constante)
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.time = 0;
    this.lastTime = performance.now();
    this.chirpCycleDuration = 6.0; // segundos por ciclo de simulación
    this.historyH = [];       // Historial de strain h(t) para oscilograma

    // Web Audio API sintetizador de Chirp
    this.audioCtx = null;
    this.isAudioPlaying = false;

    this.initDPI();
    this.startLoop();
  }

  initDPI() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.1, Math.min(3.0, multiplier));
  }

  setMasses(m1, m2) {
    this.m1 = Math.max(5, Math.min(80, m1));
    this.m2 = Math.max(5, Math.min(80, m2));
  }

  setDistance(dist) {
    this.distMpc = Math.max(50, Math.min(2000, dist));
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  reset() {
    this.time = 0;
    this.historyH = [];
  }

  // Reproducir sonido Chirp astronómico realista mediante Web Audio API
  playChirpAudio(onComplete) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const chirpDuration = 0.85; // Duración acústica del silbido en segundos

      // Oscilador de frecuencia creciente (Chirp sweep)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Rampa de frecuencia: de ~35 Hz a ~250 Hz (el merger de GW150914)
      osc.frequency.setValueAtTime(35, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + chirpDuration * 0.82);
      osc.frequency.exponentialRampToValueAtTime(140, now + chirpDuration); // Ringdown damping

      // Envolvente de volumen: sube gradualmente hasta el merger y cae drásticamente
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + chirpDuration * 0.78);
      gain.gain.linearRampToValueAtTime(0.35, now + chirpDuration * 0.82);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + chirpDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + chirpDuration);

      this.isAudioPlaying = true;
      setTimeout(() => {
        this.isAudioPlaying = false;
        if (onComplete) onComplete();
      }, chirpDuration * 1000);

    } catch (e) {
      console.warn("Web Audio API no soportado o bloqueado", e);
      if (onComplete) onComplete();
    }
  }

  startLoop() {
    const loop = (now) => {
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      if (this.isPlaying && dt > 0 && dt < 0.2) {
        this.time += dt * this.speedMultiplier;
      }

      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Cálculo analítico instantáneo del Chirp GW150914
  computeChirpAtTime(tRel) {
    // tRel varía de 0 a 1 dentro del ciclo
    const tMerger = 0.78; // Momento de la coalescencia en fracción de ciclo
    let strainNorm = 0;
    let freqInstant = 35;
    let stage = 'Inspiral';

    if (tRel < tMerger) {
      // Fase de aproximación en espiral (Inspiral)
      const tau = Math.max(0.005, tMerger - tRel);
      // Frecuencia crece como tau^(-3/8)
      freqInstant = Math.min(250, 35 * Math.pow(tMerger / tau, 0.45));
      // Amplitud crece como tau^(-1/4)
      const amp = Math.min(1.0, 0.15 * Math.pow(tMerger / tau, 0.40));
      // Integrando de fase angular
      const phase = 2 * Math.PI * (35 * tRel + 65 * Math.pow(tRel, 2.4));
      strainNorm = amp * Math.sin(phase);
      stage = 'Inspiral (Aproximación)';
    } else if (tRel < tMerger + 0.08) {
      // Fase de Fusión (Merger Peak)
      const frac = (tRel - tMerger) / 0.08;
      freqInstant = 250 - 40 * frac;
      const amp = 1.0 * (1 - frac * 0.4);
      strainNorm = amp * Math.sin(2 * Math.PI * 240 * tRel);
      stage = 'Merger (Fusión Máxima)';
    } else {
      // Fase de Relajación (Ringdown - Cuasinormal del agujero negro final)
      const frac = (tRel - (tMerger + 0.08)) / (1 - (tMerger + 0.08));
      freqInstant = 180;
      const decay = Math.exp(-frac * 7);
      strainNorm = 0.6 * decay * Math.sin(2 * Math.PI * 180 * tRel);
      stage = 'Ringdown (Amortiguamiento)';
    }

    return { strainNorm, freqInstant, stage };
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    if (!w || !h) return;

    // Fondo de laboratorio tecnológico
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Progreso normalizado del ciclo de simulación
    const tCycle = (this.time % this.chirpCycleDuration) / this.chirpCycleDuration;
    const { strainNorm, freqInstant, stage } = this.computeChirpAtTime(tCycle);

    // Escala del strain astronómico físico
    const chirpMassMsun = Math.pow(this.m1 * this.m2, 0.6) / Math.pow(this.m1 + this.m2, 0.2);
    const h0Physical = 1.0e-21 * (chirpMassMsun / 28) * (410 / this.distMpc);
    const hPhysical = h0Physical * strainNorm;
    // Deformación física de los brazos en attómetros: Delta L = h * L0
    const deltaLAttometers = (hPhysical * 4000) * 1e18; // 1e-18 m = 1 attómetro (am)

    // Guardar en buffer histórico para oscilograma
    this.historyH.push({ t: this.time, val: strainNorm, physical: hPhysical });
    if (this.historyH.length > 220) this.historyH.shift();

    // ========================================================================
    // GEOMETRÍA DEL INTERFERÓMETRO EN PANTALLA
    // ========================================================================
    const layoutW = w;
    const layoutH = h * 0.70; // Espacio superior para esquema, inferior para gráfica
    const ox = layoutW * 0.28; // Esquina del divisor de haz (vértice L)
    const oy = layoutH * 0.72;
    const armXLen = layoutW * 0.52;
    const armYLen = layoutH * 0.54;

    // Desplazamiento visual amplificado para que el usuario aprecie el movimiento
    const visualDisplacementScale = 14;
    const dispX = strainNorm * visualDisplacementScale;
    const dispY = -strainNorm * visualDisplacementScale;

    // 1. DIBUJAR LÁSER EMISOR
    const laserX = ox - layoutW * 0.18;
    const laserY = oy;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(laserX - 28, laserY - 14, 28, 28, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('LÁSER', laserX - 14, laserY - 1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText('1064nm', laserX - 14, laserY + 10);

    // Haz del láser entrando al divisor de haz
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Láser infrarrojo renderizado en rojo brillante
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(laserX, laserY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. DIVISOR DE HAZ (BEAM SPLITTER EN EL VÉRTICE A 45 GRADOS)
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-4, -18, 8, 36, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.font = '600 8.5px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Divisor 50/50', ox - 10, oy + 24);

    // 3. BRAZO X (HORIZONTAL - 4 KM)
    const endMirrorX = ox + armXLen + dispX;
    // Tubo de vacío
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + armXLen + 15, oy);
    ctx.stroke();

    // Haz láser brazo X (ida y vuelta)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(endMirrorX, oy);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Espejo final Brazo X (Masa de prueba suspendida)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(endMirrorX, oy - 16, 7, 32, 2);
    ctx.fill();
    ctx.stroke();

    // Hilos de suspensión pendular de sílice
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(endMirrorX + 3.5, oy - 28);
    ctx.lineTo(endMirrorX + 3.5, oy - 16);
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('Brazo X (4 km)', ox + armXLen * 0.35, oy - 10);
    ctx.fillStyle = dispX >= 0 ? '#34d399' : '#f87171';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText(`ΔLx = ${(dispX >= 0 ? '+' : '')}${(deltaLAttometers / 2).toFixed(2)} am`, endMirrorX - 10, oy + 26);

    // 4. BRAZO Y (VERTICAL - 4 KM)
    const endMirrorY = oy - armYLen + dispY;
    // Tubo de vacío
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy - armYLen - 15);
    ctx.stroke();

    // Haz láser brazo Y (ida y vuelta)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, endMirrorY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Espejo final Brazo Y (Masa de prueba)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ox - 16, endMirrorY - 7, 32, 7, 2);
    ctx.fill();
    ctx.stroke();

    // Hilo pendular
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, endMirrorY - 18);
    ctx.lineTo(ox, endMirrorY - 7);
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'right';
    ctx.fillText('Brazo Y (4 km)', ox - 14, oy - armYLen * 0.45);
    ctx.fillStyle = dispY >= 0 ? '#34d399' : '#f87171';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText(`ΔLy = ${(dispY >= 0 ? '+' : '')}${(-deltaLAttometers / 2).toFixed(2)} am`, ox + 22, endMirrorY + 4);

    // 5. FOTODETECTOR (PUERTO OSCURO RECOMBINADO)
    const pdX = ox;
    const pdY = oy + layoutH * 0.16;

    // Haz saliendo al fotodetector
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(pdX, pdY);
    ctx.stroke();

    // Caja del fotodetector
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pdX - 16, pdY, 32, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.fillText('SENSOR', pdX, pdY + 13);

    // 6. PATRÓN ÓPTICO DE FRANJAS DE INTERFERENCIA (VISTA AMPLIADA)
    const fringeBoxX = layoutW * 0.68;
    const fringeBoxY = 16;
    const fringeBoxSize = Math.min(84, layoutW * 0.22);

    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(fringeBoxX, fringeBoxY, fringeBoxSize, fringeBoxSize + 22, 6);
    ctx.fill();
    ctx.stroke();

    // Anillos concéntricos de interferencia oscilando según Delta L
    const fringeCenterX = fringeBoxX + fringeBoxSize / 2;
    const fringeCenterY = fringeBoxY + fringeBoxSize / 2;
    const fringePhase = Math.abs(strainNorm) * Math.PI * 3;

    for (let r = 4; r < fringeBoxSize * 0.44; r += 5) {
      const ringIntensity = 0.5 + 0.5 * Math.cos(r * 0.4 - fringePhase);
      ctx.strokeStyle = `rgba(239, 68, 68, ${ringIntensity.toFixed(2)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fringeCenterX, fringeCenterY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Franjas Ópticas', fringeCenterX, fringeBoxY + fringeBoxSize + 15);

    // ========================================================================
    // OSCILOGRAMA INFERIOR: FORMA DE ONDA CHIRP h(t)
    // ========================================================================
    const graphY = layoutH + 6;
    const graphH = h - graphY - 10;
    const graphW = w - 24;
    const graphX = 12;

    ctx.fillStyle = '#0b1120';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(graphX, graphY, graphW, graphH, 6);
    ctx.fill();
    ctx.stroke();

    // Línea base cero
    const zeroY = graphY + graphH / 2;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.moveTo(graphX, zeroY);
    ctx.lineTo(graphX + graphW, zeroY);
    ctx.stroke();

    // Trazar curva histórica de la señal Chirp
    if (this.historyH.length > 2) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const dxStep = graphW / 220;
      for (let i = 0; i < this.historyH.length; i++) {
        const px = graphX + i * dxStep;
        const py = zeroY - this.historyH[i].val * (graphH * 0.42);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Rotular gráfica
    ctx.font = '600 8.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('Señal de Onda Gravitacional GW150914: h(t)', graphX + 8, graphY + 12);
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`Frecuencia: ${freqInstant.toFixed(0)} Hz`, graphX + graphW - 8, graphY + 12);

    // ========================================================================
    // PANEL DE TELEMETRÍA EN VIVO SUPERPUESTO
    // ========================================================================
    ctx.save();
    ctx.textAlign = 'left';
    const infoX = 12;
    const infoY = 12;
    const infoW = Math.min(270, w * 0.45);
    const infoH = 68;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, infoW, infoH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('📡 Telemetría Interferométrica LIGO', infoX + 8, infoY + 16);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Fase: ', infoX + 8, infoY + 32);
    ctx.fillStyle = stage.includes('Merger') ? '#fbbf24' : (stage.includes('Inspiral') ? '#34d399' : '#a78bfa');
    ctx.fillText(stage, infoX + 44, infoY + 32);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ΔL (Brazos): ', infoX + 8, infoY + 48);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${deltaLAttometers.toFixed(2)} am (10⁻¹⁸ m)`, infoX + 86, infoY + 48);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`M₁ = ${this.m1} M☉ | M₂ = ${this.m2} M☉`, infoX + 8, infoY + 62);
    ctx.restore();
  }
}

// ============================================================================
// SIMULADOR 5: EFECTO DOPPLER ACÚSTICO, CONO DE MACH Y RELATIVISTA
// ============================================================================
class DopplerEffectSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros Físicos
    this.sourceSpeed = 120;       // vs [m/s]
    this.observerSpeed = 0;       // vo [m/s]
    this.soundSpeed = 340;        // v [m/s]
    this.sourceFreq = 2.0;        // f0 [Hz] (pulsos visuales por seg)
    this.audioBaseFreq = 440;     // Tono audible central [Hz]

    // Coordenadas espaciales (en px relativos al canvas)
    this.sourceX = 80;
    this.sourceY = 0;             // Desplazamiento vertical respecto a centerY
    this.observerX = 0;
    this.observerY = 0;
    this.observerInitialized = false;

    // Frentes de onda circulares emitidos
    this.wavefronts = [];
    this.lastWavefrontEmit = 0;

    // Cono de Mach y configuraciones
    this.showMachCone = true;
    this.showVectors = true;
    this.showOscilloscope = true;
    this.isDraggingObserver = false;
    this.isDraggingSource = false;

    // Audio Web Audio API
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isAudioActive = false;

    // Tiempo y animación
    this.time = 0;
    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.lastTime = performance.now();

    // Callbacks para UI exterior
    this.onTelemetryUpdate = null;

    this.initDPI();
    this.bindEvents();
    this.startLoop();
  }

  initDPI() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;

    if (!this.observerInitialized) {
      this.observerX = Math.min(rect.width * 0.82, rect.width - 60);
      this.observerY = 0;
      this.sourceX = rect.width * 0.15;
      this.sourceY = 0;
      this.observerInitialized = true;
    }
  }

  setSourceSpeed(v) {
    this.sourceSpeed = Math.max(0, Math.min(800, v));
  }

  setObserverSpeed(v) {
    this.observerSpeed = Math.max(-200, Math.min(200, v));
  }

  setSoundSpeed(c) {
    this.soundSpeed = Math.max(100, Math.min(600, c));
  }

  setSourceFreq(f0) {
    this.sourceFreq = Math.max(0.5, Math.min(5.0, f0));
  }

  setSpeed(mult) {
    this.speedMultiplier = Math.max(0.1, Math.min(3.0, mult));
  }

  toggleMachCone(show) {
    this.showMachCone = (show !== undefined) ? !!show : !this.showMachCone;
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.lastTime = performance.now();
    return this.isPlaying;
  }

  reset() {
    this.time = 0;
    this.wavefronts = [];
    this.lastWavefrontEmit = 0;
    this.sourceX = this.displayWidth * 0.12;
    this.sourceY = 0;
    this.observerX = Math.min(this.displayWidth * 0.82, this.displayWidth - 60);
    this.observerY = 0;
    this.lastTime = performance.now();
  }

  applyPreset(preset) {
    if (preset === 'ambulance') {
      this.sourceSpeed = 35;
      this.observerSpeed = 0;
      this.soundSpeed = 340;
      this.sourceFreq = 2.0;
      this.audioBaseFreq = 440;
    } else if (preset === 'racecar') {
      this.sourceSpeed = 95;
      this.observerSpeed = 0;
      this.soundSpeed = 340;
      this.sourceFreq = 2.4;
      this.audioBaseFreq = 520;
    } else if (preset === 'sonic') {
      this.sourceSpeed = 340;
      this.observerSpeed = 0;
      this.soundSpeed = 340;
      this.sourceFreq = 2.0;
      this.audioBaseFreq = 440;
    } else if (preset === 'supersonic') {
      this.sourceSpeed = 510; // Mach 1.5
      this.observerSpeed = 0;
      this.soundSpeed = 340;
      this.sourceFreq = 2.0;
      this.audioBaseFreq = 440;
    } else if (preset === 'observer_moving') {
      this.sourceSpeed = 0;
      this.observerSpeed = 60;
      this.soundSpeed = 340;
      this.sourceFreq = 2.0;
      this.audioBaseFreq = 440;
    } else if (preset === 'relativistic') {
      this.sourceSpeed = 240;
      this.observerSpeed = 0;
      this.soundSpeed = 340;
      this.sourceFreq = 2.2;
      this.audioBaseFreq = 440;
    }
  }

  toggleAudio(forceState) {
    const newState = (forceState !== undefined) ? !!forceState : !this.isAudioActive;
    if (newState) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        if (!this.oscillator) {
          this.oscillator = this.audioCtx.createOscillator();
          this.gainNode = this.audioCtx.createGain();
          this.oscillator.type = 'triangle';
          this.oscillator.frequency.setValueAtTime(this.audioBaseFreq, this.audioCtx.currentTime);
          this.gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
          this.oscillator.connect(this.gainNode);
          this.gainNode.connect(this.audioCtx.destination);
          this.oscillator.start();
        } else {
          this.gainNode.gain.setTargetAtTime(0.08, this.audioCtx.currentTime, 0.05);
        }
        this.isAudioActive = true;
      } catch (err) {
        console.warn('Web Audio error:', err);
        this.isAudioActive = false;
      }
    } else {
      if (this.gainNode && this.audioCtx) {
        this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      }
      this.isAudioActive = false;
    }
    return this.isAudioActive;
  }

  bindEvents() {
    const canvas = this.canvas;
    if (!canvas) return;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleDown = (e) => {
      const p = getPos(e);
      const centerY = this.displayHeight / 2;
      const obsRealY = centerY + this.observerY;
      const distObs = Math.hypot(p.x - this.observerX, p.y - obsRealY);
      if (distObs < 35) {
        this.isDraggingObserver = true;
        e.preventDefault();
      }
    };

    const handleMove = (e) => {
      if (!this.isDraggingObserver) return;
      const p = getPos(e);
      const centerY = this.displayHeight / 2;
      this.observerX = Math.max(30, Math.min(this.displayWidth - 30, p.x));
      this.observerY = Math.max(-centerY + 30, Math.min(centerY - 30, p.y - centerY));
      e.preventDefault();
    };

    const handleUp = () => {
      this.isDraggingObserver = false;
    };

    canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    canvas.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    window.addEventListener('resize', () => {
      this.initDPI();
    });
  }

  startLoop() {
    const loop = (now) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05) * this.speedMultiplier;

      if (this.isPlaying) {
        this.updateAndRender(dt);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateAndRender(dt) {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    const centerY = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Fondo espacial/radar de precisión científica
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, w, h);

    const scale = w / 700; // Escala metros -> píxeles (700m de campo visual)

    this.time += dt;

    // Actualizar posición de la fuente
    const vsPx = this.sourceSpeed * scale;
    this.sourceX += vsPx * dt;
    if (this.sourceX > w + 120) {
      this.sourceX = -60;
    }

    // Actualizar posición del observador si vo != 0
    if (this.observerSpeed !== 0 && !this.isDraggingObserver) {
      const voPx = this.observerSpeed * scale;
      this.observerX += voPx * dt;
      if (this.observerX > w - 20) this.observerX = 40;
      if (this.observerX < 20) this.observerX = w - 40;
    }

    // Emisión periódica de frentes de onda
    const emitInterval = 1 / Math.max(0.2, this.sourceFreq);
    if (this.time - this.lastWavefrontEmit >= emitInterval) {
      this.wavefronts.push({
        x: this.sourceX,
        y: centerY + this.sourceY,
        r: 0,
        age: 0,
        tEmit: this.time
      });
      this.lastWavefrontEmit = this.time;
    }

    // Expandir frentes de onda a velocidad v (soundSpeed)
    const vPx = this.soundSpeed * scale;
    const maxR = Math.hypot(w, h) * 1.5;

    for (let i = this.wavefronts.length - 1; i >= 0; i--) {
      const wf = this.wavefronts[i];
      wf.r += vPx * dt;
      wf.age += dt;

      if (wf.r > maxR) {
        this.wavefronts.splice(i, 1);
      }
    }

    // Cálculo Doppler en 2D exacto respecto al observador
    const obsRealY = centerY + this.observerY;
    const srcRealY = centerY + this.sourceY;
    const dx = this.observerX - this.sourceX;
    const dy = obsRealY - srcRealY;
    const distPx = Math.hypot(dx, dy);
    const distMeters = distPx / Math.max(0.1, scale);

    // Vector unitario de la fuente hacia el observador
    const ux = distPx > 0.001 ? (dx / distPx) : 1;
    const uy = distPx > 0.001 ? (dy / distPx) : 0;

    // Proyecciones radiales de velocidad
    const vSourceRadial = this.sourceSpeed * ux;       // positivo si fuente avanza hacia observador
    const vObserverRadial = -this.observerSpeed * ux;   // positivo si observador avanza hacia fuente

    const v = this.soundSpeed;
    const denom = v - vSourceRadial;
    let fObserved = this.sourceFreq;

    if (denom <= 5) {
      // Régimen sónico / onda de choque frontal: frecuencia divergente o pico acústico
      fObserved = this.sourceFreq * 8.0;
    } else {
      fObserved = this.sourceFreq * ((v + vObserverRadial) / denom);
    }
    fObserved = Math.max(0.1, Math.min(100, fObserved));

    // Cálculos 1D teóricos para adelante y atrás
    const fAhead = this.sourceSpeed < v ? this.sourceFreq * (v / (v - this.sourceSpeed)) : Infinity;
    const fBehind = this.sourceFreq * (v / (v + this.sourceSpeed));
    const lambdaAhead = (v - Math.min(v, this.sourceSpeed)) / this.sourceFreq;
    const lambdaBehind = (v + this.sourceSpeed) / this.sourceFreq;
    const machNumber = this.sourceSpeed / v;
    const machAngleRad = machNumber >= 1.0 ? Math.asin(1.0 / machNumber) : 0;
    const machAngleDeg = machAngleRad * (180 / Math.PI);

    // Audio Doppler en tiempo real si está activo
    if (this.isAudioActive && this.oscillator && this.gainNode && this.audioCtx) {
      const ratio = fObserved / this.sourceFreq;
      const targetAudioFreq = Math.max(65, Math.min(2200, this.audioBaseFreq * ratio));
      this.oscillator.frequency.setTargetAtTime(targetAudioFreq, this.audioCtx.currentTime, 0.04);

      // Atenuación por distancia inversa
      const gain = Math.max(0.01, Math.min(0.22, 0.16 * (100 / (distMeters + 60))));
      this.gainNode.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.04);
    }

    // Dibujar elementos en el canvas
    this.drawGrid(ctx, w, h, centerY);
    this.drawWavefronts(ctx, w, h, centerY, scale);

    if (this.showMachCone && machNumber >= 1.0) {
      this.drawMachCone(ctx, w, h, srcRealY, machNumber, machAngleRad, scale);
    }

    this.drawSource(ctx, srcRealY, scale, machNumber);
    this.drawObserver(ctx, obsRealY, scale, distMeters, fObserved);

    if (this.showOscilloscope) {
      const oscW = Math.min(170, w * 0.3);
      const oscH = 58;
      this.drawOscilloscope(ctx, w - oscW - 14, h - oscH - 12, oscW, oscH, fObserved, this.time);
    }

    this.drawTelemetryHUD(ctx, w, h, fObserved, fAhead, fBehind, lambdaAhead, lambdaBehind, machNumber, machAngleDeg);

    // Notificar a observadores UI
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        fObserved,
        fAhead,
        fBehind,
        lambdaAhead,
        lambdaBehind,
        machNumber,
        machAngleDeg,
        sourceSpeed: this.sourceSpeed,
        observerSpeed: this.observerSpeed,
        soundSpeed: this.soundSpeed,
        sourceFreq: this.sourceFreq,
        distMeters
      });
    }
  }

  drawGrid(ctx, w, h, centerY) {
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 1;

    // Líneas de grilla espaciadas cada 50px
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Eje horizontal de propagación principal
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawWavefronts(ctx, w, h, centerY, scale) {
    ctx.save();
    const len = this.wavefronts.length;

    for (let i = 0; i < len; i++) {
      const wf = this.wavefronts[i];
      const alpha = Math.max(0, 1 - (wf.r / (w * 1.1)));
      if (alpha <= 0.02) continue;

      // Color dependiente del Doppler: azul/cian adelante (compresión), rojo/ámbar atrás (dilatación)
      const isAhead = (wf.x < this.sourceX);
      const strokeColor = isAhead 
        ? `rgba(244, 63, 94, ${alpha * 0.75})`   // Atrás: rojo dilatado
        : `rgba(56, 189, 248, ${alpha * 0.85})`;  // Adelante: azul comprimido

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(1.2, 2.2 * alpha);
      ctx.beginPath();
      ctx.arc(wf.x, wf.y, wf.r, 0, Math.PI * 2);
      ctx.stroke();

      // Centro emisor de ese frente histórico (pequeño punto en el pasado)
      if (i % 3 === 0 && wf.r < 180) {
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(wf.x, wf.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawMachCone(ctx, w, h, srcRealY, mach, machAngleRad, scale) {
    ctx.save();
    const sx = this.sourceX;
    const sy = srcRealY;

    // Longitud de las líneas tangentes hacia atrás
    const lineLen = Math.max(w, h) * 1.5;
    const angle1 = Math.PI - machAngleRad;
    const angle2 = Math.PI + machAngleRad;

    const x1 = sx + Math.cos(angle1) * lineLen;
    const y1 = sy + Math.sin(angle1) * lineLen;
    const x2 = sx + Math.cos(angle2) * lineLen;
    const y2 = sy + Math.sin(angle2) * lineLen;

    // Región interior del Cono de Choque sombreada
    const grad = ctx.createRadialGradient(sx, sy, 10, sx - 200, sy, lineLen);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.03)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();

    // Líneas envolventes tangentes (Onda de choque / Sonic Boom)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.setLineDash([8, 4]);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(x1, y1);
    ctx.moveTo(sx, sy);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Arco y etiqueta de ángulo de Mach θ_M
    const arcR = 48;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, arcR, angle1, angle2, false);
    ctx.stroke();

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'right';
    const deg = (machAngleRad * 180 / Math.PI).toFixed(1);
    ctx.fillText(`2θ_M = ${(deg * 2).toFixed(1)}°`, sx - arcR - 8, sy - 6);

    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText('ONDA DE CHOQUE (CONO DE MACH)', sx - 220, sy - 28);

    ctx.restore();
  }

  drawSource(ctx, srcRealY, scale, mach) {
    ctx.save();
    const sx = this.sourceX;
    const sy = srcRealY;

    // Resplandor de la fuente
    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, 24);
    glow.addColorStop(0, mach >= 1.0 ? 'rgba(244, 63, 94, 0.95)' : 'rgba(56, 189, 248, 0.95)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 24, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo de la fuente emisora
    ctx.fillStyle = mach >= 1.0 ? '#f43f5e' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flecha de vector de velocidad de la fuente
    if (this.showVectors && this.sourceSpeed > 0) {
      const arrowLen = Math.min(65, (this.sourceSpeed / 340) * 50 + 15);
      ctx.strokeStyle = mach >= 1.0 ? '#fb7185' : '#38bdf8';
      ctx.fillStyle = mach >= 1.0 ? '#fb7185' : '#38bdf8';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + arrowLen, sy);
      ctx.stroke();

      // Cabeza de flecha
      ctx.beginPath();
      ctx.moveTo(sx + arrowLen, sy);
      ctx.lineTo(sx + arrowLen - 7, sy - 4);
      ctx.lineTo(sx + arrowLen - 7, sy + 4);
      ctx.closePath();
      ctx.fill();

      // Etiqueta
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(`vs = ${this.sourceSpeed.toFixed(0)} m/s`, sx + 8, sy - 14);
    }

    // Etiqueta de la Fuente
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('Fuente Emisora', sx, sy + 22);

    ctx.restore();
  }

  drawObserver(ctx, obsRealY, scale, distMeters, fObserved) {
    ctx.save();
    const ox = this.observerX;
    const oy = obsRealY;

    // Aura receptora
    const aura = ctx.createRadialGradient(ox, oy, 4, ox, oy, 26);
    aura.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
    aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(ox, oy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo del observador
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(ox, oy, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Ondas concéntricas de detección si hay drag o impacto
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Vector de velocidad del observador si vo != 0
    if (this.showVectors && this.observerSpeed !== 0) {
      const voArrowLen = (this.observerSpeed / 100) * 35;
      ctx.strokeStyle = '#34d399';
      ctx.fillStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + voArrowLen, oy);
      ctx.stroke();

      ctx.beginPath();
      const sign = Math.sign(voArrowLen) || 1;
      ctx.moveTo(ox + voArrowLen, oy);
      ctx.lineTo(ox + voArrowLen - 6 * sign, oy - 3);
      ctx.lineTo(ox + voArrowLen - 6 * sign, oy + 3);
      ctx.closePath();
      ctx.fill();
    }

    // Línea de mira y distancia
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(this.sourceX, this.displayHeight / 2 + this.sourceY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etiqueta del Observador
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText('Observador (Receptor)', ox, oy - 20);

    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`d = ${distMeters.toFixed(1)} m`, ox, oy + 22);

    ctx.restore();
  }

  drawOscilloscope(ctx, x, y, w, h, fObserved, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Rejilla del osciloscopio
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();

    // Traza de la onda sinusoidal recibida
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    const midY = y + h / 2;
    const amp = (h / 2) * 0.65;
    const freqFactor = Math.max(0.2, Math.min(6, fObserved));

    for (let px = 0; px <= w; px++) {
      const theta = (px / w) * Math.PI * 4 * freqFactor - t * freqFactor * 8;
      const py = midY - Math.sin(theta) * amp;
      if (px === 0) ctx.moveTo(x + px, py);
      else ctx.lineTo(x + px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Etiquetas del osciloscopio
    ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('OSCILOSCOPIO', x + 6, y + 11);
    ctx.fillStyle = '#34d399';
    ctx.fillText(`f' = ${fObserved.toFixed(1)} Hz`, x + 6, y + h - 5);
    ctx.restore();
  }

  drawTelemetryHUD(ctx, w, h, fObserved, fAhead, fBehind, lambdaAhead, lambdaBehind, mach, machAngleDeg) {
    ctx.save();
    const boxX = 14;
    const boxY = 12;
    const boxW = Math.min(320, w - 28);
    const boxH = 78;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Título y estado de régimen
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Telemetría Doppler en Tiempo Real', boxX + 10, boxY + 18);

    // Badge régimen
    let regimeText = 'SUBSÓNICO (M < 1)';
    let regimeColor = '#34d399';
    if (Math.abs(mach - 1.0) < 0.05) {
      regimeText = 'BARRERA SÓNICA (M ≈ 1)';
      regimeColor = '#fbbf24';
    } else if (mach > 1.05) {
      regimeText = `SUPERSÓNICO (M = ${mach.toFixed(2)})`;
      regimeColor = '#f43f5e';
    }

    ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = regimeColor;
    ctx.textAlign = 'right';
    ctx.fillText(regimeText, boxX + boxW - 10, boxY + 18);

    ctx.textAlign = 'left';
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#cbd5e1';

    // Fila 1: Frecuencia instantánea y ratio
    ctx.fillText(`f' percibida: `, boxX + 10, boxY + 36);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(`${fObserved.toFixed(1)} Hz`, boxX + 95, boxY + 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText(`(f₀ = ${this.sourceFreq.toFixed(1)} Hz)`, boxX + 160, boxY + 36);

    // Fila 2: Longitudes de onda adelante y atrás
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`λ' comp.: `, boxX + 10, boxY + 53);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${lambdaAhead < 1000 ? lambdaAhead.toFixed(1) + ' m' : '0.0 m'}`, boxX + 75, boxY + 53);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`| λ' dilat.: `, boxX + 138, boxY + 53);
    ctx.fillStyle = '#f87171';
    ctx.fillText(`${lambdaBehind.toFixed(1)} m`, boxX + 215, boxY + 53);

    // Fila 3: Mach y velocidad
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`vs = ${this.sourceSpeed.toFixed(0)} m/s | v = ${this.soundSpeed.toFixed(0)} m/s`, boxX + 10, boxY + 70);

    ctx.restore();
  }
}

window.TautStringSimulator = TautStringSimulator;
window.StandingWaveAndDopplerSimulator = StandingWaveAndDopplerSimulator;
window.DopplerEffectSimulator = DopplerEffectSimulator;
window.SpacetimePolarizationSimulator = SpacetimePolarizationSimulator;
window.LigoInterferometerSimulator = LigoInterferometerSimulator;


