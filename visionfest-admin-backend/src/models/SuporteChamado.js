// src/models/SuporteChamado.js
module.exports = (sequelize, DataTypes) => {
  const SuporteChamado = sequelize.define(
    "SuporteChamado",
    {
      empresaId: { type: DataTypes.INTEGER, allowNull: false },
      empresaNome: { type: DataTypes.STRING, allowNull: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: true },
      usuarioNome: { type: DataTypes.STRING, allowNull: true },
      assunto: { type: DataTypes.STRING, allowNull: false },
      prioridade: {
        type: DataTypes.ENUM("baixa", "media", "alta"),
        allowNull: false,
        defaultValue: "media",
      },
      mensagem: { type: DataTypes.TEXT, allowNull: false },
      anexos: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] }, // [{name, path, size}]
      canal: {
        type: DataTypes.ENUM("email", "chat", "whatsapp"),
        allowNull: false,
        defaultValue: "email",
      },
      status: {
        type: DataTypes.ENUM("aberto", "em_andamento", "resolvido"),
        allowNull: false,
        defaultValue: "aberto",
      },
    },
    {
      tableName: "suporte_chamados",
      timestamps: true,
    }
  );
  return SuporteChamado;
};
