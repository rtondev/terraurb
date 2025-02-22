const express = require('express');
const swaggerUi = require('swagger-ui-express');
const router = express.Router();

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Documentação Terraurb',
    version: '1.0.0',
    description: 'Documentação da API da plataforma Terraurb, fornecendo endpoints para gerenciamento de denúncias, administração de usuários e moderação de conteúdo. A plataforma possui três tipos de usuários: administradores (admin), funcionários da prefeitura (city_hall) e usuários comuns (regular). Os administradores têm acesso total ao sistema, incluindo moderação de conteúdo e gerenciamento de usuários. Os funcionários da prefeitura podem gerenciar denúncias e atualizar seus status. Os usuários comuns podem criar denúncias, comentários e reportar conteúdo inadequado.'
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nickname: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'city_hall', 'regular'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' }
        }
      },
      Complaint: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          description: { type: 'string' },
          location: { type: 'string' },
          status: { type: 'string', enum: ['Em Análise', 'Em Andamento', 'Resolvido', 'Cancelado', 'Em Verificação', 'Reaberto'] },
          userId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          content: { type: 'string' },
          userId: { type: 'integer' },
          complaintId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          type: { type: 'string', enum: ['complaint', 'comment'] },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'inappropriate', 'dismissed'] },
          targetId: { type: 'integer' },
          reporterId: { type: 'integer' },
          reviewedBy: { type: 'integer', nullable: true },
          reviewNote: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        description: 'Cria uma nova conta de usuário no sistema. Por padrão, novos usuários são registrados com a função "regular". Apenas administradores podem alterar funções de usuário posteriormente.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nickname', 'email', 'password'],
                properties: {
                  nickname: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login de usuário',
        description: 'Autentica o usuário no sistema e retorna um token JWT que deve ser usado em todas as requisições subsequentes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/complaints': {
      get: {
        tags: ['Complaints'],
        summary: 'Listar todas as denúncias',
        description: 'Retorna todas as denúncias cadastradas no sistema. Inclui informações sobre o autor, histórico de status e tags associadas.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of complaints',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Complaint' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Complaints'],
        summary: 'Criar nova denúncia',
        description: 'Registra uma nova denúncia no sistema. O status inicial é sempre "Em Análise". É possível associar tags à denúncia para melhor categorização.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['description', 'location'],
                properties: {
                  description: { type: 'string' },
                  location: { type: 'string' },
                  tagIds: { type: 'array', items: { type: 'integer' } }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Complaint created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Complaint' }
              }
            }
          }
        }
      }
    },
    '/api/complaints/{id}': {
      get: {
        tags: ['Complaints'],
        summary: 'Buscar denúncia por ID',
        description: 'Retorna os detalhes completos de uma denúncia específica, incluindo seu histórico de alterações de status.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Complaint details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Complaint' }
              }
            }
          }
        }
      }
    },
    '/api/complaints/{id}/status': {
      patch: {
        tags: ['Complaints'],
        summary: 'Atualizar status da denúncia',
        description: 'Permite que administradores e funcionários da prefeitura atualizem o status de uma denúncia. Cada alteração é registrada no histórico.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['Em Análise', 'Em Andamento', 'Resolvido', 'Cancelado', 'Em Verificação', 'Reaberto']
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Status updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Complaint' }
              }
            }
          }
        }
      }
    },
    '/api/comments/{complaintId}': {
      get: {
        tags: ['Comments'],
        summary: 'Listar comentários de uma denúncia',
        description: 'Retorna todos os comentários associados a uma denúncia específica, ordenados por data de criação.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'complaintId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'List of comments',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Comment' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Comments'],
        summary: 'Adicionar comentário',
        description: 'Permite que usuários adicionem comentários a uma denúncia. Os comentários ajudam no acompanhamento e discussão do caso.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'complaintId',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Comment created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Comment' }
              }
            }
          }
        }
      }
    },
    '/api/tags': {
      get: {
        tags: ['Tags'],
        summary: 'Listar todas as tags',
        description: 'Retorna todas as tags disponíveis para categorização de denúncias.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of tags',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Tag' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Tags'],
        summary: 'Criar nova tag (Apenas Admin)',
        description: 'Permite que administradores criem novas tags para categorização de denúncias.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Tag created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Tag' }
              }
            }
          }
        }
      }
    },
    '/api/tags/{id}': {
      delete: {
        tags: ['Tags'],
        summary: 'Excluir tag (Apenas Admin)',
        description: 'Permite que administradores removam tags do sistema.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Tag deleted successfully'
          }
        }
      }
    },
    '/api/reports/users/{id}': {
      delete: {
        tags: ['Reports'],
        summary: 'Excluir usuário (Apenas Admin)',
        description: 'Permite que administradores excluam usuários do sistema. Não é possível excluir outros administradores.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'User deleted successfully'
          },
          '403': {
            description: 'Não é possível excluir outro administrador'
          },
          '404': {
            description: 'Usuário não encontrado'
          }
        }
      }
    },
    '/api/reports/complaints/{id}': {
      delete: {
        tags: ['Reports'],
        summary: 'Excluir denúncia (Apenas Admin)',
        description: 'Permite que administradores excluam denúncias do sistema.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Complaint deleted successfully'
          },
          '404': {
            description: 'Denúncia não encontrada'
          }
        }
      }
    },
    '/api/reports/comments/{id}': {
      delete: {
        tags: ['Reports'],
        summary: 'Excluir comentário (Apenas Admin)',
        description: 'Permite que administradores excluam comentários do sistema.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Comment deleted successfully'
          },
          '404': {
            description: 'Comentário não encontrado'
          }
        }
      }
    },
    '/api/reports': {
      get: {
        tags: ['Reports'],
        summary: 'Listar todas as denúncias de conteúdo (Apenas Admin)',
        description: 'Retorna todas as denúncias de conteúdo inadequado para análise dos administradores.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of reports',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Report' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Reports'],
        summary: 'Reportar conteúdo inadequado',
        description: 'Permite que usuários reportem denúncias ou comentários inadequados para análise dos administradores.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'reason', 'targetId'],
                properties: {
                  type: { type: 'string', enum: ['complaint', 'comment'] },
                  reason: { type: 'string' },
                  targetId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Report created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Report' }
              }
            }
          }
        }
      }
    }
  }
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

module.exports = router;