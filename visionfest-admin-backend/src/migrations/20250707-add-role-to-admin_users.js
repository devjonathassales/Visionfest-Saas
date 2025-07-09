'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('admin_users', 'role', {
      type: Sequelize.ENUM('superadmin', 'admin', 'funcionario'),
      allowNull: false,
      defaultValue: 'funcionario',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('admin_users', 'role');
  }
};
