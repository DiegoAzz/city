# STREET EXPLORER MOBILE

> Videojuego móvil de exploración de ciudades reales sobre OpenStreetMap en 3D estilizado e isométrico.
> **Dispositivo objetivo prioritario:** OPPO Reno14 F 5G (Snapdragon 6 Gen 1, Adreno 710, AMOLED 2372 × 1080).

---

## 1. Estado de Implementación: Fase 0 y Fase 1 Completadas

Este repositorio contiene la implementación completa y funcional de la **Fase 0** (Viabilidad y fundamentos) y la **Fase 1** (Personaje y controles), siguiendo estrictamente el PRD v1.0.

### Resumen de logros Fase 0 y 1:
- [x] **Stack base moderno:** Vite 6 + TypeScript en modo estricto (`"strict": true`) sin `any` implícitos.
- [x] **Integración gráfica eficiente con MapLibre GL JS v5:** Capa personalizada 3D (`CustomLayerInterface`) que **comparte el mismo contexto WebGL** con Three.js, eliminando la sobrecarga de un segundo canvas superpuesto.
- [x] **Zona verificada de Cartagena de Indias:** Centro Histórico (Plaza de Santo Domingo `[-75.5520, 10.4233]`, Torre del Reloj, Plaza San Pedro Claver) con límites acotados (~1.8 km²) para optimizar memoria.
- [x] **Fuente de datos cartográficos compatible:** OpenFreeMap / OpenStreetMap con atribución visible reglamentaria (ODbL) y soporte de extrusiones 3D volumétricas de edificios.
- [x] **Personaje 3D original y estilizado:** Modelo de bajo coste poligonal compuesto por cabeza expresiva, gorra de explorador con visera, torso con chaqueta turquesa, mochila de viaje, extremidades articuladas y sombra elíptica dinámica sobre el suelo.
- [x] **Animaciones cinemáticas procedurales:** Sistema de animación sinusoidal sin pesados esqueletos (`idle` con respiración y balanceo sutil, `walk` con zancada sincronizada de piernas y brazos opuestos, `run` con inclinación hacia adelante y zancada rápida, y rotación suave `turn` hacia el vector de movimiento).
- [x] **Conversión métrica y proyección geográfica:** Simulación física en metros por segundo (caminar: 2.4 m/s, correr: 5.2 m/s) convertida a incrementos geodésicos en WGS84, respetando la latitud de Cartagena.
- [x] **Joystick virtual táctil:** Implementado con Pointer Events multitouch, captura de puntero (`setPointerCapture`), zona muerta configurable, vector normalizado proporcional y retorno suave al centro.
- [x] **Cámara isométrica suave:** Ángulo de inclinación de 52° con seguimiento interpolado (lerp), alternador a vista aérea cenital (0°) y botón para recentrar de inmediato en el personaje.
- [x] **Perfiles de rendimiento para GPU Adreno 710:**
  - 🔋 **Ahorro (30 FPS):** Pixel Ratio 1.0, edificios 3D planos para ahorro térmico.
  - ⚡ **Equilibrado (45 FPS - Predeterminado):** Pixel Ratio 1.25, balance óptimo para Snapdragon 6 Gen 1.
  - 🚀 **Alto (60 FPS):** Pixel Ratio 1.5, máxima nitidez y fluidez.
  - *Auto-adaptación térmica:* Detección de caídas sostenidas de FPS (>5 s) con degradación escalonada preventiva.
  - *Gestión en segundo plano:* Pausa inmediata del bucle de render cuando la aplicación o pestaña pasa a segundo plano (`visibilitychange`).
- [x] **Modo Transmisión / Grabación:** Oculta elementos no esenciales de la interfaz para capturar vídeo limpio de la pantalla o emitir sin botones invasivos.
- [x] **PWA lista para instalación:** Manifest web, iconos generados (192x192, 512x512 maskable) y service worker preconfigurado.
- [x] **Pruebas unitarias automatizadas con Vitest:** 12 pruebas unitarias pasando (proyección métrica, distancias de Cartagena, física del personaje, perfiles de calidad).

---

## 2. Arquitectura del Código

```text
street-explorer-mobile/
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── app/
│   │   ├── config.ts              # Configuración de Cartagena, cámara y velocidades
│   │   └── game.ts                # Coordinador principal del bucle de juego
│   ├── map/
│   │   ├── map-engine/
│   │   │   ├── map-manager.ts     # Instancia MapLibre GL, capas vectoriales y edificios 3D
│   │   │   └── three-layer.ts     # Capa personalizada Three.js compartiendo contexto WebGL
│   │   ├── geodata/
│   │   │   └── cartagena.ts       # Coordenadas verificadas, hitos y límites urbanos
│   │   └── projection/
│   │       └── mercator.ts        # Conversión matemática metros <-> grados WGS84
│   ├── character/
│   │   ├── model/
│   │   │   └── character-mesh.ts  # Malla 3D procedural estilizada y materiales compartidos
│   │   ├── animation/
│   │   │   └── character-animator.ts # Estados de animación procedural (idle, walk, run, turn)
│   │   └── controller/
│   │       └── character-controller.ts # Estado físico, velocidad métrica y orientación
│   ├── camera/
│   │   └── camera-controller.ts   # Modos Isométrico y Aéreo con interpolación suave
│   ├── controls/
│   │   └── virtual-joystick.ts    # Joystick táctil por Pointer Events con zona muerta
│   ├── graphics/
│   │   └── quality-manager.ts     # Perfiles 30/45/60 FPS, DPR dinámico y control térmico
│   ├── performance/
│   │   └── perf-monitor.ts        # Métricas de FPS, ms por fotograma y telemetría
│   ├── storage/
│   │   └── local-store.ts         # Persistencia en localStorage de perfil, cámara y posición
│   ├── ui/
│   │   ├── hud.ts                 # Enlace de botones táctiles, toast y marcadores
│   │   └── presentation-mode.ts   # Modo transmisión libre de menús
│   ├── style.css                  # Estilos adaptados a notch/safe-areas y touch-action: none
│   └── main.ts                    # Punto de entrada y verificación WebGL
├── tests/
│   ├── projection.test.ts         # Pruebas de proyección geodésica y límites de Cartagena
│   ├── character.test.ts          # Pruebas de física, cinemática y estados del personaje
│   └── quality.test.ts            # Pruebas de perfiles de calidad y adaptación de FPS
├── vite.config.ts                 # Configuración de Vite con soporte HTTPS y PWA
├── tsconfig.json                  # TypeScript modo estricto
└── package.json                   # Dependencias y scripts de ejecución
```

---

## 3. Instrucciones de Ejecución y Pruebas

### 3.1. Requisitos Previos
- Node.js versión 18 o superior (probado en Node v26).
- Conexión a internet para la carga inicial de los mapas vectoriales.

### 3.2. Ejecución en Navegador de Escritorio (HTTP)

```bash
cd street-explorer-mobile
npm run dev
```

Abre en tu navegador de escritorio: `http://localhost:5173/`.  
Usa el ratón sobre el joystick táctil inferior izquierdo, o interactúa con los botones de cámara, correr y centrado.

---

### 3.3. Instrucciones para Probar en tu OPPO Reno14 F 5G (HTTPS / LAN)

Para instalar la PWA y permitir que el navegador de Android habilite todas las APIs modernas sin restricciones de seguridad, se proporciona soporte nativo HTTPS local con certificado autofirmado:

1. **Asegúrate de que tu PC y tu OPPO Reno14 F estén conectados a la misma red Wi-Fi.**
2. Inicia el servidor con HTTPS:
   ```bash
cd street-explorer-mobile
npm run dev:https
```
3. La terminal mostrará las URLs de red local con HTTPS activo, por ejemplo:
   ```text
   ➜  Network: https://192.168.80.27:5173/
   ```
4. Abre **Google Chrome** en tu OPPO Reno14 F y navega a esa dirección `https://192.168.80.27:5173/`.
5. Al usar un certificado de desarrollo local, Chrome mostrará una advertencia de seguridad habitual ("La conexión no es privada"):
   - Toca en **"Opciones avanzadas"** / **"Configuración avanzada"**.
   - Toca en **"Continuar a 192.168.80.27 (no seguro)"**.
6. **Instalar como PWA:**
   - En el menú de opciones de Chrome (tres puntos verticales en la esquina superior derecha), toca **"Agregar a la pantalla principal"** o **"Instalar aplicación"**.
   - La aplicación se abrirá en pantalla completa sin barra de navegación del navegador, como una app nativa.

---

## 4. Pruebas Automatizadas

Para ejecutar la suite de pruebas unitarias:

```bash
npm test
```

Salida esperada:
```text
 ✓ tests/quality.test.ts (3 tests)
 ✓ tests/projection.test.ts (5 tests)
 ✓ tests/character.test.ts (4 tests)

 Test Files  3 passed (3)
      Tests  12 passed (12)
```

Para verificar la compilación estricta de TypeScript y el empaquetado de producción:

```bash
npm run build
```

---

## 5. Limitaciones Actuales y Próximos Pasos (Fase 2)

- **Fase actual:** Fase 0 y Fase 1 completadas.
- **Movimiento de prueba exploratorio:** En esta fase, el personaje se desplaza libremente dentro de los límites verificados de Cartagena de Indias (~1.8 km² alrededor del Centro Histórico) con métricas reales, pero **aún no está restringido a un grafo de calles peatonales**.
- **Puntos de interés (POIs) y búsqueda:** Se abordarán en la Fase 3 una vez completado el grafo navegable en la Fase 2.
- **Rendimiento medido:** El panel de telemetría superior izquierdo muestra FPS en tiempo real, tiempo de fotograma en ms, DPR activo y velocidad en m/s para calibrar físicamente en el Snapdragon 6 Gen 1 / Adreno 710.
