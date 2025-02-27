'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Primeiro verifica se a tabela Users existe
      const [tables] = await queryInterface.sequelize.query(
        'SHOW TABLES LIKE "Users"'
      );
      
      if (tables.length === 0) {
        console.log('Tabela Users não existe. Criando...');
        await queryInterface.createTable('Users', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          // ... outros campos da tabela Users
        });
      }

      // Depois adiciona as colunas na tabela Reports
      await queryInterface.addColumn('Reports', 'adminNote', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await queryInterface.addColumn('Reports', 'resolvedBy', {
        type: Sequelize.INTEGER,
        allowNull: true
      });

      await queryInterface.addConstraint('Reports', {
        fields: ['resolvedBy'],
        type: 'foreign key',
        name: 'fk_reports_resolvedby',
        references: {
          table: 'Users',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });

    } catch (error) {
      console.error('Erro na migração:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Reports', 'fk_reports_resolvedby');
    await queryInterface.removeColumn('Reports', 'resolvedBy');
    await queryInterface.removeColumn('Reports', 'adminNote');
  }
}; 