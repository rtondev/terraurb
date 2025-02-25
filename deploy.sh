#!/bin/bash

# Configurações
APP_NAME="terraurb"
REPO_URL="https://github.com/seu-usuario/terraurb.git"
APP_DIR="/var/www/terraurb"
PM2_CONFIG="ecosystem.config.js"

echo "🚀 Iniciando deploy do $APP_NAME..."

# Verifica se o diretório existe
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Criando diretório e clonando repositório..."
    mkdir -p $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
else
    echo "⬇️ Atualizando código..."
    cd $APP_DIR
    git pull origin main
fi

# Instala dependências
echo "📦 Instalando dependências..."
npm install

# Configura PM2
if ! command -v pm2 &> /dev/null; then
    echo "🔧 Instalando PM2..."
    npm install -g pm2
fi

# Cria/atualiza arquivo de configuração do PM2
echo "⚙️ Configurando PM2..."
cat > $PM2_CONFIG << EOF
module.exports = {
  apps: [{
    name: "$APP_NAME",
    script: "index.js",
    env: {
      NODE_ENV: "production",
      DB_HOST: "localhost",
      DB_USER: "root",
      DB_PASSWORD: "",
      DB_NAME: "care",
      JWT_SECRET: "your_jwt_secret_key",
      PORT: 3000
    }
  }]
}
EOF

# Reinicia a aplicação
echo "🔄 Reiniciando aplicação..."
pm2 reload $PM2_CONFIG || pm2 start $PM2_CONFIG

# Configura PM2 para iniciar com o sistema
echo "🔧 Configurando inicialização automática..."
pm2 startup
pm2 save

echo "✅ Deploy concluído!" 