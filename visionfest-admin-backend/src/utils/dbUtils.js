const { AdminUser } = require("../models");

async function createSchemaAndUser(schemaName, email, senha) {
  try {
    // Cria o schema se não existir
    await AdminUser.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

    // Aponta o modelo para o novo schema
    const schemaDb = AdminUser.schema(schemaName);

    // Cria as tabelas dentro do novo schema
    await schemaDb.sync(); // <<<<< IMPORTANTE

    // Cria o usuário superadmin
    await schemaDb.create({
      nome: "Super Admin",
      email,
      senha,
      perfil: "superadmin",
      ativo: true,
    });

    console.log(`Schema '${schemaName}' e usuário superadmin criados com sucesso.`);
  } catch (error) {
    console.error("Erro ao criar schema e usuário:", error);
    throw error;
  }
}

module.exports = {
  createSchemaAndUser,
};
