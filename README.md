<div align="center">

# 🏙️ TerraurB

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7.svg)](https://sequelize.org/)

> 🌿 Plataforma completa para gerenciamento e monitoramento de terrenos urbanos abandonados

</div>

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Modelos de Dados](#-modelos-de-dados)
- [Rotas da API](#-rotas-da-api)
- [Configuração](#-configuração)
- [Segurança](#-segurança)
- [Documentação](#-documentação)

## 🎯 Visão Geral

TerraurB é uma plataforma especializada para o gerenciamento de denúncias de terrenos baldios, permitindo que cidadãos reportem lotes abandonados ou mal conservados. O sistema facilita a comunicação entre cidadãos e prefeitura, com recursos avançados de moderação, comentários e categorização.

## ✨ Funcionalidades

### 👥 Papéis de Usuário

- **Administrador** (`admin`)
  - Gerenciamento completo de usuários
  - Moderação de conteúdo
  - Gerenciamento de tags
  - Revisão de denúncias

- **Prefeitura** (`city_hall`)
  - Gerenciamento de denúncias
  - Atualização de status
  - Interação com cidadãos

- **Usuário** (`user`)
  - Criação de denúncias
  - Comentários
  - Reportar conteúdo

### 📊 Status das Denúncias

- Em Análise (inicial)
- Em Andamento
- Em Verificação
- Resolvido
- Cancelado
- Reaberto

## 💾 Modelos de Dados

### User
- Informações básicas (nickname, email)
- Dados de perfil (fullName, city, state, age)
- Controle de acesso (role)
- Avatar e biografia

### Complaint
- Título e descrição
- Localização
- Status e imagens
- Histórico de mudanças (ComplaintLog)
- Tags associadas

### Comment
- Conteúdo
- Associações (usuário e denúncia)
- Moderação

### ActivityLog
- Registro de atividades
- Informações do dispositivo
- Rastreamento de ações

### Report
- Denúncias de conteúdo
- Status de moderação
- Notas de revisão

### Session
- Gerenciamento de sessões
- Informações do dispositivo
- Controle de acesso

### Tag
- Categorização de denúncias
- Relacionamento many-to-many

## 🛣️ Rotas da API

### Autenticação (`/api/auth`)
- POST `/register` - Registro de usuário
- POST `/login` - Login com JWT
- GET `/me` - Perfil do usuário
- PUT `/me` - Atualização de perfil
- POST `/upload-avatar` - Upload de avatar
- GET `/devices` - Dispositivos conectados
- POST `/devices/revoke` - Revogar acesso

### Denúncias (`/api/complaints`)
- GET `/` - Listar denúncias
- POST `/` - Criar denúncia
- GET `/:id` - Detalhes da denúncia
- PATCH `/:id/status` - Atualizar status
- GET `/my` - Minhas denúncias

### Comentários (`/api/comments`)
- POST `/:complaintId` - Adicionar comentário
- GET `/:complaintId` - Listar comentários

### Administração (`/api/admin`)
- GET `/users` - Listar usuários
- DELETE `/users/:id` - Remover usuário

### Moderação (`/api/reports`)
- POST `/` - Reportar conteúdo
- GET `/` - Listar denúncias
- PATCH `/:id/review` - Revisar denúncia
- DELETE `/users/:id` - Remover usuário
- DELETE `/complaints/:id` - Remover denúncia
- DELETE `/comments/:id` - Remover comentário

### Tags (`/api/tags`)
- GET `/` - Listar tags
- POST `/` - Criar tag
- DELETE `/:id` - Remover tag
- PATCH `/:id` - Atualizar tag

## ⚙️ Configuração

### Variáveis de Ambiente
```env
DB_NAME=terraurb
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
JWT_SECRET=your_secret_key
PORT=3000
SMTP_USER=your_email
SMTP_PASS=your_password
```

### Instalação
```bash
# Instalar dependências
npm install

# Configurar banco de dados
npm run migrate

# Iniciar servidor
npm start
```

## 🔒 Segurança

- Autenticação JWT
- Senhas com bcrypt
- Controle de sessões
- Validação de roles
- Proteção contra XSS
- Rate limiting
- CORS configurado

## 📚 Documentação

A documentação completa da API está disponível em `/api/docs` usando Swagger UI, incluindo:

- Schemas completos
- Exemplos de requisições
- Respostas esperadas
- Autenticação
- Status codes

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso guia de contribuição antes de enviar um PR.

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

<div align="center">
Made with 💚 by TerraurB Team
</div>