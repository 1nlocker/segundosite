// Script para verificar as configurações do PWA
const fs = require('fs');
const path = require('path');

// Arquivos necessários para o PWA
const requiredFiles = [
  { path: 'manifest.json', tipo: 'Manifesto PWA' },
  { path: 'serviceWorker.js', tipo: 'Service Worker' },
  { path: 'offline.html', tipo: 'Página Offline' },
  { path: 'assets/favicon/android-chrome-192x192.png', tipo: 'Ícone PWA' },
  { path: 'assets/favicon/android-chrome-512x512.png', tipo: 'Ícone PWA' },
  { path: 'assets/favicon/apple-touch-icon.png', tipo: 'Ícone Apple' },
  { path: 'assets/favicon/favicon-16x16.png', tipo: 'Favicon' },
  { path: 'assets/favicon/favicon-32x32.png', tipo: 'Favicon' },
  { path: 'assets/images/logo.png', tipo: 'Logo' },
  { path: 'assets/images/screenshot1.png', tipo: 'Screenshot PWA' }
];

console.log('Verificando arquivos necessários para PWA...\n');

// Verificar cada arquivo
const faltando = [];
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  try {
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${file.tipo} encontrado: ${file.path}`);
    } else {
      console.log(`✗ ${file.tipo} faltando: ${file.path}`);
      faltando.push(file);
    }
  } catch (err) {
    console.error(`Erro ao verificar ${file.path}:`, err);
    faltando.push(file);
  }
});

console.log('\n=== Resumo ===');
if (faltando.length === 0) {
  console.log('Todos os arquivos necessários para PWA estão presentes!');
} else {
  console.log(`Faltam ${faltando.length} arquivos para o PWA funcionar corretamente:`);
  faltando.forEach(file => {
    console.log(`- ${file.path} (${file.tipo})`);
  });
  
  console.log('\nDica: Você pode criar ícones PWA usando ferramentas online como:');
  console.log('- https://realfavicongenerator.net/');
  console.log('- https://www.pwabuilder.com/imageGenerator');
}

// Verificar meta tags no index.html
try {
  const indexPath = path.join(__dirname, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  console.log('\n=== Meta Tags PWA ===');
  const metaTags = [
    { tag: '<link rel="manifest"', desc: 'Manifesto' },
    { tag: '<meta name="theme-color"', desc: 'Cor do tema' },
    { tag: '<link rel="apple-touch-icon"', desc: 'Ícone Apple' },
    { tag: 'serviceWorker.register', desc: 'Registro do Service Worker' }
  ];
  
  metaTags.forEach(tag => {
    if (indexContent.includes(tag.tag)) {
      console.log(`✓ ${tag.desc} configurado`);
    } else {
      console.log(`✗ ${tag.desc} não configurado`);
    }
  });
} catch (err) {
  console.error('Erro ao verificar meta tags:', err);
} 