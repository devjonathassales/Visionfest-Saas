'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('contas_pagar', 'tipoCredito', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('contas_pagar', 'parcelas', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('contas_pagar', 'tipoCredito');
    await queryInterface.removeColumn('contas_pagar', 'parcelas');
  }
};
