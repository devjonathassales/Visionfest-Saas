const db = require("./models");

async function seed() {
  await db.CentroCusto.bulkCreate([
    { descricao: 'Aluguel de Espaço', tipo: 'Custo' },
  { descricao: 'Água e Energia', tipo: 'Custo' },
  { descricao: 'Internet e Telefonia', tipo: 'Custo' },
  { descricao: 'Equipamentos e Manutenção', tipo: 'Custo' },
  { descricao: 'Materiais de Escritório', tipo: 'Custo' },
  { descricao: 'Transporte', tipo: 'Custo' },
  { descricao: 'Salários e Comissões', tipo: 'Custo' },
  { descricao: 'Alimentação de Equipe', tipo: 'Custo' },
  { descricao: 'Marketing e Publicidade', tipo: 'Custo' },
  { descricao: 'Venda de Serviços', tipo: 'Receita' },
  { descricao: 'Venda de Produtos', tipo: 'Receita' },
  { descricao: 'Consultorias e Assessoria', tipo: 'Receita' },
  { descricao: 'Outros', tipo: 'Ambos' },
  ], { ignoreDuplicates: true });

  console.log("Centros de custo criados!");
}

seed().then(() => process.exit());
