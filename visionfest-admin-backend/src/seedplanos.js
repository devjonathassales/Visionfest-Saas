const { Plano, sequelize } = require("./models");

async function seed() {
  try {
    await sequelize.sync();

    const planos = [
      {
        nome: "basic",
        duracao: 30, // duração em dias, por exemplo
        valor: 49.90,
        descricao: "Plano básico para pequenas empresas",
        recursos: "Acesso limitado, Suporte básico",
      },
      {
        nome: "pro",
        duracao: 30,
        valor: 99.90,
        descricao: "Plano profissional com recursos avançados",
        recursos: "Acesso completo, Suporte prioritário",
      },
      {
        nome: "enterprise",
        duracao: 30,
        valor: 299.90,
        descricao: "Plano empresarial com todos os recursos",
        recursos: "Acesso total, Suporte dedicado",
      },
    ];

    for (const planoData of planos) {
      await Plano.findOrCreate({
        where: { nome: planoData.nome },
        defaults: planoData, // aqui precisa ter duracao e valor
      });
    }

    console.log("Seed de planos executada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao rodar seed de planos:", error);
    process.exit(1);
  }
}

seed();
