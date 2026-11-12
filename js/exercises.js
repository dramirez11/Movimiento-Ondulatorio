/**
 * Módulo Pedagógico de Ejercicios y Resolución Paso a Paso (5 Fases)
 * Cuaderno Digital de Física III - Movimiento Ondulatorio
 * Universidad Tecnológica de Pereira (UTP)
 * Autores: David Alejandro Ramirez Bolaños, Steven Vélez Garces, Sergio Andrés Velásquez Arana
 * 
 * Código cromático estricto:
 * 1) Datos en AZUL (#2563eb)
 * 2) Incógnitas en ROJO (#dc2626)
 * 3) Fórmulas necesarias
 * 4) Despeje y valores determinados en NARANJA (#ea580c)
 * 5) Validación de resultados y conclusiones en VERDE (#14532d)
 */

class ExerciseEngine {
  constructor() {
    this.bindInteractiveCalculator();
  }

  bindInteractiveCalculator() {
    const btnSolve = document.getElementById('btnSolveCustom');
    if (!btnSolve) return;

    btnSolve.addEventListener('click', () => {
      this.solveCustomProblem();
    });
  }

  solveCustomProblem() {
    const tsInput = parseFloat(document.getElementById('inputTs')?.value || 80.0);
    const muInput = parseFloat(document.getElementById('inputMu')?.value || 0.02);
    const aInput = parseFloat(document.getElementById('inputA')?.value || 0.05);
    const fInput = parseFloat(document.getElementById('inputF')?.value || 10.0);

    const Ts = Math.max(0.1, tsInput);
    const mu = Math.max(0.0001, muInput);
    const A = Math.max(0.001, aInput);
    const f = Math.max(0.1, fInput);

    // 1. Cálculos Físicos de Ondas Mecánicas
    const v = Math.sqrt(Ts / mu);
    const lambda = v / f;
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * f;
    const T = 1 / f;
    const vYmax = omega * A;
    const aYmax = Math.pow(omega, 2) * A;
    const Pmed = 0.5 * mu * v * Math.pow(omega, 2) * Math.pow(A, 2);

    const resultContainer = document.getElementById('customSolutionContainer');
    if (!resultContainer) return;

    resultContainer.innerHTML = `
      <div class="exercise-card" style="border-left: 5px solid #2563eb;">
        <div class="exercise-title">
          <i class="fa-solid fa-graduation-cap" style="color:#2563eb;"></i>
          Resolución Generada Paso a Paso (Metodología Pedagógica Universitaria)
        </div>
        
        <div class="exercise-statement">
          <strong>Enunciado Personalizado:</strong> Una cuerda tensa horizontal de densidad lineal constante 
          <span class="data-tag-blue">μ = ${mu.toFixed(4)} kg/m</span> se somete a una fuerza de tensión axial de 
          <span class="data-tag-blue">Ts = ${Ts.toFixed(2)} N</span>. Un oscilador armónico situado en un extremo comunica una perturbación sinusoidal transversal de amplitud 
          <span class="data-tag-blue">A = ${A.toFixed(3)} m</span> y frecuencia de oscilación 
          <span class="data-tag-blue">f = ${f.toFixed(2)} Hz</span> que viaja en la dirección positiva del eje $x$. Formule la función de onda y determine todos los parámetros cinemáticos, dinámicos y energéticos.
        </div>

        <!-- FASE 1: DATOS (AZUL) -->
        <div class="phase-box phase-datos">
          <div class="phase-header-datos">
            <i class="fa-solid fa-circle-info"></i>
            1. Identificación de Datos Conocidos (Color Azul):
          </div>
          <div>
            • Tensión mecánica de la cuerda: <span class="data-tag-blue">Ts = ${Ts.toFixed(2)} N</span><br>
            • Densidad lineal de masa: <span class="data-tag-blue">μ = ${mu.toFixed(4)} kg/m</span><br>
            • Amplitud de la onda: <span class="data-tag-blue">A = ${A.toFixed(3)} m</span><br>
            • Frecuencia de la fuente: <span class="data-tag-blue">f = ${f.toFixed(2)} Hz</span>
          </div>
        </div>

        <!-- FASE 2: INCÓGNITAS (ROJO) -->
        <div class="phase-box phase-incognitas">
          <div class="phase-header-incognitas">
            <i class="fa-solid fa-circle-question"></i>
            2. Identificación de Incógnitas a Resolver (Color Rojo):
          </div>
          <div>
            • Rapidez de propagación de la onda transversal: <span class="unknown-tag-red">v = ? [m/s]</span><br>
            • Longitud de onda espacial: <span class="unknown-tag-red">λ = ? [m]</span><br>
            • Número de onda angular: <span class="unknown-tag-red">k = ? [rad/m]</span><br>
            • Frecuencia angular: <span class="unknown-tag-red">ω = ? [rad/s]</span><br>
            • Rapidez transversal máxima de las partículas: <span class="unknown-tag-red">v_{y,max} = ? [m/s]</span><br>
            • Aceleración transversal máxima: <span class="unknown-tag-red">a_{y,max} = ? [m/s²]</span><br>
            • Potencia media transportada: <span class="unknown-tag-red">P_{med} = ? [W]</span><br>
            • Ecuación general de la función de onda: <span class="unknown-tag-red">y(x,t) = ?</span>
          </div>
        </div>

        <!-- FASE 3: FÓRMULAS NECESARIAS -->
        <div class="phase-box phase-formulas">
          <div class="phase-header-formulas">
            <i class="fa-solid fa-square-root-variable"></i>
            3. Ecuaciones y Fórmulas Físicas Necesarias:
          </div>
          <div style="font-size: 0.95rem; line-height: 1.8;">
            (a) Rapidez en cuerda elástica: $$ v = \\sqrt{\\frac{T_s}{\\mu}} $$
            (b) Longitud de onda y periodo: $$ \\lambda = \\frac{v}{f}, \\quad T = \\frac{1}{f} $$
            (c) Parámetros angulares: $$ k = \\frac{2\\pi}{\\lambda}, \\quad \\omega = 2\\pi f $$
            (d) Cinemática transversal de partículas: $$ v_{y,\\max} = \\omega A, \\quad a_{y,\\max} = \\omega^2 A $$
            (e) Potencia media transferida: $$ P_{\\text{med}} = \\frac{1}{2} \\mu v \\omega^2 A^2 $$
            (f) Función de onda armónica: $$ y(x,t) = A \\sin(kx - \\omega t) $$
          </div>
        </div>

        <!-- FASE 4: SUSTITUCIÓN Y DESPEJE (NARANJA) -->
        <div class="phase-box phase-despeje">
          <div class="phase-header-despeje">
            <i class="fa-solid fa-calculator"></i>
            4. Sustitución de Datos, Conversión y Despeje (Valores Determinados en Naranja):
          </div>
          <div class="despeje-container" style="font-size: 0.92rem; line-height: 1.6;">
            <p style="margin: 4px 0 2px;"><strong>Paso 4.1: Cálculo de la rapidez de propagación $v$:</strong></p>
            <div class="despeje-row">
              $$ v = \\sqrt{\\frac{${Ts.toFixed(2)} \\text{ N}}{${mu.toFixed(4)} \\text{ kg/m}}} = \\sqrt{${(Ts/mu).toFixed(2)}} \\implies $$
              <span class="solved-tag-orange">v = ${v.toFixed(3)} m/s</span>
            </div>

            <p style="margin: 6px 0 2px;"><strong>Paso 4.2: Cálculo de la longitud de onda $\\lambda$ y parámetros $k$, $\\omega$:</strong></p>
            <div class="despeje-row">
              $$ \\lambda = \\frac{${v.toFixed(3)} \\text{ m/s}}{${f.toFixed(2)} \\text{ Hz}} \\implies $$
              <span class="solved-tag-orange">λ = ${lambda.toFixed(3)} m</span>
            </div>
            <div class="despeje-row">
              $$ k = \\frac{2\\pi}{${lambda.toFixed(3)} \\text{ m}} \\implies $$
              <span class="solved-tag-orange">k = ${k.toFixed(3)} rad/m</span>
            </div>
            <div class="despeje-row">
              $$ \\omega = 2\\pi (${f.toFixed(2)} \\text{ s}^{-1}) \\implies $$
              <span class="solved-tag-orange">ω = ${omega.toFixed(3)} rad/s</span>
            </div>

            <p style="margin: 6px 0 2px;"><strong>Paso 4.3: Cinemática transversal máxima de las partículas:</strong></p>
            <div class="despeje-row">
              $$ v_{y,\\max} = (${omega.toFixed(3)} \\text{ rad/s})(${A.toFixed(3)} \\text{ m}) \\implies $$
              <span class="solved-tag-orange">v_{y,max} = ${vYmax.toFixed(3)} m/s</span>
            </div>
            <div class="despeje-row">
              $$ a_{y,\\max} = (${omega.toFixed(3)} \\text{ rad/s})^2 (${A.toFixed(3)} \\text{ m}) \\implies $$
              <span class="solved-tag-orange">a_{y,max} = ${aYmax.toFixed(2)} m/s²</span>
            </div>

            <p style="margin: 6px 0 2px;"><strong>Paso 4.4: Potencia media transmitida y función de onda:</strong></p>
            <div class="despeje-row">
              $$ P_{\\text{med}} = \\frac{1}{2}(${mu.toFixed(4)})(${v.toFixed(3)})(${omega.toFixed(3)})^2 (${A.toFixed(3)})^2 \\implies $$
              <span class="solved-tag-orange">P_{med} = ${Pmed.toFixed(3)} W</span>
            </div>
            <div class="despeje-row">
              $$ y(x,t) = (${A.toFixed(3)}) \\sin(${k.toFixed(3)}x - ${omega.toFixed(3)}t) \\text{ [m]} $$
            </div>
          </div>
        </div>

        <!-- FASE 5: VALIDACIÓN Y ANÁLISIS FÍSICO (VERDE) -->
        <div class="phase-box phase-validation">
          <div class="phase-header-validation">
            <i class="fa-solid fa-square-check"></i>
            5. Validación Dimensional y Análisis de Coherencia Física:
          </div>
          <div style="font-size: 0.82rem; color: #14532d; line-height: 1.5;">
            <strong>• Análisis Dimensional:</strong> $[v] = \\sqrt{\\frac{\\text{kg}\\cdot\\text{m}/\\text{s}^2}{\\text{kg}/\\text{m}}} = \\sqrt{\\frac{\\text{m}^2}{\\text{s}^2}} = \\text{m/s}$. Coincidencia dimensional estricta.<br>
            <strong>• Comprobación de Fase:</strong> $v = \\frac{\\omega}{k} = \\frac{${omega.toFixed(3)}}{${k.toFixed(3)}} = ${ (omega/k).toFixed(3) } \\text{ m/s} = v$, validando la consistencia interna entre la formulación cinemática y la dinámica de cuerdas tensas.<br>
            <strong>• Distinción Física Crucial:</strong> Se comprueba que la rapidez de propagación de la onda ($v = ${v.toFixed(2)} \\text{ m/s}$) es independiente de la rapidez de movimiento de las partículas del medio ($v_{y,\\max} = ${vYmax.toFixed(2)} \\text{ m/s}$), ratificando que las ondas transportan energía y momento lineal sin transporte neto de materia.
          </div>
        </div>
      </div>
    `;

    if (window.renderMathInElement) {
      window.renderMathInElement(resultContainer, {
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
}

window.ExerciseEngine = ExerciseEngine;
