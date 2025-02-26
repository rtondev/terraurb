module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Complaints', 'polygonCoordinates', {
      type: Sequelize.JSON,
      allowNull: true,
      after: 'images' // Adiciona após a coluna 'images'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Complaints', 'polygonCoordinates');
  }
}; 