import 'maplibre-gl/dist/maplibre-gl.css';
import { Game } from './app/game';

// Check WebGL availability before booting
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch (_e) {
    return false;
  }
}

function initApp(): void {
  if (!isWebGLAvailable()) {
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #f8fafc; font-family: sans-serif;">
          <h2>WebGL no disponible</h2>
          <p>Tu navegador o dispositivo no soporta aceleración gráfica WebGL necesaria para renderizar el mundo 3D.</p>
        </div>
      `;
    }
    return;
  }

  // Bootstrap game
  new Game();

  // Register PWA service worker if supported
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
    });
  }
}

// Ensure DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
