#!/bin/bash

# Criar diretório para o favicon se não existir
mkdir -p assets/favicon

# Baixar um ícone padrão usando curl
echo "Fazendo download do favicon..."
curl -o assets/favicon/favicon.ico https://raw.githubusercontent.com/favicon-io/favicon-converter/master/public/icons/favicon-32x32.ico

echo "Favicon baixado para assets/favicon/favicon.ico" 