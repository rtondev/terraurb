module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remover a coluna duplicada
    await queryInterface.removeColumn('Sessions', 'UserId');
  },

  down: async (queryInterface, Sequelize) => {
    // Adicionar a coluna de volta se precisar reverter
    await queryInterface.addColumn('Sessions', 'UserId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }
}; 