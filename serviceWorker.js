// Nome do cache
const CACHE_NAME = 'desbloqueio-celular-v1';

// Arquivos para armazenar em cache
const urlsToCache = [
  '/',
  '/index.html',
  '/cliente.html',
  '/admin.html',
  '/pages/cliente/login.html',
  '/pages/cliente/cadastro.html',
  '/pages/cliente/painel.html',
  '/pages/admin/dashboard.html',
  '/assets/css/styles.css',
  '/assets/css/auth.css',
  '/assets/css/cliente.css',
  '/assets/css/admin.css',
  '/assets/js/config.js',
  '/assets/js/auth.js',
  '/assets/js/main.js',
  '/assets/js/cliente.js',
  '/assets/js/admin.js',
  '/assets/js/dashboard.js',
  '/assets/images/logo.png'
];

// Instalação do service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta requisições
self.addEventListener('fetch', event => {
  // Pular requisições do Supabase para evitar problemas de cache com API
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna recurso do cache se disponível
        if (response) {
          return response;
        }

        // Clone da requisição
        const fetchRequest = event.request.clone();

        // Tenta buscar da rede
        return fetch(fetchRequest)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone da resposta
            const responseToCache = response.clone();

            // Armazena em cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback para conteúdo offline
            if (event.request.url.includes('.html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Atualiza o service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Remove caches antigos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 