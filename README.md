# 🌊 Cuaderno Digital Interactivo de Física III: Movimiento Ondulatorio

[![Licencia](https://img.shields.io/badge/Licencia-Educativa%20UTP-blue.svg)](#-derechos-de-autor-y-propiedad-intelectual)
[![Institución](https://img.shields.io/badge/Instituci%C3%B3n-Universidad%20Tecnol%C3%B3gica%20de%20Pereira-gold.svg)](https://www.utp.edu.co/)
[![Asignatura](https://img.shields.io/badge/Asignatura-F%C3%ADsica%20III%20(Ondas)-red.svg)](#)
[![Multiplataforma](https://img.shields.io/badge/Plataformas-Android%20%7C%20iOS%20%7C%20Mac%20%7C%20Windows-green.svg)](#)
[![Tecnologías](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20ES6%2B-orange.svg)](#)

---

## 📖 Descripción del Proyecto

El **Cuaderno Digital Interactivo de Física III (Volumen II)** es una plataforma científica, didáctica e interactiva de vanguardia dedicada al estudio exhaustivo del **Movimiento Ondulatorio y las Ondas Mecánicas**.

Diseñado bajo la metáfora inmersiva de un **libro físico de hojas abiertas con textura de cuaderno**, combina rigor matemático, deducciones analíticas de la física teórica, simulaciones en tiempo real a 60 FPS, un plano cartesiano interactivo estilo GeoGebra para perfiles de onda y un solucionador pedagógico de problemas estructurado en cinco fases normativas.

Este proyecto fue desarrollado como entrega académica para la asignatura de **Física III (Ondas y Oscilaciones)** en la **Universidad Tecnológica de Pereira (UTP)**.

---

## 👥 Autores y Equipo de Desarrollo

Proyecto realizado por los estudiantes de la **Universidad Tecnológica de Pereira**:

* 👨‍💻 **David Alejandro Ramirez Bolaños**
* 👨‍💻 **Steven Vélez Garces**
* 👨‍💻 **Sergio Andrés Velásquez Arana**

---

## 🏛️ Contexto Académico e Institucional

* **Institución:** Universidad Tecnológica de Pereira (UTP)
* **Facultad / Departamento:** Departamento de Física / Facultad de Ciencias Básicas
* **Asignatura:** Física III (Ondas y Oscilaciones)
* **Tema Principal:** Ondas Mecánicas Transversales y Longitudinales, Ecuación de Onda de d'Alembert, Transporte de Potencia y Energía, Superposición e Interferencia, Ondas Estacionarias y Modos Normales, Efecto Doppler Acústico

---

## 🌟 Características Principales

### 1. 📚 Experiencia Editorial Adaptativa (Doble Página & Móvil Vertical)
* **Modo Libro Abierto (Doble Página):** En pantallas panorámicas (computadoras de escritorio, laptops y tablets en horizontal), despliega páginas par e impar simultáneamente con efecto de lomo central y animaciones 3D fluidas de paso de página.
* **Modo Página Simple Automático:** En smartphones (Android e iOS/iPhone) y dispositivos en orientación vertical (*portrait*), conmuta automáticamente a una página completa por vista para aprovechar el 100% del ancho de pantalla sin deformaciones.
* **Efectos Acústicos Inmersivos:** Síntesis sonora estéreo en tiempo real mediante la Web Audio API que emula el roce táctil de las hojas de un cuaderno físico.

### 2. 🗺️ Mapa Mental Conceptual Dinámico
* Taxonomía completa del Movimiento Ondulatorio (Cinemática, Dinámica de Medios Elásticos, Energía e Intensidad, Fenómenos Ondulatorios y Unidades SI).
* Gráficos vectoriales SVG escalables con distribución espacial amplia, cero solapamiento de textos y curvas Bézier fluidas.
* Navegación táctil completa con arrastre (*pan*) y gesto de pellizco para zoom (*pinch-to-zoom*) en dispositivos móviles y de escritorio.

### 3. 📈 Motor Gráfico de Plano Cartesiano Propio (Estilo GeoGebra)
* Lienzo HTML5 Canvas con soporte de alta densidad (Retina / High DPI).
* Visualización simultánea o selectiva de:
  * Onda Progresiva hacia la derecha: $y_1(x,t) = A \sin(kx - \omega t + \phi)$
  * Onda Regresiva hacia la izquierda: $y_2(x,t) = A \sin(kx + \omega t)$
  * Onda Resultante por Superposición / Onda Estacionaria: $y_{\text{tot}}(x,t) = y_1(x,t) + y_2(x,t)$
* Ajuste interactivo en tiempo real de: Amplitud ($A$), Longitud de onda ($\lambda$), Frecuencia ($f$) y Fase inicial ($\phi$).
* Herramientas de navegación: Arrastre libre, zoom continuo, restablecimiento de vista y paleta de colores/estilos.
* Cursor inteligente con lectura de coordenadas espaciales instantáneas $(x, y(x,t))$.

### 4. 🧪 Laboratorio Virtual de Simulaciones Físicas (60 FPS)
* **Simulador de Cuerda Tensa con Perlas:** Animación continua de una onda transversal a lo largo de una cuerda elástica compuesta de partículas enlazadas. Muestra los vectores de velocidad transversal de partícula $\vec{v}_y$, telemetría en tiempo real de velocidad de fase $v = \sqrt{T_s/\mu}$, potencia media transmitida $P_{\text{med}}$ y controles deslizantes de tensión $T_s$, densidad lineal $\mu$, amplitud $A$ y frecuencia $f$.
* **Simulador de Modos Normales y Ondas Estacionarias:** Visualización interactiva de una cuerda fija en ambos extremos con selector de armónicos ($n = 1, 2, 3, 4, 5$). Marcado y rotulación explícita de **Nodos** (puntos rojos en reposo absoluto) y **Antinodos/Vientres** (puntos verdes oscilantes con amplitud máxima $2A$).
* **Simulador de Efecto Doppler Acústico:** Visualización de fuente sonora móvil que emite frentes de onda circulares en expansión, ilustrando la compresión de ondas al acercarse ($f' > f$) y la dilatación al alejarse ($f' < f$).
* **Ventana Modal Expandible y Colapsable:** Permite ampliar cualquier simulación a pantalla casi completa (92vw / 86vh) o minimizarla como widget flotante en la esquina inferior para continuar la lectura del cuaderno sin interrumpir la animación.

### 5. 📝 Taller de Problemas con Metodología Didáctica de 5 Fases
1. **Fase 1 (Azul):** Identificación rigurosa de Datos y Parámetros del SI.
2. **Fase 2 (Rojo):** Determinación explícita de Incógnitas a resolver.
3. **Fase 3 (Gris):** Selección del Modelo Teórico y Ecuaciones Físicas Fundamentales.
4. **Fase 4 (Naranja):** Despeje algebraico analítico y sustitución numérica paso a paso.
5. **Fase 5 (Verde):** Validación dimensional y análisis de coherencia física de los resultados.
* Incluye un **Generador y Validador Interactivo** de problemas para cuerdas elásticas y ondas viajeras.

### 6. 📐 Rigor Matemático KaTeX & Álgebra Simbólica
* Renderizado nítido de fórmulas matemáticas y ecuaciones diferenciales mediante KaTeX.
* Soporte para cálculo y verificación simbólica a través de Nerdamer.js.

### 7. 📱 Compatibilidad Móvil y Multiplataforma Total
* Optimizado para **Android, iOS (iPhone/iPad), macOS, Windows y Linux**.
* Soporte de áreas seguras (`viewport-fit=cover`, `env(safe-area-inset-bottom)`).
* Altura dinámica con unidades `100dvh` para evitar saltos molestos con las barras de navegación móviles.
* Manifiesto PWA (`manifest.json`) y Service Worker (`sw.js`) para instalación como aplicación web nativa y uso offline.

---

## 🗂️ Estructura del Repositorio

```text
cuaderno_II/
├── css/
│   └── styles.css           # Sistema de diseño editorial, textura de plantilla y estilos responsivos
├── imagenes/
│   ├── Física III_ Movimiento Ondulatorio.png  # Portada oficial de alta definición (UTP)
│   └── plantilla.jpeg       # Textura oficial de hoja de cuaderno digital
├── js/
│   ├── app.js               # Orquestador central de la aplicación y navegación entre páginas
│   ├── audio.js             # Sintetizador Web Audio API para efectos acústicos de paso de página
│   ├── exercises.js         # Motor didáctico del taller interactivo y validador en 5 fases
│   ├── geogebra_canvas.js   # Motor del plano cartesiano de ondas en Canvas 2D estilo GeoGebra
│   ├── mindmap.js           # Mapa mental conceptual interactivo en SVG con zoom y arrastre
│   └── simulators.js        # Laboratorio virtual (Cuerda tensa a 60 FPS, Modos normales y Doppler)
├── index.html               # Estructura semántica completa de las 14 páginas del cuaderno
├── manifest.json            # Configuración Progressive Web App (PWA)
├── sw.js                    # Service Worker para almacenamiento en caché y uso offline
└── README.md                # Documentación oficial del proyecto
```

---

## 🚀 Puesta en Marcha / Cómo Ejecutarlo

El proyecto ha sido concebido bajo una arquitectura web estándar sin dependencias de compilación pesadas, por lo que **no requiere instalación previa de Node.js ni bundlers**.

### Opción 1: Abrir directamente en el navegador
1. Ve a la carpeta `cuaderno_II`.
2. Haz doble clic en el archivo [`index.html`](index.html) para abrirlo en tu navegador favorito (Chrome, Firefox, Safari, Edge).

### Opción 2: Servidor local ligero (Recomendado)
Puedes iniciar un servidor web local usando cualquiera de las siguientes herramientas:

* **Con Python:**
  ```bash
  cd cuaderno_II
  python -m http.server 8080
  ```
  Luego abre en tu navegador: `http://localhost:8080/`

* **Con Node.js (npx serve):**
  ```bash
  cd cuaderno_II
  npx serve .
  ```

* **Con la extensión Live Server de VS Code:**
  Haz clic derecho sobre `index.html` en la carpeta `cuaderno_II` y selecciona *"Open with Live Server"*.

---

## ⚖️ Derechos de Autor y Propiedad Intelectual

> [!IMPORTANT]
> Proyecto de carácter académico desarrollado para la cátedra de **Física III (Ondas y Oscilaciones)** de la **Universidad Tecnológica de Pereira (UTP)**.
> 
> **Autores:**
> * David Alejandro Ramirez Bolaños
> * Steven Vélez Garces
> * Sergio Andrés Velásquez Arana
