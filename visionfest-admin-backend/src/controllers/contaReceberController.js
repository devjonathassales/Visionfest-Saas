const {
  ContaReceber,
  CentroCusto,
  ContaBancaria,
  Empresa,
  Sequelize,
} = require("../models");
const { verificarEAtivarEmpresa } = require("../utils/financeiroUtils");

const { Op } = Sequelize;

exports.listar = async (req, res) => {
  try {
    const contas = await ContaReceber.findAll({
      include: [
        { model: CentroCusto, as: "centroReceita", attributes: ["descricao"] },
        {
          model: ContaBancaria,
          as: "contaBancaria",
          attributes: ["banco", "agencia", "conta", "id"],
        },
        {
          model: Empresa,
          as: "empresa",
          attributes: ["nome"], // <-- Aqui está o nome da empresa
        },
      ],
      order: [["vencimento", "ASC"]],
    });
    res.json(contas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar contas a receber." });
  }
};

exports.obterPorId = async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({ error: "ID inválido." });
  }

  try {
    const conta = await ContaReceber.findByPk(id, {
      include: [
        { model: CentroCusto, as: "centroReceita", attributes: ["descricao"] },
        {
          model: ContaBancaria,
          as: "contaBancaria",
          attributes: ["banco", "agencia", "conta", "id"],
        },
        {
          model: Empresa,
          as: "empresa",
          attributes: ["nome"], // <-- Aqui também
        },
      ],
    });
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });
    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar conta." });
  }
};

exports.criar = async (req, res) => {
  try {
    let { centroCustoDescricao, ...dadosConta } = req.body;

    // Se houver descrição de centro de custo, buscar ou criar automaticamente
    let centroReceita = null;
    if (centroCustoDescricao) {
      centroReceita = await CentroCusto.findOne({
        where: {
          descricao: centroCustoDescricao,
          tipo: { [Op.in]: ["Receita", "Ambos"] },
        },
      });

      if (!centroReceita) {
        centroReceita = await CentroCusto.create({
          descricao: centroCustoDescricao,
          tipo: "Receita",
        });
      }

      dadosConta.centroReceitaId = centroReceita.id;
    }

    const novaConta = await ContaReceber.create(dadosConta);

    res.status(201).json(novaConta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar conta a receber." });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    await conta.update(req.body);
    res.json(conta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar conta." });
  }
};

exports.receber = async (req, res) => {
  try {
    const {
      dataRecebimento,
      formaPagamento,
      contaBancariaId,
      valorRecebido,
      centroCustoDescricao = "Recebimentos Diversos",
    } = req.body;

    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    let centroReceita = await CentroCusto.findOne({
      where: {
        descricao: centroCustoDescricao,
        tipo: { [Op.in]: ["Receita", "Ambos"] },
      },
    });

    if (!centroReceita) {
      centroReceita = await CentroCusto.create({
        descricao: centroCustoDescricao,
        tipo: "Receita",
      });
    }

    await conta.update({
      dataRecebimento: dataRecebimento || new Date(),
      formaPagamento,
      contaBancariaId: contaBancariaId || null,
      valorRecebido: parseFloat(valorRecebido || 0),
      status: "pago",
      centroReceitaId: centroReceita.id,
    });

    // Ativação inteligente da empresa após o pagamento
    if (conta.empresaId) {
      await verificarEAtivarEmpresa(conta.empresaId);
    }

    res.json({ mensagem: "Pagamento registrado com sucesso.", conta });
  } catch (e) {
    console.error("❌ Erro ao receber conta:", e);
    res.status(500).json({ error: "Erro ao receber conta." });
  }
};

exports.estornar = async (req, res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status !== "pago") {
      return res
        .status(400)
        .json({ error: "Só é possível estornar uma conta paga." });
    }

    await conta.update({
      dataRecebimento: null,
      formaPagamento: null,
      contaBancariaId: null,
      valorRecebido: null,
      status: "aberto",
    });

    res.json({ mensagem: "Estorno realizado com sucesso.", conta });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao estornar conta." });
  }
};
exports.listarPorEmpresa = async (req, res) => {
  try {
    const empresaId = req.params.id;

    const contas = await ContaReceber.findAll({
      where: { empresaId },
      include: [
        { model: CentroCusto, as: "centroReceita", attributes: ["descricao"] },
        {
          model: ContaBancaria,
          as: "contaBancaria",
          attributes: ["banco", "agencia", "conta", "id"],
        },
      ],
      order: [["vencimento", "ASC"]],
    });

    res.json(contas);
  } catch (err) {
    console.error("Erro ao buscar contas por empresa:", err);
    res.status(500).json({ error: "Erro ao buscar contas da empresa." });
  }
};

exports.excluir = async (req, res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status === "pago") {
      return res
        .status(400)
        .json({ error: "Não é possível excluir uma conta já paga." });
    }

    await conta.destroy();
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
};

exports.getFormasPagamento = (_req, res) => {
  try {
    const formasPagamento = [
      { id: 1, nome: "Dinheiro" },
      { id: 2, nome: "Pix" },
      { id: 3, nome: "Débito" },
      { id: 4, nome: "Crédito" },
      { id: 5, nome: "Transferência" },
      { id: 6, nome: "Boleto" },
    ];
    res.json(formasPagamento);
  } catch (err) {
    console.error("Erro ao obter formas de pagamento:", err);
    res.status(500).json({ error: "Erro ao obter formas de pagamento." });
  }
};
