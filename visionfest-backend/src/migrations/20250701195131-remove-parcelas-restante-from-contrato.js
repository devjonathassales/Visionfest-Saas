module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('contratos', 'parcelasRestante');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('contratos', 'parcelasRestante', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  }
};
