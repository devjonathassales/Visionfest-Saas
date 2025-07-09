async function getDashboardData(req, res) {
  try {
    res.json({
      mensagem: "Dashboard carregado com sucesso",
      usuario: req.user, // usuário logado vindo do token
      estatisticas: {
        totalEmpresas: await sequelize.models.Empresa.count(),
        totalUsuarios: await sequelize.models.AdminUser.count(),
      },
    });
  } catch (err) {
    console.error("Erro no dashboard:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
}

module.exports = { getDashboardData };
