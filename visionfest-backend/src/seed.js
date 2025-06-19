const CentroCusto = require('./models/CentroCusto');
const sequelize = require('./models/index');

const centrosPadrao = [
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
  { descricao: 'Outros', tipo: 'Ambos' }
];

async function popularCentroCusto() {
  try {
    await sequelize.sync(); // Garante que as tabelas existem

    const existentes = await CentroCusto.findAll();
    if (existentes.length > 0) {
      console.log('Centros de custo já existentes no banco.');
      process.exit(0);
    }

    await CentroCusto.bulkCreate(centrosPadrao);
    console.log('Centros de custo inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao popular centros de custo:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

popularCentroCusto();
