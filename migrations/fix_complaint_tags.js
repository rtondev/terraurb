module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primeiro, remover a tabela se existir
    await queryInterface.dropTable('ComplaintTags', { force: true });
    
    // Recriar a tabela com a estrutura correta
    await queryInterface.createTable('ComplaintTags', {
      complaintId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Complaints',
          key: 'id'
        },
        primaryKey: true,
        onDelete: 'CASCADE'
      },
      tagId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tags',
          key: 'id'
        },
        primaryKey: true,
        onDelete: 'CASCADE'
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

    // Adicionar índice composto
    await queryInterface.addIndex('ComplaintTags', ['complaintId', 'tagId'], {
      unique: true,
      name: 'complaint_tag_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ComplaintTags');
  }
}; 