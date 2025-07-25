const { Sequelize } = require("sequelize");
const sequelize = require("./models/index").sequelize;
const { Permissao } = require("./models");

const permissoesIniciais = [
  { chave: "visualizarEmpresas", rotulo: "Visualizar Empresas" },
  { chave: "editarEmpresas", rotulo: "Editar Empresas" },
  { chave: "excluirEmpresas", rotulo: "Excluir Empresas" },
  { chave: "gerenciarPlanos", rotulo: "Gerenciar Planos" },
  { chave: "acessarFinanceiro", rotulo: "Acessar Financeiro" },
  { chave: "configurarSistema", rotulo: "Configurar Sistema" },
  { chave: "visualizarUsuarios", rotulo: "Visualizar Usuários" },
  { chave: "criarUsuarios", rotulo: "Criar Usuários" },
  { chave: "editarUsuarios", rotulo: "Editar Usuários" },
  { chave: "excluirUsuarios", rotulo: "Excluir Usuários" },
  { chave: "visualizarRelatorios", rotulo: "Visualizar Relatórios" },
  { chave: "abrirCaixa", rotulo: "Abrir Caixa" },
  { chave: "fecharCaixa", rotulo: "Fechar Caixa" },
  { chave: "acessarDashboard", rotulo: "Acessar Dashboard" },
  // Adicione mais permissões conforme precisar
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco bem-sucedida!");

    for (const perm of permissoesIniciais) {
      await Permissao.findOrCreate({
        where: { chave: perm.chave },
        defaults: { rotulo: perm.rotulo },
      });
    }

    console.log("Permissões seed criadas com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao rodar seed:", err);
    process.exit(1);
  }
}

seed();
