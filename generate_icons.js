// Script para gerar ícones temporários para PWA
const fs = require('fs');
const path = require('path');

// Função para criar diretório se não existir
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Diretório criado: ${dirPath}`);
  }
};

// Cria diretórios necessários
createDirIfNotExists(path.join(__dirname, 'assets/favicon'));
createDirIfNotExists(path.join(__dirname, 'assets/images'));

// Função para criar um arquivo de texto com instruções
const createPlaceholderFile = (filePath, message) => {
  fs.writeFileSync(filePath, message);
  console.log(`Arquivo placeholder criado: ${filePath}`);
};

// Criar arquivos placeholder
createPlaceholderFile(
  path.join(__dirname, 'assets/favicon/android-chrome-192x192.png'),
  'Este é um arquivo placeholder. Substitua por uma imagem PNG de 192x192 pixels.'
);

createPlaceholderFile(
  path.join(__dirname, 'assets/favicon/android-chrome-512x512.png'),
  'Este é um arquivo placeholder. Substitua por uma imagem PNG de 512x512 pixels.'
);

createPlaceholderFile(
  path.join(__dirname, 'assets/favicon/apple-touch-icon.png'),
  'Este é um arquivo placeholder. Substitua por uma imagem PNG de 180x180 pixels.'
);

createPlaceholderFile(
  path.join(__dirname, 'assets/favicon/favicon-16x16.png'),
  'Este é um arquivo placeholder. Substitua por uma imagem PNG de 16x16 pixels.'
);

createPlaceholderFile(
  path.join(__dirname, 'assets/favicon/favicon-32x32.png'),
  'Este é um arquivo placeholder. Substitua por uma imagem PNG de 32x32 pixels.'
);

createPlaceholderFile(
  path.join(__dirname, 'assets/images/logo.png'),
  'Este é um arquivo placeholder. Substitua pelo logo da empresa.'
);

createPlaceholderFile(
  path.join(__dirname, 'assets/images/screenshot1.png'),
  'Este é um arquivo placeholder. Substitua por uma screenshot da aplicação com resolução 1280x720 pixels.'
);

console.log('\nArquivos placeholder criados com sucesso!');
console.log('IMPORTANTE: Você deve substituir estes arquivos por imagens reais antes de publicar o site.');
console.log('Para gerar ícones adequados para PWA, utilize uma ferramenta como https://realfavicongenerator.net/'); 