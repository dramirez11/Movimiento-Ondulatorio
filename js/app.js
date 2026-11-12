/**
 * Orquestador Principal del Cuaderno Digital de Física III
 * Módulo: Movimiento Ondulatorio
 * Modo Doble Página (Libro Abierto: Izquierda y Derecha)
 * Universidad Tecnológica de Pereira (UTP)
 * Autores: David Alejandro Ramirez Bolaños, Steven Vélez Garces, Sergio Andrés Velásquez Arana
 */

document.addEventListener('DOMContentLoaded', () => {
  const totalPages = 20;
  const totalSpreads = 11; // Spread 0 (Portada), 1 (2-3), 2 (4-5), 3 (6-7), 4 (8-9), 5 (10-11), 6 (12-13), 7 (14-15), 8 (16-17), 9 (18-19), 10 (20)

  const pageShortTitles = [
    "Portada Oficial",
    "Índice General",
    "Mapa Mental",
    "Línea de Tiempo",
    "Conceptos y SI",
    "Demostraciones",
    "Plano GeoGebra",
    "Onda en Cuerda Tensa",
    "Modos Normales & Estacionarias",
    "Efecto Doppler Teórico",
    "Simulador Efecto Doppler",
    "Comparativa 3D Transversal",
    "Polarización Espacio-Tiempo",
    "Proyecto LIGO & Detección",
    "Laboratorio LIGO & Chirp",
    "Problemas Resueltos",
    "Taller Interactivo",
    "Glosario Científico",
    "Referencias APA 7",
    "Contraportada"
  ];

  function checkDefaultSpreadMode() {
    const isPortrait = window.innerHeight > window.innerWidth;
    return window.innerWidth >= 960 && !isPortrait;
  }

  let isSpreadMode = checkDefaultSpreadMode();
  let currentSpread = 0; // 0 = Portada, 1 = 2-3, 2 = 4-5, etc.
  let currentPageSingle = 1;

  const audio = new PageTurnAudio();
  let ggbEngine = null;
  let tautStringSim = null;
  let standingSim = null;
  let dopplerSim = null;
  let modalDopplerSim = null;
  let spacetimeSim = null;
  let ligoSim = null;
  let mindMapEngine = null;
  let exerciseEngine = null;

  // Elementos UI
  const wrapper = document.getElementById('notebookWrapper');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  const btnHome = document.getElementById('btnHome');
  const pageDropdown = document.getElementById('pageSelect');
  const pageCounterText = document.getElementById('pageCounterText');
  const btnSound = document.getElementById('btnToggleSound');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnToggleSpread = document.getElementById('btnToggleSpreadMode');
  const lblSpreadMode = document.getElementById('lblSpreadMode');

  const spreadDefinitions = [
    { spread: 0, pages: [1], label: "Portada Oficial" },
    { spread: 1, pages: [2, 3], label: "Págs. 2-3: Índice y Mapa Mental" },
    { spread: 2, pages: [4, 5], label: "Págs. 4-5: Historia, Conceptos y Unidades SI" },
    { spread: 3, pages: [6, 7], label: "Págs. 6-7: Demostraciones y Plano GeoGebra" },
    { spread: 4, pages: [8, 9], label: "Págs. 8-9: Cuerda Tensa y Ondas Estacionarias" },
    { spread: 5, pages: [10, 11], label: "Págs. 10-11: Efecto Doppler & Simulador Interactivo" },
    { spread: 6, pages: [12, 13], label: "Págs. 12-13: Comparativa 3D & Polarización Espaciotemporal" },
    { spread: 7, pages: [14, 15], label: "Págs. 14-15: Proyecto LIGO & Laboratorio Interferométrico" },
    { spread: 8, pages: [16, 17], label: "Págs. 16-17: Problemas y Taller Interactivo" },
    { spread: 9, pages: [18, 19], label: "Págs. 18-19: Glosario y Referencias APA 7" },
    { spread: 10, pages: [20], label: "Pág. 20: Contraportada" }
  ];

  function populateDropdown() {
    if (!pageDropdown) return;
    pageDropdown.innerHTML = '';

    if (isSpreadMode) {
      spreadDefinitions.forEach(def => {
        const opt = document.createElement('option');
        opt.value = def.spread;
        opt.textContent = def.label;
        pageDropdown.appendChild(opt);
      });
      pageDropdown.value = currentSpread;
    } else {
      for (let i = 1; i <= totalPages; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Pág. ${i}: ${pageShortTitles[i - 1] || ''}`;
        pageDropdown.appendChild(opt);
      }
      pageDropdown.value = currentPageSingle;
    }
  }

  pageDropdown?.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    if (isSpreadMode) {
      goToSpread(val);
    } else {
      goToPageSingle(val);
    }
  });

  // Navegación en Modo Doble Página
  function goToSpread(spreadIdx) {
    if (spreadIdx < 0 || spreadIdx >= totalSpreads) return;
    audio.play();

    const isForward = spreadIdx >= currentSpread;
    const animClass = isForward ? 'page-anim-forward' : 'page-anim-backward';
    currentSpread = spreadIdx;

    document.querySelectorAll('.notebook-page').forEach(page => {
      page.classList.remove('active', 'page-left', 'page-right', 'page-anim-forward', 'page-anim-backward', 'page-anim-single-forward', 'page-anim-single-backward');
    });

    const def = spreadDefinitions[spreadIdx];
    if (def && def.pages.length === 1) {
      wrapper?.classList.add('is-cover');
      const singlePageNum = def.pages[0];
      const singlePage = document.querySelector(`.notebook-page[data-page="${singlePageNum}"]`);
      if (singlePage) {
        singlePage.scrollTop = 0;
        singlePage.classList.add('active', isForward ? 'page-anim-single-forward' : 'page-anim-single-backward');
      }

      if (pageCounterText) {
        pageCounterText.textContent = (singlePageNum === 1) ? "Portada (Pág. 1)" : `Pág. ${singlePageNum}: Contraportada`;
      }
      onPageActivated(singlePageNum);
    } else {
      wrapper?.classList.remove('is-cover');
      const leftPageNum = def ? def.pages[0] : (spreadIdx * 2);
      const rightPageNum = def ? def.pages[1] : (spreadIdx * 2 + 1);

      const leftPage = document.querySelector(`.notebook-page[data-page="${leftPageNum}"]`);
      const rightPage = document.querySelector(`.notebook-page[data-page="${rightPageNum}"]`);

      if (leftPage) {
        leftPage.scrollTop = 0;
        leftPage.classList.add('active', 'page-left', animClass);
        onPageActivated(leftPageNum);
      }
      if (rightPage) {
        rightPage.scrollTop = 0;
        rightPage.classList.add('active', 'page-right', animClass);
        onPageActivated(rightPageNum);
      }

      if (pageCounterText) {
        pageCounterText.textContent = `Págs. ${leftPageNum} - ${rightPageNum} de ${totalPages}`;
      }
    }

    if (btnPrev) btnPrev.disabled = (currentSpread === 0);
    if (btnNext) btnNext.disabled = (currentSpread === totalSpreads - 1);
    if (pageDropdown) pageDropdown.value = currentSpread;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Navegación en Modo Página Simple
  function goToPageSingle(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;
    audio.play();

    const isForward = pageNum >= currentPageSingle;
    const animClass = isForward ? 'page-anim-single-forward' : 'page-anim-single-backward';
    currentPageSingle = pageNum;
    wrapper?.classList.add('is-cover');

    document.querySelectorAll('.notebook-page').forEach(page => {
      page.classList.remove('active', 'page-left', 'page-right', 'page-anim-forward', 'page-anim-backward', 'page-anim-single-forward', 'page-anim-single-backward');
    });

    const target = document.querySelector(`.notebook-page[data-page="${pageNum}"]`);
    if (target) {
      target.scrollTop = 0;
      target.classList.add('active', animClass);
      onPageActivated(pageNum);
    }

    if (btnPrev) btnPrev.disabled = (currentPageSingle === 1);
    if (btnNext) btnNext.disabled = (currentPageSingle === totalPages);
    if (pageDropdown) pageDropdown.value = currentPageSingle;
    if (pageCounterText) pageCounterText.textContent = `Pág. ${currentPageSingle} de ${totalPages}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateToPage(pageNum) {
    if (isSpreadMode) {
      if (pageNum === 1) goToSpread(0);
      else {
        const spread = Math.floor(pageNum / 2);
        goToSpread(spread);
      }
    } else {
      goToPageSingle(pageNum);
    }
  }

  window.navigateToPage = navigateToPage;
  window.goToPage = navigateToPage;

  function next() {
    if (isSpreadMode) {
      if (currentSpread < totalSpreads - 1) goToSpread(currentSpread + 1);
    } else {
      if (currentPageSingle < totalPages) goToPageSingle(currentPageSingle + 1);
    }
  }

  function prev() {
    if (isSpreadMode) {
      if (currentSpread > 0) goToSpread(currentSpread - 1);
    } else {
      if (currentPageSingle > 1) goToPageSingle(currentPageSingle - 1);
    }
  }

  // Activación bajo demanda
  function onPageActivated(pageNum) {
    if (window.renderMathInElement) {
      const activeEl = document.querySelector(`.notebook-page[data-page="${pageNum}"]`);
      if (activeEl) {
        window.renderMathInElement(activeEl, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false,
          macros: {
            "\\dddot": "\\overset{\\dots}"
          }
        });
      }
    }

    // Página 3: Mapa Mental
    if (pageNum === 3 && !mindMapEngine) {
      mindMapEngine = new InteractiveMindMap('mindmapContainer');
    }

    // Página 7: Motor GeoGebra de Ondas
    if (pageNum === 7) {
      setTimeout(() => {
        if (!ggbEngine) {
          initGeoGebra();
        } else {
          ggbEngine.initDPI();
          ggbEngine.render();
        }
      }, 50);
    }

    // Página 8: Simulador Cuerda Tensa
    if (pageNum === 8) {
      setTimeout(() => {
        if (!tautStringSim) {
          tautStringSim = new TautStringSimulator('simTautStringCanvas');
          initTautStringControls();
        } else {
          tautStringSim.initDPI();
        }
      }, 50);
    }

    // Página 9: Simulador Ondas Estacionarias
    if (pageNum === 9) {
      setTimeout(() => {
        if (!standingSim) {
          standingSim = new StandingWaveAndDopplerSimulator('simStandingCanvas');
          initStandingControls();
        } else {
          standingSim.initDPI();
        }
      }, 50);
    }

    // Página 11: Simulador Avanzado Efecto Doppler
    if (pageNum === 11) {
      setTimeout(() => {
        if (!dopplerSim) {
          dopplerSim = new DopplerEffectSimulator('simDopplerCanvas');
          initDopplerControls();
        } else {
          dopplerSim.initDPI();
        }
      }, 50);
    }

    // Página 13 (anteriormente 11): Simulador de Polarización Transversal del Espacio-Tiempo (h+ y hx)
    if (pageNum === 13) {
      setTimeout(() => {
        if (!spacetimeSim) {
          spacetimeSim = new SpacetimePolarizationSimulator('simSpacetimeCanvas');
          initSpacetimeControls();
        } else {
          spacetimeSim.initDPI();
        }
      }, 50);
    }

    // Página 15 (anteriormente 13): Simulador de Interferómetro LIGO y Señal Chirp
    if (pageNum === 15) {
      setTimeout(() => {
        if (!ligoSim) {
          ligoSim = new LigoInterferometerSimulator('simLigoCanvas');
          initLigoControls();
        } else {
          ligoSim.initDPI();
        }
      }, 50);
    }

    // Página 17 (anteriormente 15): Taller Interactivo
    if (pageNum === 17 && !exerciseEngine) {
      exerciseEngine = new ExerciseEngine();
    }
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DE CONTROLES GEOGEBRA
  // --------------------------------------------------------------------------
  function initGeoGebra() {
    ggbEngine = new GeoGebraWavePlane('ggbCanvas', {
      A: 1.8,
      lambda: 3.0,
      f: 1.0,
      phi: 0.0
    });

    document.getElementById('ggbToolPan')?.addEventListener('click', (e) => {
      setActiveToolBtn(e.currentTarget);
      ggbEngine.setTool('pan');
    });

    document.getElementById('ggbToolSelect')?.addEventListener('click', (e) => {
      setActiveToolBtn(e.currentTarget);
      ggbEngine.setTool('select');
    });

    document.getElementById('ggbZoomIn')?.addEventListener('click', () => ggbEngine.zoom(1.2));
    document.getElementById('ggbZoomOut')?.addEventListener('click', () => ggbEngine.zoom(0.83));
    document.getElementById('ggbResetView')?.addEventListener('click', () => ggbEngine.resetView());

    // Play / Pausa GeoGebra
    const btnPlay = document.getElementById('ggbBtnPlay');
    btnPlay?.addEventListener('click', () => {
      if (!ggbEngine) return;
      const isPlaying = ggbEngine.togglePlay();
      btnPlay.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    // Botones rápidos de velocidad GeoGebra
    document.querySelectorAll('.ggb-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ggb-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (ggbEngine) ggbEngine.setSpeed(speed);
        const slider = document.getElementById('ggbSliderSpeed');
        const lbl = document.getElementById('ggbValSpeed');
        if (slider) slider.value = speed;
        if (lbl) lbl.textContent = `${speed.toFixed(1)}x`;
      });
    });

    // Slider de velocidad GeoGebra
    const sliderGgbSpeed = document.getElementById('ggbSliderSpeed');
    const valGgbSpeed = document.getElementById('ggbValSpeed');
    sliderGgbSpeed?.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (ggbEngine) ggbEngine.setSpeed(speed);
      if (valGgbSpeed) valGgbSpeed.textContent = `${speed.toFixed(1)}x`;
      document.querySelectorAll('.ggb-speed-btn').forEach(b => {
        b.classList.toggle('active', Math.abs(parseFloat(b.dataset.speed) - speed) < 0.05);
      });
    });

    // Sliders GeoGebra
    const sliderA = document.getElementById('ggbSliderA');
    const valA = document.getElementById('ggbValA');
    sliderA?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.A = val;
      if (valA) valA.textContent = `${val.toFixed(1)} m`;
    });

    const sliderLambda = document.getElementById('ggbSliderLambda');
    const valLambda = document.getElementById('ggbValLambda');
    sliderLambda?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.lambda = val;
      if (valLambda) valLambda.textContent = `${val.toFixed(1)} m`;
    });

    const sliderF = document.getElementById('ggbSliderF');
    const valF = document.getElementById('ggbValF');
    sliderF?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.f = val;
      if (valF) valF.textContent = `${val.toFixed(1)} Hz`;
    });

    // Checkboxes de curvas
    document.getElementById('chkCurveY1')?.addEventListener('change', (e) => ggbEngine.showY1 = e.target.checked);
    document.getElementById('chkCurveY2')?.addEventListener('change', (e) => ggbEngine.showY2 = e.target.checked);
    document.getElementById('chkCurveYtot')?.addEventListener('change', (e) => ggbEngine.showYtot = e.target.checked);

    // Paleta de Estilos
    const btnPalette = document.getElementById('ggbBtnPalette');
    const modalPalette = document.getElementById('ggbPaletteModal');
    btnPalette?.addEventListener('click', () => modalPalette?.classList.toggle('open'));

    document.addEventListener('click', (e) => {
      if (modalPalette && modalPalette.classList.contains('open')) {
        if (!modalPalette.contains(e.target) && e.target !== btnPalette && !btnPalette.contains(e.target)) {
          modalPalette.classList.remove('open');
        }
      }
    });

    document.querySelectorAll('.color-swatch-y1').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        document.querySelectorAll('.color-swatch-y1').forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        ggbEngine.styles.colorY1 = e.target.dataset.color;
      });
    });

    document.getElementById('ggbStrokeWidth')?.addEventListener('input', (e) => {
      ggbEngine.styles.lineWidth = parseFloat(e.target.value);
    });

    document.getElementById('ggbLineStyle')?.addEventListener('change', (e) => {
      const style = e.target.value;
      if (style === 'dashed') ggbEngine.styles.lineDash = [6, 4];
      else if (style === 'dotted') ggbEngine.styles.lineDash = [2, 3];
      else ggbEngine.styles.lineDash = [];
    });

    // Recuadro de Selección de Partícula (Eje X, Eje Y, Vectores) GeoGebra
    const ggbNumX = document.getElementById('ggbNumX');
    const ggbSliderX = document.getElementById('ggbSliderX');
    const ggbValX = document.getElementById('ggbValX');

    ggbNumX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        ggbEngine.setInspectX(val);
        if (ggbSliderX) ggbSliderX.value = val;
        if (ggbValX) ggbValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    ggbSliderX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.setInspectX(val);
      if (ggbNumX) ggbNumX.value = val.toFixed(2);
      if (ggbValX) ggbValX.textContent = `${val.toFixed(2)} m`;
    });

    const ggbNumY = document.getElementById('ggbNumY');
    const ggbSliderY = document.getElementById('ggbSliderY');
    const ggbValY = document.getElementById('ggbValY');

    ggbNumY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        ggbEngine.setInspectY(val);
        if (ggbSliderY) ggbSliderY.value = val;
        if (ggbValY) ggbValY.textContent = `${val.toFixed(2)} m`;
        ggbEngine.notifyParticleModeChange(false);
      }
    });

    ggbSliderY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.setInspectY(val);
      if (ggbNumY) ggbNumY.value = val.toFixed(2);
      if (ggbValY) ggbValY.textContent = `${val.toFixed(2)} m`;
      ggbEngine.notifyParticleModeChange(false);
    });

    document.getElementById('btnGgbLockWave')?.addEventListener('click', () => {
      ggbEngine.setLockYToWave(true);
      ggbEngine.notifyParticleModeChange(true);
    });

    document.getElementById('btnGgbManualY')?.addEventListener('click', () => {
      ggbEngine.setLockYToWave(false);
      ggbEngine.notifyParticleModeChange(false);
    });

    const ggbSliderT = document.getElementById('ggbSliderT');
    const ggbValT = document.getElementById('ggbValT');
    ggbSliderT?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.setTime(val);
      if (ggbValT) ggbValT.textContent = `${val.toFixed(2)} s`;
    });

    const ggbSliderVecScale = document.getElementById('ggbSliderVecScale');
    const ggbValVecScale = document.getElementById('ggbValVecScale');
    ggbSliderVecScale?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      ggbEngine.setVectorScale(val);
      if (ggbValVecScale) ggbValVecScale.textContent = `${val.toFixed(1)}x`;
    });

    document.getElementById('chkGgbVy')?.addEventListener('change', (e) => {
      ggbEngine.setVectorVisibility(e.target.checked, undefined);
    });
    document.getElementById('chkGgbAy')?.addEventListener('change', (e) => {
      ggbEngine.setVectorVisibility(undefined, e.target.checked);
    });
  }

  function setActiveToolBtn(button) {
    document.querySelectorAll('.ggb-btn-tool').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  }

  // --------------------------------------------------------------------------
  // CONTROLES SIMULADOR 1: CUERDA TENSA
  // --------------------------------------------------------------------------
  function initTautStringControls() {
    const btnPlay = document.getElementById('btnTautPlay');
    btnPlay?.addEventListener('click', () => {
      if (!tautStringSim) return;
      tautStringSim.isPlaying = !tautStringSim.isPlaying;
      btnPlay.innerHTML = tautStringSim.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    const btnReset = document.getElementById('btnTautReset');
    btnReset?.addEventListener('click', () => {
      if (tautStringSim) tautStringSim.time = 0;
    });

    document.getElementById('simSliderTs')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.Ts = val;
      const lbl = document.getElementById('simValTs');
      if (lbl) lbl.textContent = `${val.toFixed(0)} N`;
    });

    document.getElementById('simSliderMu')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.mu = val;
      const lbl = document.getElementById('simValMu');
      if (lbl) lbl.textContent = `${val.toFixed(3)} kg/m`;
    });

    document.getElementById('simSliderA')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.A = val;
      const lbl = document.getElementById('simValA');
      if (lbl) lbl.textContent = `${val.toFixed(1)} m`;
    });

    document.getElementById('simSliderF')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.f = val;
      const lbl = document.getElementById('simValF');
      if (lbl) lbl.textContent = `${val.toFixed(1)} Hz`;
    });

    // Botones rápidos de velocidad Cuerda Tensa
    document.querySelectorAll('.taut-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.taut-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (tautStringSim) tautStringSim.setSpeed(speed);
        const slider = document.getElementById('simSliderSpeed');
        const lbl = document.getElementById('simValSpeed');
        if (slider) slider.value = speed;
        if (lbl) lbl.textContent = `${speed.toFixed(1)}x`;
      });
    });

    // Slider de velocidad Cuerda Tensa
    const sliderTautSpeed = document.getElementById('simSliderSpeed');
    const valTautSpeed = document.getElementById('simValSpeed');
    sliderTautSpeed?.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.setSpeed(speed);
      if (valTautSpeed) valTautSpeed.textContent = `${speed.toFixed(1)}x`;
      document.querySelectorAll('.taut-speed-btn').forEach(b => {
        b.classList.toggle('active', Math.abs(parseFloat(b.dataset.speed) - speed) < 0.05);
      });
    });

    // Recuadro de Selección de Partícula (Eje X, Eje Y, Vectores) Cuerda Tensa
    const tautNumX = document.getElementById('tautNumX');
    const simSliderX = document.getElementById('simSliderX');
    const simValX = document.getElementById('simValX');

    tautNumX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && tautStringSim) {
        tautStringSim.setInspectX(val);
        if (simSliderX) simSliderX.value = val;
        if (simValX) simValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    simSliderX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) {
        tautStringSim.setInspectX(val);
        if (tautNumX) tautNumX.value = val.toFixed(2);
        if (simValX) simValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    const tautNumY = document.getElementById('tautNumY');
    const tautSliderY = document.getElementById('tautSliderY');
    const tautValY = document.getElementById('tautValY');

    tautNumY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && tautStringSim) {
        tautStringSim.setInspectY(val);
        if (tautSliderY) tautSliderY.value = val;
        if (tautValY) tautValY.textContent = `${val.toFixed(2)} m`;
        tautStringSim.notifyParticleModeChange(false);
      }
    });

    tautSliderY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) {
        tautStringSim.setInspectY(val);
        if (tautNumY) tautNumY.value = val.toFixed(2);
        if (tautValY) tautValY.textContent = `${val.toFixed(2)} m`;
        tautStringSim.notifyParticleModeChange(false);
      }
    });

    document.getElementById('btnTautLockWave')?.addEventListener('click', () => {
      if (tautStringSim) {
        tautStringSim.setLockYToWave(true);
        tautStringSim.notifyParticleModeChange(true);
      }
    });

    document.getElementById('btnTautManualY')?.addEventListener('click', () => {
      if (tautStringSim) {
        tautStringSim.setLockYToWave(false);
        tautStringSim.notifyParticleModeChange(false);
      }
    });

    const simSliderT = document.getElementById('simSliderT');
    const simValT = document.getElementById('simValT');
    simSliderT?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.setTime(val);
      if (simValT) simValT.textContent = `${val.toFixed(2)} s`;
    });

    const simSliderVecScale = document.getElementById('simSliderVecScale');
    const simValVecScale = document.getElementById('simValVecScale');
    simSliderVecScale?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tautStringSim) tautStringSim.setVectorScale(val);
      if (simValVecScale) simValVecScale.textContent = `${val.toFixed(1)}x`;
    });

    document.getElementById('chkTautVy')?.addEventListener('change', (e) => {
      if (tautStringSim) tautStringSim.setVectorVisibility(e.target.checked, undefined, undefined);
    });
    document.getElementById('chkTautAy')?.addEventListener('change', (e) => {
      if (tautStringSim) tautStringSim.setVectorVisibility(undefined, e.target.checked, undefined);
    });
    document.getElementById('chkTautAllVecs')?.addEventListener('change', (e) => {
      if (tautStringSim) tautStringSim.setVectorVisibility(undefined, undefined, e.target.checked);
    });
  }

  // --------------------------------------------------------------------------
  // CONTROLES SIMULADOR 2: ESTACIONARIAS & DOPPLER
  // --------------------------------------------------------------------------
  function initStandingControls() {
    // Selector de modo armónico
    document.querySelectorAll('.btn-harmonic').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-harmonic').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const n = parseInt(e.currentTarget.dataset.harmonic, 10);
        if (standingSim) standingSim.setHarmonic(n);
      });
    });

    // Play / Pausa Estacionarias
    const btnPlayStanding = document.getElementById('btnStandingPlay');
    btnPlayStanding?.addEventListener('click', () => {
      if (!standingSim) return;
      const isPlaying = standingSim.togglePlay();
      btnPlayStanding.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    // Reset Estacionarias
    const btnResetStanding = document.getElementById('btnStandingReset');
    btnResetStanding?.addEventListener('click', () => {
      if (standingSim) standingSim.reset();
    });

    // Botones rápidos de velocidad Estacionarias
    document.querySelectorAll('.standing-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.standing-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (standingSim) standingSim.setSpeed(speed);
        const slider = document.getElementById('sliderStandingSpeed');
        const lbl = document.getElementById('lblStandingSpeed');
        if (slider) slider.value = speed;
        if (lbl) lbl.textContent = `${speed.toFixed(1)}x`;
      });
    });

    // Slider de velocidad Estacionarias
    const sliderStandingSpeed = document.getElementById('sliderStandingSpeed');
    const valStandingSpeed = document.getElementById('lblStandingSpeed');
    sliderStandingSpeed?.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (standingSim) standingSim.setSpeed(speed);
      if (valStandingSpeed) valStandingSpeed.textContent = `${speed.toFixed(1)}x`;
      document.querySelectorAll('.standing-speed-btn').forEach(b => {
        b.classList.toggle('active', Math.abs(parseFloat(b.dataset.speed) - speed) < 0.05);
      });
    });

    // Recuadro de Selección de Partícula (Eje X, Eje Y, Vectores) Estacionarias
    const standingNumX = document.getElementById('standingNumX');
    const sliderStandingX = document.getElementById('sliderStandingX');
    const standingValX = document.getElementById('standingValX');

    standingNumX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && standingSim) {
        standingSim.setInspectX(val);
        if (sliderStandingX) sliderStandingX.value = val;
        if (standingValX) standingValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    sliderStandingX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (standingSim) {
        standingSim.setInspectX(val);
        if (standingNumX) standingNumX.value = val.toFixed(2);
        if (standingValX) standingValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    const standingNumY = document.getElementById('standingNumY');
    const sliderStandingY = document.getElementById('sliderStandingY');
    const standingValY = document.getElementById('standingValY');

    standingNumY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && standingSim) {
        standingSim.setInspectY(val);
        if (sliderStandingY) sliderStandingY.value = val;
        if (standingValY) standingValY.textContent = `${val.toFixed(2)} m`;
        standingSim.notifyParticleModeChange(false);
      }
    });

    sliderStandingY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (standingSim) {
        standingSim.setInspectY(val);
        if (standingNumY) standingNumY.value = val.toFixed(2);
        if (standingValY) standingValY.textContent = `${val.toFixed(2)} m`;
        standingSim.notifyParticleModeChange(false);
      }
    });

    document.getElementById('btnStandingLockWave')?.addEventListener('click', () => {
      if (standingSim) {
        standingSim.setLockYToWave(true);
        standingSim.notifyParticleModeChange(true);
      }
    });

    document.getElementById('btnStandingManualY')?.addEventListener('click', () => {
      if (standingSim) {
        standingSim.setLockYToWave(false);
        standingSim.notifyParticleModeChange(false);
      }
    });

    const sliderStandingT = document.getElementById('sliderStandingT');
    const valStandingT = document.getElementById('standingValT');
    sliderStandingT?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (standingSim) standingSim.setTime(val);
      if (valStandingT) valStandingT.textContent = `${val.toFixed(2)} s`;
    });

    const sliderStandingVecScale = document.getElementById('sliderStandingVecScale');
    const valStandingVecScale = document.getElementById('standingValVecScale');
    sliderStandingVecScale?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (standingSim) standingSim.setVectorScale(val);
      if (valStandingVecScale) valStandingVecScale.textContent = `${val.toFixed(1)}x`;
    });

    document.getElementById('chkStandingVy')?.addEventListener('change', (e) => {
      if (standingSim) standingSim.setVectorVisibility(e.target.checked, undefined);
    });
    document.getElementById('chkStandingAy')?.addEventListener('change', (e) => {
      if (standingSim) standingSim.setVectorVisibility(undefined, e.target.checked);
    });
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DE CONTROLES: SIMULADOR EFECTO DOPPLER (PÁGINA 11)
  // --------------------------------------------------------------------------
  function initDopplerControls() {
    // Play / Pausa
    const btnPlay = document.getElementById('btnDopplerPlay');
    btnPlay?.addEventListener('click', () => {
      if (!dopplerSim) return;
      const isPlaying = dopplerSim.togglePlay();
      btnPlay.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    // Reset
    const btnReset = document.getElementById('btnDopplerReset');
    btnReset?.addEventListener('click', () => {
      if (dopplerSim) {
        dopplerSim.reset();
        syncDopplerUIFromSim();
      }
    });

    // Audio Doppler Síntesis Web Audio API
    const btnAudio = document.getElementById('btnDopplerAudio');
    btnAudio?.addEventListener('click', () => {
      if (!dopplerSim) return;
      const active = dopplerSim.toggleAudio();
      btnAudio.classList.toggle('active', active);
      btnAudio.innerHTML = active 
        ? '<i class="fa-solid fa-volume-high"></i> Sonido Activo' 
        : '<i class="fa-solid fa-volume-xmark"></i> Audio Doppler';
    });

    // Cono de Mach Toggle
    const btnMach = document.getElementById('btnDopplerMachToggle');
    btnMach?.addEventListener('click', () => {
      if (!dopplerSim) return;
      dopplerSim.toggleMachCone();
      btnMach.classList.toggle('active', dopplerSim.showMachCone);
    });

    // Selector de velocidad de simulación
    document.querySelectorAll('.doppler-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.doppler-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (dopplerSim) dopplerSim.setSpeed(speed);
      });
    });

    // Presets rápidos
    document.querySelectorAll('.btn-doppler-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-doppler-preset').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const preset = e.currentTarget.dataset.preset;
        if (dopplerSim) {
          dopplerSim.applyPreset(preset);
          syncDopplerUIFromSim();
        }
      });
    });

    // Sliders de parámetros
    const sliderVs = document.getElementById('sliderDopplerVs');
    const valVs = document.getElementById('lblDopplerVs');
    sliderVs?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (dopplerSim) dopplerSim.setSourceSpeed(val);
      if (valVs) valVs.textContent = `${val.toFixed(0)} m/s`;
    });

    const sliderVo = document.getElementById('sliderDopplerVo');
    const valVo = document.getElementById('lblDopplerVo');
    sliderVo?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (dopplerSim) dopplerSim.setObserverSpeed(val);
      if (valVo) valVo.textContent = `${val.toFixed(0)} m/s`;
    });

    const sliderF0 = document.getElementById('sliderDopplerF0');
    const valF0 = document.getElementById('lblDopplerF0');
    sliderF0?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (dopplerSim) dopplerSim.setSourceFreq(val);
      if (valF0) valF0.textContent = `${val.toFixed(1)} Hz`;
    });

    const sliderC = document.getElementById('sliderDopplerC');
    const valC = document.getElementById('lblDopplerC');
    sliderC?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (dopplerSim) dopplerSim.setSoundSpeed(val);
      if (valC) valC.textContent = `${val.toFixed(0)} m/s`;
    });

    function syncDopplerUIFromSim() {
      if (!dopplerSim) return;
      if (sliderVs) sliderVs.value = dopplerSim.sourceSpeed;
      if (valVs) valVs.textContent = `${dopplerSim.sourceSpeed.toFixed(0)} m/s`;
      if (sliderVo) sliderVo.value = dopplerSim.observerSpeed;
      if (valVo) valVo.textContent = `${dopplerSim.observerSpeed.toFixed(0)} m/s`;
      if (sliderF0) sliderF0.value = dopplerSim.sourceFreq;
      if (valF0) valF0.textContent = `${dopplerSim.sourceFreq.toFixed(1)} Hz`;
      if (sliderC) sliderC.value = dopplerSim.soundSpeed;
      if (valC) valC.textContent = `${dopplerSim.soundSpeed.toFixed(0)} m/s`;
      if (btnMach) btnMach.classList.toggle('active', dopplerSim.showMachCone);
    }

    // Telemetría externa en la tarjeta de simulación
    if (dopplerSim) {
      dopplerSim.onTelemetryUpdate = (data) => {
        const lblApparent = document.getElementById('lblDopplerFApparent');
        if (lblApparent) lblApparent.textContent = `${data.fObserved.toFixed(1)} Hz`;

        const lblRatio = document.getElementById('lblDopplerRatio');
        if (lblRatio) lblRatio.textContent = (data.fObserved / data.sourceFreq).toFixed(2) + 'x';

        const lblComp = document.getElementById('lblDopplerLambdaAhead');
        if (lblComp) lblComp.textContent = (data.lambdaAhead < 1000) ? `${data.lambdaAhead.toFixed(1)} m` : '0.0 m';

        const lblDilat = document.getElementById('lblDopplerLambdaBehind');
        if (lblDilat) lblDilat.textContent = `${data.lambdaBehind.toFixed(1)} m`;

        const lblMach = document.getElementById('lblDopplerMachNum');
        if (lblMach) lblMach.textContent = data.machNumber.toFixed(2);

        const badgeRegime = document.getElementById('badgeDopplerRegime');
        if (badgeRegime) {
          if (data.machNumber < 0.95) {
            badgeRegime.textContent = 'SUBSÓNICO';
            badgeRegime.style.background = '#dcfce7';
            badgeRegime.style.color = '#15803d';
          } else if (data.machNumber <= 1.05) {
            badgeRegime.textContent = 'BARRERA SÓNICA (M≈1)';
            badgeRegime.style.background = '#fef3c7';
            badgeRegime.style.color = '#b45309';
          } else {
            badgeRegime.textContent = `SUPERSÓNICO (M=${data.machNumber.toFixed(2)})`;
            badgeRegime.style.background = '#fee2e2';
            badgeRegime.style.color = '#b91c1c';
          }
        }
      };
    }
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DE CONTROLES: POLARIZACIÓN DEL ESPACIO-TIEMPO (PÁGINA 13)
  // --------------------------------------------------------------------------
  function initSpacetimeControls() {
    const btnPolPlus = document.getElementById('btnPolPlus');
    const btnPolCross = document.getElementById('btnPolCross');
    const btnPolCirc = document.getElementById('btnPolCircular');

    const setPolMode = (mode, activeBtn) => {
      if (spacetimeSim) spacetimeSim.setMode(mode);
      [btnPolPlus, btnPolCross, btnPolCirc].forEach(b => b?.classList.remove('active'));
      activeBtn?.classList.add('active');
    };

    btnPolPlus?.addEventListener('click', (e) => setPolMode('plus', e.currentTarget));
    btnPolCross?.addEventListener('click', (e) => setPolMode('cross', e.currentTarget));
    btnPolCirc?.addEventListener('click', (e) => setPolMode('circular', e.currentTarget));

    const btnPlay = document.getElementById('btnSpacetimePlay');
    btnPlay?.addEventListener('click', () => {
      if (!spacetimeSim) return;
      const isPlaying = spacetimeSim.togglePlay();
      btnPlay.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('btnSpacetimeReset')?.addEventListener('click', () => {
      if (spacetimeSim) spacetimeSim.reset();
    });

    document.querySelectorAll('.spacetime-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.spacetime-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (spacetimeSim) spacetimeSim.setSpeed(speed);
      });
    });

    const sliderStrain = document.getElementById('sliderSpacetimeStrain');
    const valStrain = document.getElementById('valSpacetimeStrain');
    sliderStrain?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (spacetimeSim) spacetimeSim.setStrain(val);
      if (valStrain) valStrain.textContent = val.toFixed(2);
    });

    const sliderFreq = document.getElementById('sliderSpacetimeFreq');
    const valFreq = document.getElementById('valSpacetimeFreq');
    sliderFreq?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (spacetimeSim) spacetimeSim.setFreq(val);
      if (valFreq) valFreq.textContent = `${val.toFixed(2)} Hz`;
    });

    document.getElementById('chkSpacetimeGrid')?.addEventListener('change', (e) => {
      if (spacetimeSim) { spacetimeSim.showGrid = e.target.checked; spacetimeSim.render(); }
    });
    document.getElementById('chkSpacetimeVectors')?.addEventListener('change', (e) => {
      if (spacetimeSim) { spacetimeSim.showTidalVectors = e.target.checked; spacetimeSim.render(); }
    });
    document.getElementById('chkSpacetimeAxes')?.addEventListener('change', (e) => {
      if (spacetimeSim) { spacetimeSim.showAxes = e.target.checked; spacetimeSim.render(); }
    });
  }

  // --------------------------------------------------------------------------
  // INICIALIZACIÓN DE CONTROLES: INTERFERÓMETRO LIGO & AUDIO CHIRP (PÁGINA 11)
  // --------------------------------------------------------------------------
  function initLigoControls() {
    const btnPlay = document.getElementById('btnLigoPlay');
    btnPlay?.addEventListener('click', () => {
      if (!ligoSim) return;
      const isPlaying = ligoSim.togglePlay();
      btnPlay.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('btnLigoReset')?.addEventListener('click', () => {
      if (ligoSim) ligoSim.reset();
    });

    document.querySelectorAll('.ligo-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ligo-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (ligoSim) ligoSim.setSpeed(speed);
      });
    });

    const btnChirp = document.getElementById('btnPlayLigoChirp');
    btnChirp?.addEventListener('click', () => {
      if (!ligoSim) return;
      btnChirp.classList.add('playing');
      btnChirp.innerHTML = '<i class="fa-solid fa-wave-square fa-spin"></i> Emitiendo Chirp GW150914...';
      ligoSim.playChirpAudio(() => {
        btnChirp.classList.remove('playing');
        btnChirp.innerHTML = '<i class="fa-solid fa-volume-high"></i> Reproducir Chirp Gravitacional (Audio GW150914)';
      });
    });

    const sliderM1 = document.getElementById('sliderLigoM1');
    const valM1 = document.getElementById('valLigoM1');
    const sliderM2 = document.getElementById('sliderLigoM2');
    const valM2 = document.getElementById('valLigoM2');
    const sliderDist = document.getElementById('sliderLigoDist');
    const valDist = document.getElementById('valLigoDist');

    const updateLigoPhysics = () => {
      const m1 = parseFloat(sliderM1?.value || 36);
      const m2 = parseFloat(sliderM2?.value || 29);
      const dist = parseFloat(sliderDist?.value || 410);
      if (ligoSim) {
        ligoSim.setMasses(m1, m2);
        ligoSim.setDistance(dist);
      }
      if (valM1) valM1.textContent = `${m1} M☉`;
      if (valM2) valM2.textContent = `${m2} M☉`;
      if (valDist) valDist.textContent = `${dist} Mpc`;
    };

    sliderM1?.addEventListener('input', updateLigoPhysics);
    sliderM2?.addEventListener('input', updateLigoPhysics);
    sliderDist?.addEventListener('input', updateLigoPhysics);
  }

  // Filtrado reactivo del Glosario (Página 14)
  const glossaryInput = document.getElementById('glossarySearch');
  glossaryInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.glossary-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? 'block' : 'none';
    });
  });

  // Alternar entre modo Doble Página y Página Simple
  btnToggleSpread?.addEventListener('click', () => {
    isSpreadMode = !isSpreadMode;
    btnToggleSpread.innerHTML = isSpreadMode ? 
      '<i class="fa-solid fa-book-open"></i> <span id="lblSpreadMode">Doble Página</span>' : 
      '<i class="fa-solid fa-file"></i> <span id="lblSpreadMode">Página Simple</span>';

    populateDropdown();
    if (isSpreadMode) {
      goToSpread(currentSpread);
    } else {
      goToPageSingle(currentSpread === 0 ? 1 : currentSpread * 2);
    }
  });

  // =========================================================================
  // SISTEMA DE VENTANA MODAL COLAPSABLE GRANDE PARA GRÁFICAS INTERACTIVAS
  // =========================================================================
  const graphicModal = document.getElementById('graphicModal');
  const modalDialog = document.getElementById('modalDialog');
  const modalGraphicTitle = document.getElementById('modalGraphicTitle');
  const modalIcon = document.getElementById('modalIcon');
  const modalBadgeMode = document.getElementById('modalBadgeMode');
  const btnModalCollapse = document.getElementById('btnModalCollapse');
  const btnModalCollapseIcon = document.getElementById('btnModalCollapseIcon');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalCloseFooter = document.getElementById('btnModalCloseFooter');

  let activeModalView = null;
  let isModalCollapsed = false;

  let modalGgbEngine = null;
  let modalTautStringSim = null;
  let modalStandingSim = null;
  let modalMindMapEngine = null;

  function openGraphicModal(viewType) {
    if (!graphicModal || !modalDialog) return;
    activeModalView = viewType;

    document.querySelectorAll('.modal-view-panel').forEach(panel => panel.style.display = 'none');

    isModalCollapsed = false;
    modalDialog.classList.remove('is-collapsed');
    graphicModal.classList.remove('is-collapsed-parent');
    if (btnModalCollapseIcon) btnModalCollapseIcon.className = 'fa-solid fa-window-minimize';
    if (modalBadgeMode) modalBadgeMode.textContent = 'VENTANA EXPANDIDA';

    graphicModal.classList.add('open');

    if (viewType === 'geogebra') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-chart-line" style="color:#38bdf8;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Plano Cartesiano de Ondas GeoGebra (Modo Expandido)';
      const p = document.getElementById('modalViewGeoGebra');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalGgbEngine) {
          initModalGeoGebra();
        } else {
          if (ggbEngine) {
            modalGgbEngine.A = ggbEngine.A;
            modalGgbEngine.lambda = ggbEngine.lambda;
            modalGgbEngine.f = ggbEngine.f;
            modalGgbEngine.showY1 = ggbEngine.showY1;
            modalGgbEngine.showY2 = ggbEngine.showY2;
            modalGgbEngine.showYtot = ggbEngine.showYtot;
          }
          modalGgbEngine.initDPI();
          modalGgbEngine.render();
        }
      }, 60);

    } else if (viewType === 'simulator') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-wave-square" style="color:#0284c7;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Laboratorio Dinámico: Onda en Cuerda Tensa (Alta Definición)';
      const p = document.getElementById('modalViewSim');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalTautStringSim) {
          modalTautStringSim = new TautStringSimulator('modalSimTautCanvas');

          document.getElementById('modalBtnTautPlay')?.addEventListener('click', () => {
            if (!modalTautStringSim) return;
            const isPlaying = modalTautStringSim.togglePlay();
            document.getElementById('modalBtnTautPlay').innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
          });
          document.getElementById('modalBtnTautReset')?.addEventListener('click', () => {
            if (modalTautStringSim) modalTautStringSim.time = 0;
          });
          document.querySelectorAll('.modal-taut-speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.modal-taut-speed-btn').forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              const speed = parseFloat(e.currentTarget.dataset.speed);
              if (modalTautStringSim) modalTautStringSim.setSpeed(speed);
            });
          });

          const modalTautNumX = document.getElementById('modalTautNumX');
          const modalSimSliderX = document.getElementById('modalSimSliderX');
          const modalSimValX = document.getElementById('modalSimValX');

          modalTautNumX?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && modalTautStringSim) {
              modalTautStringSim.setInspectX(val);
              if (modalSimSliderX) modalSimSliderX.value = val;
              if (modalSimValX) modalSimValX.textContent = `${val.toFixed(2)} m`;
            }
          });

          modalSimSliderX?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalTautStringSim) {
              modalTautStringSim.setInspectX(val);
              if (modalTautNumX) modalTautNumX.value = val.toFixed(2);
              if (modalSimValX) modalSimValX.textContent = `${val.toFixed(2)} m`;
            }
          });

          const modalTautNumY = document.getElementById('modalTautNumY');
          const modalTautSliderY = document.getElementById('modalTautSliderY');
          const modalTautValY = document.getElementById('modalTautValY');

          modalTautNumY?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && modalTautStringSim) {
              modalTautStringSim.setInspectY(val);
              if (modalTautSliderY) modalTautSliderY.value = val;
              if (modalTautValY) modalTautValY.textContent = `${val.toFixed(2)} m`;
              modalTautStringSim.notifyParticleModeChange(false);
            }
          });

          modalTautSliderY?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalTautStringSim) {
              modalTautStringSim.setInspectY(val);
              if (modalTautNumY) modalTautNumY.value = val.toFixed(2);
              if (modalTautValY) modalTautValY.textContent = `${val.toFixed(2)} m`;
              modalTautStringSim.notifyParticleModeChange(false);
            }
          });

          document.getElementById('modalBtnTautLockWave')?.addEventListener('click', () => {
            if (modalTautStringSim) {
              modalTautStringSim.setLockYToWave(true);
              modalTautStringSim.notifyParticleModeChange(true);
            }
          });

          document.getElementById('modalBtnTautManualY')?.addEventListener('click', () => {
            if (modalTautStringSim) {
              modalTautStringSim.setLockYToWave(false);
              modalTautStringSim.notifyParticleModeChange(false);
            }
          });

          const modalSimSliderT = document.getElementById('modalSimSliderT');
          const modalSimValT = document.getElementById('modalSimValT');
          modalSimSliderT?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalTautStringSim) modalTautStringSim.setTime(val);
            if (modalSimValT) modalSimValT.textContent = `${val.toFixed(2)} s`;
          });

          const modalSimSliderVecScale = document.getElementById('modalSimSliderVecScale');
          const modalSimValVecScale = document.getElementById('modalSimValVecScale');
          modalSimSliderVecScale?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalTautStringSim) modalTautStringSim.setVectorScale(val);
            if (modalSimValVecScale) modalSimValVecScale.textContent = `${val.toFixed(1)}x`;
          });

          document.getElementById('modalChkTautVy')?.addEventListener('change', (e) => {
            if (modalTautStringSim) modalTautStringSim.setVectorVisibility(e.target.checked, undefined, undefined);
          });
          document.getElementById('modalChkTautAy')?.addEventListener('change', (e) => {
            if (modalTautStringSim) modalTautStringSim.setVectorVisibility(undefined, e.target.checked, undefined);
          });
        } else {
          modalTautStringSim.initDPI();
        }
      }, 60);

    } else if (viewType === 'standing') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-arrows-split-up-and-left" style="color:#6366f1;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Modos Normales & Efecto Doppler (Vista Panorámica)';
      const p = document.getElementById('modalViewStanding');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalStandingSim) {
          modalStandingSim = new StandingWaveAndDopplerSimulator('modalSimStandingCanvas');

          document.getElementById('modalBtnStandingPlay')?.addEventListener('click', () => {
            if (!modalStandingSim) return;
            const isPlaying = modalStandingSim.togglePlay();
            document.getElementById('modalBtnStandingPlay').innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
          });
          document.getElementById('modalBtnStandingReset')?.addEventListener('click', () => {
            if (modalStandingSim) modalStandingSim.reset();
          });
          document.querySelectorAll('.modal-standing-speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.modal-standing-speed-btn').forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              const speed = parseFloat(e.currentTarget.dataset.speed);
              if (modalStandingSim) modalStandingSim.setSpeed(speed);
            });
          });

          const modalStandingNumX = document.getElementById('modalStandingNumX');
          const modalStandingSliderX = document.getElementById('modalStandingSliderX');
          const modalStandingValX = document.getElementById('modalStandingValX');

          modalStandingNumX?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && modalStandingSim) {
              modalStandingSim.setInspectX(val);
              if (modalStandingSliderX) modalStandingSliderX.value = val;
              if (modalStandingValX) modalStandingValX.textContent = `${val.toFixed(2)} m`;
            }
          });

          modalStandingSliderX?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalStandingSim) {
              modalStandingSim.setInspectX(val);
              if (modalStandingNumX) modalStandingNumX.value = val.toFixed(2);
              if (modalStandingValX) modalStandingValX.textContent = `${val.toFixed(2)} m`;
            }
          });

          const modalStandingNumY = document.getElementById('modalStandingNumY');
          const modalStandingSliderY = document.getElementById('modalStandingSliderY');
          const modalStandingValY = document.getElementById('modalStandingValY');

          modalStandingNumY?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && modalStandingSim) {
              modalStandingSim.setInspectY(val);
              if (modalStandingSliderY) modalStandingSliderY.value = val;
              if (modalStandingValY) modalStandingValY.textContent = `${val.toFixed(2)} m`;
              modalStandingSim.notifyParticleModeChange(false);
            }
          });

          modalStandingSliderY?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalStandingSim) {
              modalStandingSim.setInspectY(val);
              if (modalStandingNumY) modalStandingNumY.value = val.toFixed(2);
              if (modalStandingValY) modalStandingValY.textContent = `${val.toFixed(2)} m`;
              modalStandingSim.notifyParticleModeChange(false);
            }
          });

          document.getElementById('modalBtnStandingLockWave')?.addEventListener('click', () => {
            if (modalStandingSim) {
              modalStandingSim.setLockYToWave(true);
              modalStandingSim.notifyParticleModeChange(true);
            }
          });

          document.getElementById('modalBtnStandingManualY')?.addEventListener('click', () => {
            if (modalStandingSim) {
              modalStandingSim.setLockYToWave(false);
              modalStandingSim.notifyParticleModeChange(false);
            }
          });

          const modalStandingSliderT = document.getElementById('modalStandingSliderT');
          const modalStandingValT = document.getElementById('modalStandingValT');
          modalStandingSliderT?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalStandingSim) modalStandingSim.setTime(val);
            if (modalStandingValT) modalStandingValT.textContent = `${val.toFixed(2)} s`;
          });

          const modalStandingSliderVecScale = document.getElementById('modalStandingSliderVecScale');
          const modalStandingValVecScale = document.getElementById('modalStandingValVecScale');
          modalStandingSliderVecScale?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalStandingSim) modalStandingSim.setVectorScale(val);
            if (modalStandingValVecScale) modalStandingValVecScale.textContent = `${val.toFixed(1)}x`;
          });

          document.getElementById('modalChkStandingVy')?.addEventListener('change', (e) => {
            if (modalStandingSim) modalStandingSim.setVectorVisibility(e.target.checked, undefined);
          });
          document.getElementById('modalChkStandingAy')?.addEventListener('change', (e) => {
            if (modalStandingSim) modalStandingSim.setVectorVisibility(undefined, e.target.checked);
          });
        } else {
          modalStandingSim.initDPI();
        }
      }, 60);

    } else if (viewType === 'doppler') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-bullhorn" style="color:#0ea5e9;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Simulador Avanzado del Efecto Doppler & Cono de Mach (Vista Ampliada)';
      const p = document.getElementById('modalViewDoppler');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalDopplerSim) {
          modalDopplerSim = new DopplerEffectSimulator('modalSimDopplerCanvas');
          if (dopplerSim) {
            modalDopplerSim.sourceSpeed = dopplerSim.sourceSpeed;
            modalDopplerSim.observerSpeed = dopplerSim.observerSpeed;
            modalDopplerSim.soundSpeed = dopplerSim.soundSpeed;
            modalDopplerSim.sourceFreq = dopplerSim.sourceFreq;
            modalDopplerSim.showMachCone = dopplerSim.showMachCone;
          }

          document.getElementById('modalBtnDopplerPlay')?.addEventListener('click', (e) => {
            if (!modalDopplerSim) return;
            const isPlaying = modalDopplerSim.togglePlay();
            e.currentTarget.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
          });

          document.getElementById('modalBtnDopplerReset')?.addEventListener('click', () => {
            if (modalDopplerSim) modalDopplerSim.reset();
          });

          const btnModalAudio = document.getElementById('modalBtnDopplerAudio');
          btnModalAudio?.addEventListener('click', () => {
            if (!modalDopplerSim) return;
            const active = modalDopplerSim.toggleAudio();
            btnModalAudio.classList.toggle('active', active);
            btnModalAudio.innerHTML = active ? '<i class="fa-solid fa-volume-high"></i> Audio Activo' : '<i class="fa-solid fa-volume-xmark"></i> Audio Doppler';
          });

          const btnModalMach = document.getElementById('modalBtnDopplerMach');
          btnModalMach?.addEventListener('click', () => {
            if (!modalDopplerSim) return;
            modalDopplerSim.toggleMachCone();
            btnModalMach.classList.toggle('active', modalDopplerSim.showMachCone);
          });

          document.querySelectorAll('.modal-doppler-speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.modal-doppler-speed-btn').forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              if (modalDopplerSim) modalDopplerSim.setSpeed(parseFloat(e.currentTarget.dataset.speed));
            });
          });

          const sliderModalVs = document.getElementById('modalSliderDopplerVs');
          const valModalVs = document.getElementById('modalValDopplerVs');
          sliderModalVs?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalDopplerSim) modalDopplerSim.setSourceSpeed(val);
            if (valModalVs) valModalVs.textContent = `${val.toFixed(0)} m/s`;
          });
        } else {
          modalDopplerSim.initDPI();
        }
      }, 60);

    } else if (viewType === 'mindmap') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-network-wired" style="color:#10b981;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Mapa Mental: Universo Ondulatorio (Vista Panorámica)';
      const p = document.getElementById('modalViewMindmap');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalMindMapEngine) {
          modalMindMapEngine = new InteractiveMindMap('modalMindmapContainer');
        }
      }, 60);

    } else if (viewType === 'spacetime') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-atom" style="color:#38bdf8;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Polarización Transversal del Espacio-Tiempo (h+ y hx)';
      const p = document.getElementById('modalViewSpacetime');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalSpacetimeSim) {
          modalSpacetimeSim = new SpacetimePolarizationSimulator('modalSimSpacetimeCanvas');
          if (spacetimeSim) {
            modalSpacetimeSim.mode = spacetimeSim.mode;
            modalSpacetimeSim.strainA = spacetimeSim.strainA;
            modalSpacetimeSim.freq = spacetimeSim.freq;
          }

          const btnPolPlus = document.getElementById('modalBtnPolPlus');
          const btnPolCross = document.getElementById('modalBtnPolCross');
          const btnPolCirc = document.getElementById('modalBtnPolCircular');

          const setPolMode = (mode, activeBtn) => {
            if (modalSpacetimeSim) modalSpacetimeSim.setMode(mode);
            [btnPolPlus, btnPolCross, btnPolCirc].forEach(b => b?.classList.remove('active'));
            activeBtn?.classList.add('active');
          };

          btnPolPlus?.addEventListener('click', (e) => setPolMode('plus', e.currentTarget));
          btnPolCross?.addEventListener('click', (e) => setPolMode('cross', e.currentTarget));
          btnPolCirc?.addEventListener('click', (e) => setPolMode('circular', e.currentTarget));

          document.getElementById('modalBtnSpacetimePlay')?.addEventListener('click', (e) => {
            if (!modalSpacetimeSim) return;
            const isPlaying = modalSpacetimeSim.togglePlay();
            e.currentTarget.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
          });
          document.getElementById('modalBtnSpacetimeReset')?.addEventListener('click', () => {
            if (modalSpacetimeSim) modalSpacetimeSim.reset();
          });
          document.querySelectorAll('.modal-spacetime-speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.modal-spacetime-speed-btn').forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              if (modalSpacetimeSim) modalSpacetimeSim.setSpeed(parseFloat(e.currentTarget.dataset.speed));
            });
          });

          const sliderStrain = document.getElementById('modalSliderSpacetimeStrain');
          const valStrain = document.getElementById('modalValSpacetimeStrain');
          sliderStrain?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalSpacetimeSim) modalSpacetimeSim.setStrain(val);
            if (valStrain) valStrain.textContent = val.toFixed(2);
          });

          const sliderFreq = document.getElementById('modalSliderSpacetimeFreq');
          const valFreq = document.getElementById('modalValSpacetimeFreq');
          sliderFreq?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (modalSpacetimeSim) modalSpacetimeSim.setFreq(val);
            if (valFreq) valFreq.textContent = `${val.toFixed(2)} Hz`;
          });
        } else {
          modalSpacetimeSim.initDPI();
        }
      }, 60);

    } else if (viewType === 'ligo') {
      if (modalIcon) modalIcon.innerHTML = '<i class="fa-solid fa-wave-square" style="color:#0ea5e9;"></i>';
      if (modalGraphicTitle) modalGraphicTitle.textContent = 'Interferómetro LIGO & Chirp GW150914 (Vista Ampliada)';
      const p = document.getElementById('modalViewLigo');
      if (p) p.style.display = 'flex';

      setTimeout(() => {
        if (!modalLigoSim) {
          modalLigoSim = new LigoInterferometerSimulator('modalSimLigoCanvas');
          if (ligoSim) {
            modalLigoSim.m1 = ligoSim.m1;
            modalLigoSim.m2 = ligoSim.m2;
            modalLigoSim.distMpc = ligoSim.distMpc;
          }

          document.getElementById('modalBtnLigoPlay')?.addEventListener('click', (e) => {
            if (!modalLigoSim) return;
            const isPlaying = modalLigoSim.togglePlay();
            e.currentTarget.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
          });
          document.getElementById('modalBtnLigoReset')?.addEventListener('click', () => {
            if (modalLigoSim) modalLigoSim.reset();
          });
          document.querySelectorAll('.modal-ligo-speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.modal-ligo-speed-btn').forEach(b => b.classList.remove('active'));
              e.currentTarget.classList.add('active');
              if (modalLigoSim) modalLigoSim.setSpeed(parseFloat(e.currentTarget.dataset.speed));
            });
          });

          const btnChirp = document.getElementById('modalBtnPlayLigoChirp');
          btnChirp?.addEventListener('click', () => {
            if (!modalLigoSim) return;
            btnChirp.classList.add('playing');
            btnChirp.innerHTML = '<i class="fa-solid fa-wave-square fa-spin"></i> Emitiendo Chirp GW150914...';
            modalLigoSim.playChirpAudio(() => {
              btnChirp.classList.remove('playing');
              btnChirp.innerHTML = '<i class="fa-solid fa-volume-high"></i> Reproducir Chirp Gravitacional (Audio GW150914)';
            });
          });

          const sliderM1 = document.getElementById('modalSliderLigoM1');
          const valM1 = document.getElementById('modalValLigoM1');
          const sliderM2 = document.getElementById('modalSliderLigoM2');
          const valM2 = document.getElementById('modalValLigoM2');
          const sliderDist = document.getElementById('modalSliderLigoDist');
          const valDist = document.getElementById('modalValLigoDist');

          const updateModalLigoPhysics = () => {
            const m1 = parseFloat(sliderM1?.value || 36);
            const m2 = parseFloat(sliderM2?.value || 29);
            const dist = parseFloat(sliderDist?.value || 410);
            if (modalLigoSim) {
              modalLigoSim.setMasses(m1, m2);
              modalLigoSim.setDistance(dist);
            }
            if (valM1) valM1.textContent = `${m1} M☉`;
            if (valM2) valM2.textContent = `${m2} M☉`;
            if (valDist) valDist.textContent = `${dist} Mpc`;
          };

          sliderM1?.addEventListener('input', updateModalLigoPhysics);
          sliderM2?.addEventListener('input', updateModalLigoPhysics);
          sliderDist?.addEventListener('input', updateModalLigoPhysics);
        } else {
          modalLigoSim.initDPI();
        }
      }, 60);
    }
  }

  function initModalGeoGebra() {
    modalGgbEngine = new GeoGebraWavePlane('modalGgbCanvas', {
      A: ggbEngine ? ggbEngine.A : 1.8,
      lambda: ggbEngine ? ggbEngine.lambda : 3.0,
      f: ggbEngine ? ggbEngine.f : 1.0,
      phi: 0.0
    });

    document.getElementById('modalGgbZoomIn')?.addEventListener('click', () => modalGgbEngine.zoom(1.2));
    document.getElementById('modalGgbZoomOut')?.addEventListener('click', () => modalGgbEngine.zoom(0.83));
    document.getElementById('modalGgbResetView')?.addEventListener('click', () => modalGgbEngine.resetView());
    document.getElementById('modalGgbToolPan')?.addEventListener('click', () => modalGgbEngine.setTool('pan'));
    document.getElementById('modalGgbToolSelect')?.addEventListener('click', () => modalGgbEngine.setTool('select'));

    document.getElementById('modalGgbSliderA')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      modalGgbEngine.A = val;
      const lbl = document.getElementById('modalGgbValA');
      if (lbl) lbl.textContent = `${val.toFixed(1)} m`;
    });

    document.getElementById('modalGgbSliderLambda')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      modalGgbEngine.lambda = val;
      const lbl = document.getElementById('modalGgbValLambda');
      if (lbl) lbl.textContent = `${val.toFixed(1)} m`;
    });

    document.getElementById('modalGgbSliderF')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      modalGgbEngine.f = val;
      const lbl = document.getElementById('modalGgbValF');
      if (lbl) lbl.textContent = `${val.toFixed(1)} Hz`;
    });

    document.getElementById('modalChkCurveY1')?.addEventListener('change', (e) => modalGgbEngine.showY1 = e.target.checked);
    document.getElementById('modalChkCurveY2')?.addEventListener('change', (e) => modalGgbEngine.showY2 = e.target.checked);
    document.getElementById('modalChkCurveYtot')?.addEventListener('change', (e) => modalGgbEngine.showYtot = e.target.checked);

    // Play/Pause Modal GeoGebra
    const modalBtnPlay = document.getElementById('modalGgbBtnPlay');
    modalBtnPlay?.addEventListener('click', () => {
      if (!modalGgbEngine) return;
      const isPlaying = modalGgbEngine.togglePlay();
      modalBtnPlay.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });

    // Botones de velocidad Modal GeoGebra
    document.querySelectorAll('.modal-ggb-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.modal-ggb-speed-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseFloat(e.currentTarget.dataset.speed);
        if (modalGgbEngine) modalGgbEngine.setSpeed(speed);
        const slider = document.getElementById('modalGgbSliderSpeed');
        const lbl = document.getElementById('modalGgbValSpeed');
        if (slider) slider.value = speed;
        if (lbl) lbl.textContent = `${speed.toFixed(1)}x`;
      });
    });

    // Slider de velocidad Modal GeoGebra
    const modalGgbSliderSpeed = document.getElementById('modalGgbSliderSpeed');
    const modalGgbValSpeed = document.getElementById('modalGgbValSpeed');
    modalGgbSliderSpeed?.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (modalGgbEngine) modalGgbEngine.setSpeed(speed);
      if (modalGgbValSpeed) modalGgbValSpeed.textContent = `${speed.toFixed(1)}x`;
      document.querySelectorAll('.modal-ggb-speed-btn').forEach(b => {
        b.classList.toggle('active', Math.abs(parseFloat(b.dataset.speed) - speed) < 0.05);
      });
    });

    // Recuadro de Selección de Partícula Modal GeoGebra
    const modalGgbNumX = document.getElementById('modalGgbNumX');
    const modalGgbSliderX = document.getElementById('modalGgbSliderX');
    const modalGgbValX = document.getElementById('modalGgbValX');

    modalGgbNumX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && modalGgbEngine) {
        modalGgbEngine.setInspectX(val);
        if (modalGgbSliderX) modalGgbSliderX.value = val;
        if (modalGgbValX) modalGgbValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    modalGgbSliderX?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (modalGgbEngine) {
        modalGgbEngine.setInspectX(val);
        if (modalGgbNumX) modalGgbNumX.value = val.toFixed(2);
        if (modalGgbValX) modalGgbValX.textContent = `${val.toFixed(2)} m`;
      }
    });

    const modalGgbNumY = document.getElementById('modalGgbNumY');
    const modalGgbSliderY = document.getElementById('modalGgbSliderY');
    const modalGgbValY = document.getElementById('modalGgbValY');

    modalGgbNumY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && modalGgbEngine) {
        modalGgbEngine.setInspectY(val);
        if (modalGgbSliderY) modalGgbSliderY.value = val;
        if (modalGgbValY) modalGgbValY.textContent = `${val.toFixed(2)} m`;
        modalGgbEngine.notifyParticleModeChange(false);
      }
    });

    modalGgbSliderY?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (modalGgbEngine) {
        modalGgbEngine.setInspectY(val);
        if (modalGgbNumY) modalGgbNumY.value = val.toFixed(2);
        if (modalGgbValY) modalGgbValY.textContent = `${val.toFixed(2)} m`;
        modalGgbEngine.notifyParticleModeChange(false);
      }
    });

    document.getElementById('modalBtnGgbLockWave')?.addEventListener('click', () => {
      if (modalGgbEngine) {
        modalGgbEngine.setLockYToWave(true);
        modalGgbEngine.notifyParticleModeChange(true);
      }
    });

    document.getElementById('modalBtnGgbManualY')?.addEventListener('click', () => {
      if (modalGgbEngine) {
        modalGgbEngine.setLockYToWave(false);
        modalGgbEngine.notifyParticleModeChange(false);
      }
    });

    const modalGgbSliderT = document.getElementById('modalGgbSliderT');
    const modalGgbValT = document.getElementById('modalGgbValT');
    modalGgbSliderT?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      modalGgbEngine.setTime(val);
      if (modalGgbValT) modalGgbValT.textContent = `${val.toFixed(2)} s`;
    });

    const modalGgbSliderVecScale = document.getElementById('modalGgbSliderVecScale');
    const modalGgbValVecScale = document.getElementById('modalGgbValVecScale');
    modalGgbSliderVecScale?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      modalGgbEngine.setVectorScale(val);
      if (modalGgbValVecScale) modalGgbValVecScale.textContent = `${val.toFixed(1)}x`;
    });

    document.getElementById('modalChkGgbVy')?.addEventListener('change', (e) => {
      modalGgbEngine.setVectorVisibility(e.target.checked, undefined);
    });
    document.getElementById('modalChkGgbAy')?.addEventListener('change', (e) => {
      modalGgbEngine.setVectorVisibility(undefined, e.target.checked);
    });
  }

  function closeGraphicModal() {
    if (!graphicModal || !modalDialog) return;
    graphicModal.classList.remove('open', 'is-collapsed-parent');
    modalDialog.classList.remove('is-collapsed');
    isModalCollapsed = false;
    activeModalView = null;
  }

  function toggleCollapseModal() {
    if (!graphicModal || !modalDialog) return;
    isModalCollapsed = !isModalCollapsed;

    if (isModalCollapsed) {
      modalDialog.classList.add('is-collapsed');
      graphicModal.classList.add('is-collapsed-parent');
      if (btnModalCollapseIcon) btnModalCollapseIcon.className = 'fa-solid fa-window-maximize';
      if (modalBadgeMode) modalBadgeMode.textContent = 'MINIMIZADO';
    } else {
      modalDialog.classList.remove('is-collapsed');
      graphicModal.classList.remove('is-collapsed-parent');
      if (btnModalCollapseIcon) btnModalCollapseIcon.className = 'fa-solid fa-window-minimize';
      if (modalBadgeMode) modalBadgeMode.textContent = 'VENTANA EXPANDIDA';
    }
  }

  btnModalClose?.addEventListener('click', closeGraphicModal);
  btnModalCloseFooter?.addEventListener('click', closeGraphicModal);
  btnModalCollapse?.addEventListener('click', toggleCollapseModal);

  // Apertura de modales desde botones de las tarjetas
  document.getElementById('btnOpenGgbModal')?.addEventListener('click', () => openGraphicModal('geogebra'));
  document.getElementById('btnOpenSimModal')?.addEventListener('click', () => openGraphicModal('simulator'));
  document.getElementById('btnOpenStandingModal')?.addEventListener('click', () => openGraphicModal('standing'));
  document.getElementById('btnOpenDopplerModal')?.addEventListener('click', () => openGraphicModal('doppler'));
  document.getElementById('btnOpenMindmapModal')?.addEventListener('click', () => openGraphicModal('mindmap'));
  document.getElementById('btnOpenSpacetimeModal')?.addEventListener('click', () => openGraphicModal('spacetime'));
  document.getElementById('btnOpenLigoModal')?.addEventListener('click', () => openGraphicModal('ligo'));

  // Botones de la barra superior
  document.getElementById('btnHeaderTOC')?.addEventListener('click', () => navigateToPage(2));
  document.getElementById('btnHeaderGeoGebra')?.addEventListener('click', () => navigateToPage(7));
  document.getElementById('btnHeaderSim')?.addEventListener('click', () => navigateToPage(8));
  document.getElementById('btnHeaderDoppler')?.addEventListener('click', () => navigateToPage(10));
  document.getElementById('btnHeaderLIGO')?.addEventListener('click', () => navigateToPage(14));

  // Botón Abrir Cuaderno en Portada
  document.getElementById('btnOpenBook')?.addEventListener('click', () => {
    if (isSpreadMode) goToSpread(1);
    else goToPageSingle(2);
  });

  // Botón Volver a Portada en Contraportada
  document.getElementById('btnBackToCover')?.addEventListener('click', () => {
    if (isSpreadMode) goToSpread(0);
    else goToPageSingle(1);
  });

  // Clics en el Índice para saltar de sección
  document.querySelectorAll('.toc-jump-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page) navigateToPage(page);
    });
  });

  // Botones flotantes inferiores
  btnPrev?.addEventListener('click', prev);
  btnNext?.addEventListener('click', next);
  btnHome?.addEventListener('click', () => {
    if (isSpreadMode) goToSpread(0);
    else goToPageSingle(1);
  });

  btnSound?.addEventListener('click', () => {
    const isEnabled = audio.toggle();
    btnSound.innerHTML = isEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    btnSound.title = isEnabled ? "Sonido Activo" : "Sonido Silenciado";
  });

  btnFullscreen?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ========================================================================
  // Modal de Retratos e Invenciones Históricas (Página 4 & Astrofísica)
  // ========================================================================
  const historicalData = {
    huygens_retrato: {
      title: "Christiaan Huygens (1629–1695) • Retrato Oficial",
      src: "imagenes/huygens_retrato.jpg",
      desc: "Eminente matemático, astrónomo y físico neerlandés de la Royal Society y de la Academia de Ciencias de Francia. Pionero indiscutible de la teoría ondulatoria de la luz frente al modelo corpuscular newtoniano. En su célebre Traité de la lumière (1678/1690), concibió la propagación luminosa no como proyectiles materiales, sino como pulsos y ondas periódicas que avanzan a través de un medio elástico universal."
    },
    huygens_invento: {
      title: "Principio del Frente de Onda y Ondículas Secundarias (1678) • Huygens",
      src: "imagenes/huygens_invento.jpg",
      desc: "Lámina geométrica fundamental del Traité de la lumière. Ilustra la célebre construcción de Huygens: cada punto alcanzado por un frente de onda primario se convierte instantáneamente en el centro emisor de una ondícula esférica secundaria microscópica. La envolvente matemática tangencial común a todas estas ondas elementales conforma el nuevo frente de onda, deduciendo con rigor geométrico las leyes de reflexión, refracción ordinaria y la birrefringencia en cristales de calcita."
    },
    dalembert_retrato: {
      title: "Jean le Rond d'Alembert (1717–1783) • Retrato de la Ilustración",
      src: "imagenes/dalembert_retrato.jpg",
      desc: "Brillante matemático, filósofo y enciclopedista francés, coeditor junto a Denis Diderot de la monumental Encyclopédie. Pionero del cálculo infinitesimal y la mecánica teórica. En 1746, en sus Recherches sur la courbe que forme une corde tendue mise en vibration, formuló por primera vez en la historia de la física la ecuación diferencial en derivadas parciales lineal que gobierna la propagación de ondas mecánicas."
    },
    dalembert_invento: {
      title: "Ecuación Diferencial Clásica de Onda en Cuerdas Tensas (1746) • d'Alembert",
      src: "imagenes/dalembert_invento.jpg",
      desc: "Manuscrito y grabado analítico de la Academia de Ciencias de Berlín (1747). Al aplicar las leyes dinámicas de Newton a un segmento diferencial elástico infinitesimal bajo tensión uniforme $T_s$ y densidad lineal $\\mu$, d'Alembert dedujo $\\frac{\\partial^2 y}{\\partial x^2} = \\frac{1}{v^2}\\frac{\\partial^2 y}{\\partial t^2}$ con velocidad de fase $v = \\sqrt{T_s/\\mu}$, inaugurando formalmente la física matemática del continuo y la teoría de ondas."
    },
    euler_retrato: {
      title: "Leonhard Euler (1707–1783) • Retrato Imperial",
      src: "imagenes/euler_retrato.jpg",
      desc: "Titán de las matemáticas universales, miembro ilustre de las Academias de San Petersburgo y Berlín. Perfeccionó y expandió los métodos de análisis del continuo, la hidrodinámica y la teoría del sonido, demostrando que la forma de las perturbaciones ondulatorias en cuerdas y fluidos no requería limitarse a curvas analíticas regulares sino que admitía funciones arbitrarias con picos y quiebres físicos."
    },
    euler_invento: {
      title: "Solución de Ondas Viajeras Progresivas y Regresivas (1748) • Leonhard Euler",
      src: "imagenes/euler_invento.jpg",
      desc: "Tratado De vibratione chordarum (1748). Euler resolvió en forma analítica cerrada la ecuación de onda introduciendo las variables características $\\xi = x - vt$ y $\\eta = x + vt$. Demostró que la solución general es la superposición de dos ondas viajeras sin dispersión: $y(x,t) = f(x - vt) + g(x + vt)$, donde $f$ viaja progresivamente hacia la derecha a velocidad $v$, y $g$ viaja regresivamente hacia la izquierda, base de la acústica moderna."
    },
    young_retrato: {
      title: "Thomas Young (1773–1829) • El Último Polímata",
      src: "imagenes/young_retrato.jpg",
      desc: "Científico, médico, filólogo y polímata inglés. Descifró partes cruciales de la Piedra de Rosetta y revolucionó la óptica física. Ante el dominio absoluto del modelo corpuscular de Newton durante más de un siglo, Young defendió con tenacidad el modelo ondulatorio y enunció el principio fundamental de superposición de ondas: dos perturbaciones ondulatorias coexistentes en un punto pueden sumarse para reforzar su amplitud o cancelarse mutuamente."
    },
    young_invento: {
      title: "Experimento de la Doble Rendija y Franjas de Interferencia (1801) • Young",
      src: "imagenes/young_invento.jpg",
      desc: "Lámina experimental histórica presentada ante la Royal Society de Londres (1801). Young hizo incidir un haz coherente de luz solar a través de dos hendiduras estrechas adyacentes sobre una pantalla distante. En lugar de proyectar dos franjas luminosas, observó un patrón continuo de bandas brillantes (interferencia constructiva, $\\Delta r = m\\lambda$) y franjas oscuras (interferencia destructiva, $\\Delta r = (m+\\frac{1}{2})\\lambda$), demostrando de manera definitiva la naturaleza ondulatoria de la luz."
    },
    doppler_retrato: {
      title: "Christian Doppler (1803–1853) • Retrato Histórico",
      src: "imagenes/doppler_retrato.jpg",
      desc: "Matemático y físico austríaco, primer director del Instituto de Física de la Universidad de Viena. En 1842 presentó ante la Real Sociedad Bohemia de Ciencias su célebre monografía Über das farbige Licht der Doppelsterne, deduciendo matemáticamente que la frecuencia percibida de cualquier fenómeno ondulatorio periódico se altera cuando la fuente emisora y el receptor u observador poseen movimiento relativo a lo largo de la línea visual."
    },
    doppler_invento: {
      title: "El Efecto Doppler y el Experimento del Tren de Utrecht (1842–1845)",
      src: "imagenes/doppler_invento.jpg",
      desc: "Grabado conmemorativo del célebre experimento acústico de 1845 liderado por Christophorus Buys Ballot en el ferrocarril Utrecht-Ámsterdam. Una locomotora arrastraba una plataforma con trompetistas tocando una nota fija continua a toda velocidad; músicos con oído absoluto situados junto a la vía registraron el cambio en el tono acústico percibido: agudo al acercarse y grave al alejarse, confirmando experimentalmente la fórmula $f' = f \\frac{v \\pm v_o}{v \\mp v_s}$."
    },
    maxwell_retrato: {
      title: "James Clerk Maxwell (1831–1879) • Retrato en Cambridge",
      src: "imagenes/maxwell_retrato.jpg",
      desc: "Físico teórico escocés, primer profesor Cavendish de Física en Cambridge. Logró una de las mayores hazañas intelectuales en la historia de la ciencia moderna: la unificación completa de los fenómenos eléctricos, magnéticos y ópticos mediante el electromagnetismo clásico, considerado a la par de las contribuciones de Isaac Newton y Albert Einstein."
    },
    maxwell_invento: {
      title: "Ecuaciones del Campo y Ondas Electromagnéticas Transversales (1865)",
      src: "imagenes/maxwell_invento.jpg",
      desc: "Lámina histórica de A Dynamical Theory of the Electromagnetic Field (1865). Al formular su célebre corriente de desplazamiento, Maxwell desacopló los rotacionales y derivó la ecuación de onda tridimensional para el campo electromagnético: $\\nabla^2 \\vec{E} = \\mu_0\\varepsilon_0 \\frac{\\partial^2 \\vec{E}}{\\partial t^2}$. La velocidad de propagación teórica calculada a partir de constantes electromagnéticas de laboratorio, $c = 1/\\sqrt{\\mu_0\\varepsilon_0} \\approx 3\\times 10^8\\text{ m/s}$, coincidió exactamente con la velocidad de la luz, revelando que la luz es una onda transversal electromagnética."
    },
    einstein_ondas: {
      title: "Albert Einstein (1916) • Predicción de las Ondas Gravitacionales",
      src: "imagenes/einstein_ondas_gravitacionales.jpg",
      desc: "En 1916, Albert Einstein resolvió las ecuaciones linealizadas de la Relatividad General en el vacío demostrando que las perturbaciones de la métrica espaciotemporal $g_{\\mu\\nu} = \\eta_{\\mu\\nu} + h_{\\mu\\nu}$ se propagan como ondas transversales a la velocidad de la luz $c$. Formuló la ley de radiación del cuadrupolo gravitacional $h \\propto \\frac{2G}{c^4 r}\\ddot{Q}$, demostrando que la aceleración asimétrica de masas colosales radia energía gravitacional pura deformando el espaciotiempo en modos ortogonales $h_+$ y $h_\\times$."
    },
    ligo_deteccion: {
      title: "Observatorio LIGO y Detección GW150914 (2015–2017) • Premio Nobel",
      src: "imagenes/ligo_observatorio_detector.jpg",
      desc: "El 14 de septiembre de 2015, los interferómetros láser gemelos de LIGO (Hanford y Livingston) detectaron directamente por primera vez en la historia de la humanidad una onda gravitacional (evento GW150914). La señal provino de la colisión y fusión de dos agujeros negros de 36 y 29 masas solares a 1.300 millones de años luz, midiendo deformaciones espaciales en los brazos de 4 km inferiores a $10^{-18}\\text{ m}$. El hito inauguró la astronomía gravitacional y fue premiado con el Nobel de Física 2017 para Rainer Weiss, Barry Barish y Kip Thorne."
    },
    transverse_waves: {
      title: "Ondas Transversales: Mecánica, Electromagnetismo y Espacio-Tiempo",
      src: "imagenes/ondas_transversales_comparativa.jpg",
      desc: "Comparativa tridimensional de ondas transversales. En una cuerda elástica, las partículas oscilan perpendiculares a la propagación con velocidad $v=\\sqrt{T_s/\\mu}$; en ondas electromagnéticas, los campos $\\vec{E}$ y $\\vec{B}$ son perpendiculares entre sí y al vector de onda $\\vec{k}$; en ondas gravitacionales, el tensor métrico cuadrupolar en gauge Transverse-Traceless ($h_{\\mu\\nu}^{TT}$) deforma el espaciotiempo transversalmente en modos $h_+$ y $h_\\times$ rotados a 45 grados."
    }
  };

  window.openHistoricalModal = function(key) {
    const data = historicalData[key];
    if (!data) return;
    const modal = document.getElementById('historicalImageModal');
    if (!modal) return;
    document.getElementById('histModalTitleText').textContent = data.title;
    const img = document.getElementById('histModalImg');
    img.src = data.src;
    img.alt = data.title;
    const descEl = document.getElementById('histModalDesc');
    descEl.textContent = data.desc;
    if (window.renderMathInElement) {
      window.renderMathInElement(descEl, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        macros: {
          "\\dddot": "\\overset{\\dots}"
        }
      });
    }
    modal.classList.add('open');
  };

  window.closeHistoricalModal = function() {
    const modal = document.getElementById('historicalImageModal');
    if (modal) modal.classList.remove('open');
  };

  const histModal = document.getElementById('historicalImageModal');
  if (histModal) {
    histModal.addEventListener('click', (e) => {
      if (e.target === histModal) closeHistoricalModal();
    });
  }

  // Navegación por teclado (Flechas izquierda/derecha, Esc)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
    else if (e.key === 'Escape') {
      closeGraphicModal();
      closeHistoricalModal();
    }
  });

  // Manejo de cambio de tamaño de ventana
  window.addEventListener('resize', () => {
    const shouldBeSpread = checkDefaultSpreadMode();
    if (shouldBeSpread !== isSpreadMode) {
      isSpreadMode = shouldBeSpread;
      if (lblSpreadMode) lblSpreadMode.textContent = isSpreadMode ? "Doble Página" : "Página Simple";
      populateDropdown();
      if (isSpreadMode) goToSpread(currentSpread);
      else goToPageSingle(currentSpread === 0 ? 1 : currentSpread * 2);
    }
    if (ggbEngine) ggbEngine.initDPI();
    if (tautStringSim) tautStringSim.initDPI();
    if (standingSim) standingSim.initDPI();
    if (dopplerSim) dopplerSim.initDPI();
    if (spacetimeSim) spacetimeSim.initDPI();
    if (ligoSim) ligoSim.initDPI();
  });

  // Carga inicial
  populateDropdown();
  const urlParams = new URLSearchParams(window.location.search);
  const paramPage = parseInt(urlParams.get('page'));
  const paramSpread = parseInt(urlParams.get('spread'));

  if (!isNaN(paramPage) && paramPage >= 1 && paramPage <= totalPages) {
    navigateToPage(paramPage);
  } else if (!isNaN(paramSpread) && paramSpread >= 0 && paramSpread < totalSpreads) {
    if (isSpreadMode) goToSpread(paramSpread);
    else goToPageSingle(paramSpread === 0 ? 1 : paramSpread * 2);
  } else {
    if (isSpreadMode) goToSpread(0);
    else goToPageSingle(1);
  }
});
