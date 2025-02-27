'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar se a tabela existe
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('Sessions'));

      if (tableExists) {
        // Alterar tabela existente
        await queryInterface.addColumn('Sessions', 'deviceInfo', {
          type: Sequelize.JSON,
          allowNull: true
        });

        await queryInterface.addColumn('Sessions', 'lastActivity', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        });

        // Remover colunas antigas se existirem
        const columns = await queryInterface.describeTable('Sessions');
        
        if (columns.deviceId) {
          await queryInterface.removeColumn('Sessions', 'deviceId');
        }
        if (columns.accessCount) {
          await queryInterface.removeColumn('Sessions', 'accessCount');
        }
        if (columns.lastUsed) {
          await queryInterface.removeColumn('Sessions', 'lastUsed');
        }

      } else {
        // Criar tabela nova
        await queryInterface.createTable('Sessions', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          token: {
            type: Sequelize.STRING(1000),
            allowNull: false
          },
          deviceInfo: {
            type: Sequelize.JSON,
            allowNull: true
          },
          lastActivity: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false
          }
        });
      }

      // Adicionar/atualizar índices
      await queryInterface.addIndex('Sessions', ['userId']);
      await queryInterface.addIndex('Sessions', ['token']);
      await queryInterface.addIndex('Sessions', ['isActive']);

    } catch (error) {
      console.error('Erro na migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('Sessions'));

      if (tableExists) {
        // Reverter alterações
        await queryInterface.removeColumn('Sessions', 'deviceInfo');
        await queryInterface.removeColumn('Sessions', 'lastActivity');
        
        // Restaurar colunas antigas
        await queryInterface.addColumn('Sessions', 'deviceId', {
          type: Sequelize.STRING,
          allowNull: false
        });
        await queryInterface.addColumn('Sessions', 'accessCount', {
          type: Sequelize.INTEGER,
          defaultValue: 1
        });
        await queryInterface.addColumn('Sessions', 'lastUsed', {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
    } catch (error) {
      console.error('Erro ao reverter migration:', error);
      throw error;
    }
  }
}; 