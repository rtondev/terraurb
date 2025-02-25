const express = require('express');
const swaggerUi = require('swagger-ui-express');
const router = express.Router();

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TerraurB API',
    version: '1.0.0',
    description: `API completa para gerenciamento de denúncias de terrenos baldios. Sistema permite que cidadãos reportem terrenos abandonados ou mal conservados, com recursos avançados de comentários, tags, moderação de conteúdo e gerenciamento de sessões.

[Baixar especificação OpenAPI/Swagger JSON](/api/docs/json)

Principais recursos:
- Sistema completo de autenticação com JWT
- Gerenciamento de sessões e dispositivos
- Upload de imagens via Cloudinary
- Sistema de tags e categorização
- Moderação de conteúdo
- Logs de atividades
- Estatísticas em tempo real`,
    contact: {
      name: 'Suporte TerraurB',
      email: 'suporte@terraurb.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
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
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'city_hall', 'user'] },
          fullName: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          age: { type: 'integer' },
          phone: { type: 'string' },
          bio: { type: 'string' },
          avatarUrl: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          token: { type: 'string' },
          deviceInfo: { type: 'object' },
          deviceId: { type: 'string' },
          accessCount: { type: 'integer' },
          isActive: { type: 'boolean' },
          lastUsed: { type: 'string', format: 'date-time' }
        }
      },
      ActivityLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          type: { type: 'string' },
          description: { type: 'string' },
          deviceInfo: { type: 'object' },
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
          status: {
            type: 'string',
            enum: ['Em Análise', 'Em Andamento', 'Resolvido', 'Cancelado', 'Em Verificação', 'Reaberto']
          },
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
          reviewedBy: { type: 'integer' },
          reviewNote: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ComplaintLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          oldStatus: { type: 'string' },
          newStatus: { type: 'string' },
          changedById: { type: 'integer' },
          ComplaintId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ComplaintTags: {
        type: 'object',
        properties: {
          ComplaintId: { type: 'integer' },
          TagId: { type: 'integer' }
        }
      }
    }
  },
  paths: {
    '/api/auth/send-verification-code': {
      post: {
        tags: ['Autenticação'],
        summary: 'Enviar código de verificação',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Código enviado com sucesso'
          },
          400: {
            description: 'Email já cadastrado ou inválido'
          }
        }
      }
    },
    '/api/auth/verify-code': {
      post: {
        tags: ['Autenticação'],
        summary: 'Verificar código recebido',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'nickname', 'password'],
                properties: {
                  email: { type: 'string' },
                  code: { type: 'string' },
                  nickname: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Código verificado com sucesso'
          }
        }
      }
    },
    '/api/auth/devices': {
      get: {
        tags: ['Autenticação'],
        summary: 'Listar dispositivos conectados',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de dispositivos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Session'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/devices/revoke': {
      post: {
        tags: ['Autenticação'],
        summary: 'Revogar acesso de dispositivo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId'],
                properties: {
                  sessionId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Acesso revogado com sucesso'
          }
        }
      }
    },
    '/api/auth/upload-avatar': {
      post: {
        tags: ['Autenticação'],
        summary: 'Upload de avatar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Avatar atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    avatarUrl: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/register': {
      post: {
        tags: ['Autenticação'],
        summary: 'Registrar novo usuário',
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
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuário registrado com sucesso'
          },
          400: {
            description: 'Dados inválidos ou usuário já existe'
          }
        }
      }
    },
    '/api/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Login de usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Credenciais inválidas'
          }
        }
      }
    },
    '/api/me': {
      get: {
        tags: ['Autenticação'],
        summary: 'Obter dados do usuário atual',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dados do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    nickname: { type: 'string' },
                    email: { type: 'string' },
                    role: { 
                      type: 'string',
                      enum: ['admin', 'city_hall', 'regular']
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Token não fornecido'
          },
          403: {
            description: 'Token inválido ou expirado'
          },
          404: {
            description: 'Usuário não encontrado'
          },
          500: {
            description: 'Erro ao buscar dados do usuário'
          }
        }
      }
    },
    '/api/complaints': {
      post: {
        tags: ['Denúncias'],
        summary: 'Criar nova denúncia',
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
                  tagIds: { 
                    type: 'array',
                    items: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Denúncia criada com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Complaint'
                }
              }
            }
          },
          400: {
            description: 'Dados inválidos - Descrição e localização são obrigatórios ou tagIds deve ser um array'
          },
          500: {
            description: 'Erro ao criar denúncia'
          }
        }
      },
      get: {
        tags: ['Denúncias'],
        summary: 'Listar todas as denúncias',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de denúncias',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    allOf: [
                      { $ref: '#/components/schemas/Complaint' },
                      {
                        type: 'object',
                        properties: {
                          author: {
                            type: 'object',
                            properties: {
                              nickname: { type: 'string' }
                            }
                          },
                          ComplaintLogs: {
                            type: 'array',
                            items: {
                              allOf: [
                                { $ref: '#/components/schemas/ComplaintLog' },
                                {
                                  type: 'object',
                                  properties: {
                                    changedBy: {
                                      type: 'object',
                                      properties: {
                                        nickname: { type: 'string' }
                                      }
                                    }
                                  }
                                }
                              ]
                            }
                          },
                          Tags: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/Tag'
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          500: {
            description: 'Erro ao buscar denúncias'
          }
        }
      }
    },
    '/api/complaints/{id}': {
      get: {
        tags: ['Denúncias'],
        summary: 'Obter denúncia por ID',
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
          200: {
            description: 'Detalhes da denúncia',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Complaint' },
                    {
                      type: 'object',
                      properties: {
                        author: {
                          type: 'object',
                          properties: {
                            nickname: { type: 'string' }
                          }
                        },
                        ComplaintLogs: {
                          type: 'array',
                          items: {
                            allOf: [
                              { $ref: '#/components/schemas/ComplaintLog' },
                              {
                                type: 'object',
                                properties: {
                                  changedBy: {
                                    type: 'object',
                                    properties: {
                                      nickname: { type: 'string' }
                                    }
                                  }
                                }
                              }
                            ]
                          }
                        },
                        Tags: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Tag'
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          404: {
            description: 'Denúncia não encontrada'
          },
          500: {
            description: 'Erro ao buscar denúncia'
          }
        }
      }
    },
    '/api/complaints/{id}/status': {
      patch: {
        tags: ['Denúncias'],
        summary: 'Atualizar status da denúncia',
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
          200: {
            description: 'Status atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Complaint'
                }
              }
            }
          },
          400: {
            description: 'Status inválido'
          },
          403: {
            description: 'Sem permissão para atualizar status - Apenas administradores e funcionários da prefeitura'
          },
          404: {
            description: 'Denúncia não encontrada'
          },
          500: {
            description: 'Erro ao atualizar status da denúncia'
          }
        }
      }
    },
    '/api/comments/{complaintId}': {
      post: {
        tags: ['Comentários'],
        summary: 'Adicionar comentário',
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
          201: {
            description: 'Comentário adicionado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Comment'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Comentários'],
        summary: 'Listar comentários de uma denúncia',
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
          200: {
            description: 'Lista de comentários',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Comment'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/tags': {
      post: {
        tags: ['Tags'],
        summary: 'Criar nova tag (Admin)',
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
          201: {
            description: 'Tag criada com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Tag'
                }
              }
            }
          },
          403: {
            description: 'Sem permissão de administrador'
          }
        }
      },
      get: {
        tags: ['Tags'],
        summary: 'Listar todas as tags',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de tags',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Tag'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/tags/{id}': {
      delete: {
        tags: ['Tags'],
        summary: 'Excluir tag (Admin)',
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
          204: {
            description: 'Tag excluída com sucesso'
          },
          403: {
            description: 'Sem permissão de administrador'
          }
        }
      },
      patch: {
        tags: ['Tags'],
        summary: 'Editar tag existente (Admin)',
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
                required: ['name'],
                properties: {
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Tag atualizada com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Tag'
                }
              }
            }
          },
          400: {
            description: 'Nome da tag é obrigatório ou já existe'
          },
          403: {
            description: 'Sem permissão de administrador'
          },
          404: {
            description: 'Tag não encontrada'
          },
          500: {
            description: 'Erro ao atualizar tag'
          }
        }
      }
    },
    '/api/reports': {
      post: {
        tags: ['Denúncias de Conteúdo'],
        summary: 'Reportar conteúdo inadequado',
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
          201: {
            description: 'Denúncia registrada com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Report'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Denúncias de Conteúdo'],
        summary: 'Listar denúncias de conteúdo (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de denúncias',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Report'
                  }
                }
              }
            }
          },
          403: {
            description: 'Sem permissão de administrador'
          }
        }
      }
    },
    '/api/reports/{id}/review': {
      patch: {
        tags: ['Denúncias de Conteúdo'],
        summary: 'Revisar denúncia de conteúdo (Admin)',
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
                  status: { type: 'string', enum: ['inappropriate', 'dismissed'] },
                  reviewNote: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Denúncia revisada com sucesso'
          },
          403: {
            description: 'Sem permissão de administrador'
          }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Administração'],
        summary: 'Listar todos os usuários (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          },
          403: {
            description: 'Sem permissão de administrador'
          }
        }
      }
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Administração'],
        summary: 'Excluir usuário (Admin)',
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
          204: {
            description: 'Usuário excluído com sucesso'
          },
          403: {
            description: 'Sem permissão ou tentativa de excluir outro admin'
          },
          404: {
            description: 'Usuário não encontrado'
          }
        }
      }
    },
    '/api/reports/users/{id}': {
      delete: {
        tags: ['Denúncias de Conteúdo'],
        summary: 'Excluir usuário por denúncia (Admin)',
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
          204: {
            description: 'Usuário excluído com sucesso'
          },
          403: {
            description: 'Sem permissão ou tentativa de excluir outro admin'
          },
          404: {
            description: 'Usuário não encontrado'
          }
        }
      }
    },
    '/api/reports/complaints/{id}': {
      delete: {
        tags: ['Denúncias de Conteúdo'],
        summary: 'Excluir denúncia por moderação (Admin)',
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
          204: {
            description: 'Denúncia excluída com sucesso'
          },
          403: {
            description: 'Sem permissão de administrador'
          },
          404: {
            description: 'Denúncia não encontrada'
          }
        }
      }
    },
    '/api/reports/comments/{id}': {
      delete: {
        tags: ['Denúncias de Conteúdo'],
        summary: 'Excluir comentário por moderação (Admin)',
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
          204: {
            description: 'Comentário excluído com sucesso'
          },
          403: {
            description: 'Sem permissão de administrador'
          },
          404: {
            description: 'Comentário não encontrado'
          }
        }
      }
    },
    '/api/complaints/{id}/tags': {
      post: {
        tags: ['Denúncias'],
        summary: 'Adicionar tags a uma denúncia',
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
                required: ['tagIds'],
                properties: {
                  tagIds: {
                    type: 'array',
                    items: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Tags adicionadas com sucesso'
          },
          404: {
            description: 'Denúncia não encontrada'
          }
        }
      },
      delete: {
        tags: ['Denúncias'],
        summary: 'Remover tags de uma denúncia',
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
                required: ['tagIds'],
                properties: {
                  tagIds: {
                    type: 'array',
                    items: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Tags removidas com sucesso'
          },
          404: {
            description: 'Denúncia não encontrada'
          }
        }
      }
    }
  }
};

// Rota para exibir o JSON completo da documentação
router.get('/json', (req, res) => {
  res.json(swaggerDocument);
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    docExpansion: 'none',
    persistAuthorization: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: -1,
    filter: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info__contact { padding: 1em 0 }
    .swagger-ui .link { color: #4990e2 }
    .swagger-ui .markdown p { margin: 1em 0 }
    .swagger-ui .scheme-container { position: sticky; top: 0; z-index: 1; }
  `,
  customSiteTitle: "TerraurB API Documentation",
  customfavIcon: "/favicon.ico"
}));

module.exports = router;