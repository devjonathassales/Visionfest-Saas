const { sequelize, AdminUser } = require("./src/models");
const bcrypt = require("bcrypt");

async function createSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await AdminUser.create({
      nome: "Super Admin",
      email: "admin@visionfest.com",
      senha: hashedPassword,
      role: "super_admin"
    });

    console.log("Super admin criado:", admin.email);
  } catch (err) {
    console.error("Erro ao criar super admin:", err);
  } finally {
    await sequelize.close();
  }
}

createSuperAdmin();
