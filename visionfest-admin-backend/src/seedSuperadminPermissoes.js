const { AdminUser, Permissao } = require("./models");

async function seedSuperAdminPermissoes() {
  try {
    // Busca o superadmin
    const superadmin = await AdminUser.findOne({
      where: { role: "superadmin" },
    });

    if (!superadmin) {
      console.log("⚠️ Nenhum superadmin encontrado.");
      return;
    }

    // Busca todas as permissões
    const permissoes = await Permissao.findAll();

    if (permissoes.length === 0) {
      console.log("⚠️ Nenhuma permissão cadastrada.");
      return;
    }

    // Associa todas permissões ao superadmin
    await superadmin.setPermissoes(permissoes);

    console.log("✅ Permissões associadas ao superadmin com sucesso.");
  } catch (err) {
    console.error("Erro ao rodar seed:", err);
  }
}

seedSuperAdminPermissoes();
