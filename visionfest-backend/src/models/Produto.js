module.exports = (sequelize, DataTypes) => {
  const Produto = sequelize.define(
    "Produto",
    {
      nome: { type: DataTypes.STRING, allowNull: false },
      valor: { type: DataTypes.FLOAT, defaultValue: 0 },
      movimentaEstoque: { type: DataTypes.BOOLEAN, defaultValue: true },
      estoqueMinimo: { type: DataTypes.INTEGER, defaultValue: 0 },
      tipoProduto: {
        type: DataTypes.ENUM("venda", "locacao"),
        defaultValue: "venda",
      },
    },
    {
      tableName: "produtos",
    }
  );

  return Produto;
};
