const { ContaPagar, CentroCusto, ContaBancaria } = require("../models");

exports.listar = async (req, res) => {
  try {
    const contas = await ContaPagar.findAll({
      include: [
        {
          model: CentroCusto,
          as: "centroCusto", // Alias conforme associação no model
          attributes: ["descricao"],
        },
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
    console.error(err);
    res.status(500).json({ error: "Erro ao listar contas." });
  }
};
exports.obterPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await ContaPagar.findByPk(id, {
      include: [
        {
          model: CentroCusto,
          as: "centroCusto",
          attributes: ["descricao"],
        },
        {
          model: ContaBancaria,
          as: "contaBancaria",
          attributes: ["banco", "agencia", "conta", "id"],
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
    const nova = await ContaPagar.create(req.body);
    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const conta = await ContaPagar.findByPk(id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    await conta.update(req.body);
    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar conta." });
  }
};

exports.baixar = async (req, res) => {
  try {
    const { id } = req.params;
    // Desestruture todos os campos que podem vir do frontend
    const {
      dataPagamento,
      formaPagamento,
      contaBancariaId,
      valorPago,
      troco,
      tipoCredito, // se quiser salvar tipo crédito e parcelas, adicione aqui
      parcelas,
    } = req.body;

    const conta = await ContaPagar.findByPk(id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    // Atualize os campos incluindo status para pago
    await conta.update({
      dataPagamento,
      formaPagamento,
      contaBancariaId: contaBancariaId || null,
      valorPago,
      troco,
      tipoCredito: tipoCredito || null,
      parcelas: parcelas || null,
      status: "pago",
    });

    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamento." });
  }
};
exports.estornar = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await ContaPagar.findByPk(id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status !== "pago") {
      return res
        .status(400)
        .json({ error: "Conta não está paga para ser estornada." });
    }

    // Zerar os campos de pagamento e voltar status para aberto
    await conta.update({
      dataPagamento: null,
      formaPagamento: null,
      contaBancariaId: null,
      valorPago: null,
      troco: null,
      tipoCredito: null,
      parcelas: null,
      status: "aberto",
    });

    res.json({ message: "Estorno realizado com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao estornar conta." });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const conta = await ContaPagar.findByPk(id);

    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });
    if (conta.status === "pago") {
      return res
        .status(400)
        .json({ error: "Não é possível excluir conta já paga." });
    }

    await conta.destroy();
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
};
