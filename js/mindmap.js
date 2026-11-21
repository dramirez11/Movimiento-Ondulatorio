/**
 * Mapa Mental Interactivo y Dinámico (Movimiento Ondulatorio)
 * Cuaderno Digital de Física III - Movimiento Ondulatorio
 * Universidad Tecnológica de Pereira (UTP)
 * Autores: David Alejandro Ramirez Bolaños, Steven Vélez Garces, Sergio Andrés Velásquez Arana
 */

class InteractiveMindMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialPinchDistance = null;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div style="position:absolute; top:12px; right:12px; z-index:20; display:flex; gap:6px;">
        <button id="mmZoomIn" class="ggb-btn" title="Zoom In" aria-label="Aumentar Zoom"><i class="fa-solid fa-plus"></i></button>
        <button id="mmZoomOut" class="ggb-btn" title="Zoom Out" aria-label="Disminuir Zoom"><i class="fa-solid fa-minus"></i></button>
        <button id="mmReset" class="ggb-btn" title="Restablecer" aria-label="Restablecer Vista"><i class="fa-solid fa-arrows-rotate"></i></button>
      </div>
      <svg id="mindmapSvg" viewBox="0 0 1300 700" preserveAspectRatio="xMidYMid meet" style="touch-action: none; width: 100%; height: 100%;">
        <defs>
          <!-- Gradientes modernos para nodos principales -->
          <linearGradient id="gradCentral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <linearGradient id="gradCinematica" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0369a1"/>
            <stop offset="100%" stop-color="#0ea5e9"/>
          </linearGradient>
          <linearGradient id="gradDinamica" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4338ca"/>
            <stop offset="100%" stop-color="#6366f1"/>
          </linearGradient>
          <linearGradient id="gradEnergia" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#10b981"/>
          </linearGradient>
          <linearGradient id="gradFenomenos" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
          <linearGradient id="gradSI" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#be185d"/>
            <stop offset="100%" stop-color="#f43f5e"/>
          </linearGradient>
          <filter id="nodeShadow" x="-15%" y="-15%" width="135%" height="135%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.2"/>
          </filter>
          <filter id="leafShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
          </filter>
        </defs>

        <g id="mmWorldGroup">
          <!-- ===============================================================
               CONECTORES BÉZIER CURVOS (Espaciado amplio y nítido)
               =============================================================== -->
          <!-- Centro (650, 350) -> Rama 1 Cinemática (465, 164) -->
          <path d="M 530 325 C 470 290, 465 220, 465 188" fill="none" stroke="#0ea5e9" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M 380 164 C 335 164, 335 70, 290 70" fill="none" stroke="#7dd3fc" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 380 164 L 290 164" fill="none" stroke="#7dd3fc" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 380 164 C 335 164, 335 258, 290 258" fill="none" stroke="#7dd3fc" stroke-width="2.4" stroke-linecap="round"/>

          <!-- Centro (650, 350) -> Rama 2 Dinámica (465, 536) -->
          <path d="M 530 375 C 470 410, 465 480, 465 512" fill="none" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M 380 536 C 335 536, 335 480, 290 480" fill="none" stroke="#a5b4fc" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 380 536 L 290 536" fill="none" stroke="#a5b4fc" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 380 536 C 335 536, 335 592, 290 592" fill="none" stroke="#a5b4fc" stroke-width="2.4" stroke-linecap="round"/>

          <!-- Centro (650, 350) -> Rama 3 Energía (835, 164) -->
          <path d="M 770 325 C 830 290, 835 220, 835 188" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M 920 164 C 965 164, 965 70, 1010 70" fill="none" stroke="#6ee7b7" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 920 164 L 1010 164" fill="none" stroke="#6ee7b7" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 920 164 C 965 164, 965 258, 1010 258" fill="none" stroke="#6ee7b7" stroke-width="2.4" stroke-linecap="round"/>

          <!-- Centro (650, 350) -> Rama 4 Fenómenos (835, 536) -->
          <path d="M 770 375 C 830 410, 835 480, 835 512" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M 920 536 C 965 536, 965 480, 1010 480" fill="none" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 920 536 L 1010 536" fill="none" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 920 536 C 965 536, 965 592, 1010 592" fill="none" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round"/>

          <!-- Centro (650, 350) -> Rama Superior: Unidades SI (650, 60) -->
          <path d="M 650 312 L 650 82" fill="none" stroke="#f43f5e" stroke-width="3.5" stroke-linecap="round"/>

          <!-- ===============================================================
               NODO CENTRAL: MOVIMIENTO ONDULATORIO
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node" style="cursor:pointer;">
            <rect x="520" y="312" width="260" height="76" rx="16" fill="url(#gradCentral)"/>
            <text x="650" y="344" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="800" font-family="Inter, sans-serif" letter-spacing="0.5">MOVIMIENTO ONDULATORIO</text>
            <text x="650" y="368" text-anchor="middle" fill="#7dd3fc" font-size="13" font-weight="700" font-family="Inter, sans-serif">FÍSICA III • ONDAS MECÁNICAS</text>
          </g>

          <!-- ===============================================================
               RAMA 1: CINEMÁTICA ONDULATORIA
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node">
            <rect x="360" y="140" width="210" height="48" rx="12" fill="url(#gradCinematica)"/>
            <text x="465" y="170" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="Inter, sans-serif">1. CINEMÁTICA</text>
          </g>
          <g filter="url(#leafShadow)">
            <rect x="30" y="50" width="260" height="40" rx="10" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.8"/>
            <text x="160" y="75" text-anchor="middle" fill="#0369a1" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">y(x,t) = A·sen(kx ∓ ωt + φ)</text>

            <rect x="30" y="144" width="260" height="40" rx="10" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.8"/>
            <text x="160" y="169" text-anchor="middle" fill="#0369a1" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">v = λ·f = ω/k, k = 2π/λ</text>

            <rect x="30" y="238" width="260" height="40" rx="10" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.8"/>
            <text x="160" y="263" text-anchor="middle" fill="#0369a1" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">vy = ∂y/∂t,  ay = ∂²y/∂t²</text>
          </g>

          <!-- ===============================================================
               RAMA 2: DINÁMICA & MEDIOS
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node">
            <rect x="360" y="512" width="210" height="48" rx="12" fill="url(#gradDinamica)"/>
            <text x="465" y="542" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="Inter, sans-serif">2. DINÁMICA & MEDIOS</text>
          </g>
          <g filter="url(#leafShadow)">
            <rect x="30" y="460" width="260" height="40" rx="10" fill="#f5f3ff" stroke="#6366f1" stroke-width="1.8"/>
            <text x="160" y="485" text-anchor="middle" fill="#4338ca" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">∂²y/∂x² = (1/v²)·∂²y/∂t²</text>

            <rect x="30" y="516" width="260" height="40" rx="10" fill="#f5f3ff" stroke="#6366f1" stroke-width="1.8"/>
            <text x="160" y="541" text-anchor="middle" fill="#4338ca" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">Cuerda Tensa: v = √(Ts/μ)</text>

            <rect x="30" y="572" width="260" height="40" rx="10" fill="#f5f3ff" stroke="#6366f1" stroke-width="1.8"/>
            <text x="160" y="597" text-anchor="middle" fill="#4338ca" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">Sonido: v = √(B/ρ) = √(γRT/M)</text>
          </g>

          <!-- ===============================================================
               RAMA 3: ENERGÍA E INTENSIDAD
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node">
            <rect x="730" y="140" width="210" height="48" rx="12" fill="url(#gradEnergia)"/>
            <text x="835" y="170" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="Inter, sans-serif">3. ENERGÍA E INTENSIDAD</text>
          </g>
          <g filter="url(#leafShadow)">
            <rect x="1010" y="50" width="260" height="40" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.8"/>
            <text x="1140" y="75" text-anchor="middle" fill="#065f46" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">Potencia: Pmed = ½μvω²A²</text>

            <rect x="1010" y="144" width="260" height="40" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.8"/>
            <text x="1140" y="169" text-anchor="middle" fill="#065f46" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">Intensidad: I = P/(4πr²)</text>

            <rect x="1010" y="238" width="260" height="40" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.8"/>
            <text x="1140" y="263" text-anchor="middle" fill="#065f46" font-size="12" font-weight="600" font-family="'JetBrains Mono', monospace">Decibelios: β = 10·log(I/I₀)</text>
          </g>

          <!-- ===============================================================
               RAMA 4: FENÓMENOS ONDULATORIOS
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node">
            <rect x="730" y="512" width="210" height="48" rx="12" fill="url(#gradFenomenos)"/>
            <text x="835" y="542" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="Inter, sans-serif">4. FENÓMENOS</text>
          </g>
          <g filter="url(#leafShadow)">
            <rect x="1010" y="460" width="260" height="40" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
            <text x="1140" y="485" text-anchor="middle" fill="#92400e" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">Interferencia: y1 + y2</text>

            <rect x="1010" y="516" width="260" height="40" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
            <text x="1140" y="541" text-anchor="middle" fill="#92400e" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">Estacionarias: fn = n·(v/2L)</text>

            <rect x="1010" y="572" width="260" height="40" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
            <text x="1140" y="597" text-anchor="middle" fill="#92400e" font-size="12" font-weight="700" font-family="'JetBrains Mono', monospace">Doppler: f' = f·(v±vO)/(v∓vS)</text>
          </g>

          <!-- Centro (650, 350) -> Rama Inferior: Ondas Gravitacionales & LIGO (650, 660) -->
          <path d="M 650 388 L 650 636" fill="none" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
          <path d="M 510 658 C 450 658, 450 658, 380 658" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M 790 658 C 850 658, 850 658, 920 658" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"/>

          <!-- ===============================================================
               RAMA 5: UNIDADES SI
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node">
            <rect x="490" y="38" width="320" height="44" rx="12" fill="url(#gradSI)"/>
            <text x="650" y="65" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700" font-family="Inter, sans-serif">UNIDADES SI: m, Hz, rad/m, kg/m, W, W/m², dB</text>
          </g>

          <!-- ===============================================================
               RAMA 6: ONDAS GRAVITACIONALES & PROYECTO LIGO
               =============================================================== -->
          <g filter="url(#nodeShadow)" class="mm-node">
            <rect x="500" y="636" width="300" height="44" rx="12" fill="url(#gradFenomenos)"/>
            <text x="650" y="663" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="800" font-family="Inter, sans-serif">5. GRAVITACIONALES & LIGO</text>
          </g>
          <g filter="url(#leafShadow)">
            <rect x="120" y="638" width="260" height="40" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
            <text x="250" y="663" text-anchor="middle" fill="#92400e" font-size="11.5" font-weight="700" font-family="'JetBrains Mono', monospace">Gauge TT: Modos h₊ y hₓ</text>

            <rect x="920" y="638" width="260" height="40" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
            <text x="1050" y="663" text-anchor="middle" fill="#92400e" font-size="11.5" font-weight="700" font-family="'JetBrains Mono', monospace">LIGO: ΔL ~ 10⁻¹⁸m (GW150914)</text>
          </g>
        </g>
      </svg>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const svg = document.getElementById('mindmapSvg');
    const world = document.getElementById('mmWorldGroup');
    const btnIn = document.getElementById('mmZoomIn');
    const btnOut = document.getElementById('mmZoomOut');
    const btnReset = document.getElementById('mmReset');

    const updateTransform = () => {
      world?.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.scale})`);
    };

    btnIn?.addEventListener('click', () => {
      this.scale = Math.min(2.5, this.scale * 1.2);
      updateTransform();
    });

    btnOut?.addEventListener('click', () => {
      this.scale = Math.max(0.6, this.scale * 0.85);
      updateTransform();
    });

    btnReset?.addEventListener('click', () => {
      this.scale = 1;
      this.panX = 0;
      this.panY = 0;
      updateTransform();
    });

    // Soporte Ratón
    svg?.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      if (svg) svg.style.cursor = 'grab';
    });

    // Soporte Táctil
    svg?.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDistance = Math.hypot(dx, dy);
      }
    }, { passive: true });

    svg?.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.panX = e.touches[0].clientX - this.startX;
        this.panY = e.touches[0].clientY - this.startY;
        updateTransform();
      } else if (e.touches.length === 2 && this.initialPinchDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / this.initialPinchDistance;
        this.scale = Math.max(0.6, Math.min(2.5, this.scale * (1 + (factor - 1) * 0.1)));
        this.initialPinchDistance = dist;
        updateTransform();
      }
    }, { passive: true });

    const onTouchEnd = () => {
      this.isDragging = false;
      this.initialPinchDistance = null;
    };

    svg?.addEventListener('touchend', onTouchEnd, { passive: true });
    svg?.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }
}

window.InteractiveMindMap = InteractiveMindMap;
