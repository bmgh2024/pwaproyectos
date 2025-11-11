// Nombre del caché
const CACHE_NAME = 'project-manager-cache-v1';

// Archivos para cachear (nucleo de la app)
// Incluimos los CDNs de Bootstrap
const FILES_TO_CACHE = [
  '/',
  'indexr.html',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',
  // Opcional: Cachear las fuentes de bootstrap-icons si son cruciales
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/fonts/bootstrap-icons.woff2?8d20e38f76e3f0d5f81a4e40f01444b0',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/fonts/bootstrap-icons.woff?8d20e38f76e3f0d5f81a4e40f01444b0'
];

// Evento 'install': Se dispara cuando el SW se instala
self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Instalando...');
  
  // Esperar a que el precaching termine
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching de archivos de la app');
      // Es importante usar addAll para cachear todos los recursos
      // Si uno falla, la instalación del SW fallará.
      return cache.addAll(FILES_TO_CACHE);
    })
    .then(() => {
      console.log('[ServiceWorker] Instalación completa');
      self.skipWaiting(); // Forzar al SW a activarse
    })
    .catch(err => {
      console.error('[ServiceWorker] Falló el pre-caching:', err);
    })
  );
});

// Evento 'activate': Se dispara cuando el SW se activa
// Se usa para limpiar cachés antiguos
self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activando...');
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Borrando caché antiguo:', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      // Tomar control inmediato de las páginas abiertas
      return self.clients.claim();
    })
  );
});

// Evento 'fetch': Se dispara cada vez que la app busca un recurso (JS, CSS, img, etc.)
// Estrategia: Cache First (Primero busca en caché)
self.addEventListener('fetch', (evt) => {
  // Solo interceptar peticiones GET
  if (evt.request.method !== 'GET') {
    return;
  }
  
  // console.log('[ServiceWorker] Fetching:', evt.request.url);
  
  evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 1. Buscar en el caché
      return cache.match(evt.request)
        .then((response) => {
          if (response) {
            // 2. Si se encuentra en caché, devolverlo
            // console.log('[ServiceWorker] Sirviendo desde caché:', evt.request.url);
            return response;
          }
          
          // 3. Si no está en caché, ir a la red
          // console.log('[ServiceWorker] Buscando en red:', evt.request.url);
          return fetch(evt.request).then((networkResponse) => {
            
            // 4. Guardar la respuesta de red en el caché para futuras visitas
            // Clonamos la respuesta porque solo se puede consumir una vez
            cache.put(evt.request, networkResponse.clone());
            
            // 5. Devolver la respuesta de red
            return networkResponse;
            
          }).catch(err => {
            console.error('[ServiceWorker] Error de fetch:', err, evt.request.url);
            // Opcional: Devolver una página offline si falla la red
            // return caches.match('offline.html');
          });
        });
    })
  );
});