import { sequelize, AdminUser } from "./src/models/index.js";
import bcrypt from "bcrypt";

async function createSuperAdmin() {
  try {
    // ✅ Sincronizar o banco antes de tudo
    await sequelize.sync({ alter: true }); // cria/atualiza as tabelas se não existirem
    console.log("✔️ Tabelas sincronizadas com sucesso!");

    // Verificar se já existe
    const existingAdmin = await AdminUser.findOne({
      where: { email: "admin@visionfest.com" },
    });

    if (existingAdmin) {
      console.log("⚠️ Usuário superadmin já existe!");
      return;
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash("senhaSuperSecreta123", 10);

    // Criar o superadmin
    await AdminUser.create({
      nome: "Jonathas Sales",
      email: "admin@visionfest.com",
      senha: hashedPassword,
      role: "superadmin", // ✅ já adiciona role
    });

    console.log("✅ Superadmin criado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar superadmin:", error);
  } finally {
    await sequelize.close();
  }
}

createSuperAdmin();
