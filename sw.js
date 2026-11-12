/**
 * Service Worker para Soporte Offline y Caché (Network First)
 * Cuaderno Digital de Física III - Movimiento Ondulatorio
 * Universidad Tecnológica de Pereira (UTP)
 * Autores: David Alejandro Ramirez Bolaños, Steven Vélez Garces, Sergio Andrés Velásquez Arana
 */

const CACHE_NAME = 'fisica3-ondas-notebook-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/audio.js',
  './js/geogebra_canvas.js',
  './js/simulators.js',
  './js/mindmap.js',
  './js/exercises.js',
  './js/app.js',
  './imagenes/Física III_ Movimiento Ondulatorio.png',
  './imagenes/plantilla.jpeg',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedRes) => {
          return cachedRes || caches.match('./index.html');
        });
      })
  );
});
