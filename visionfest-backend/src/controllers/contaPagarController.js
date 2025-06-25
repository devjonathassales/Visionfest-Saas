const { ContaPagar, CentroCusto, ContaBancaria } = require("../models");

// Listar todas as contas
exports.listar = async (req, res) => {
  try {
    const contas = await ContaPagar.findAll({
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
      order: [["vencimento", "ASC"]],
    });
    res.json(contas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar contas." });
  }
};

// Obter uma conta por ID (com includes)
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

// Criar nova conta
exports.criar = async (req, res) => {
  try {
    const nova = await ContaPagar.create(req.body);
    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
};

// Atualizar conta
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

// Baixar (pagar) conta
exports.baixar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dataPagamento,
      formaPagamento,
      contaBancaria, // objeto enviado do frontend
      valorPago,
      troco,
      tipoCredito,
      parcelas,
    } = req.body;

    const conta = await ContaPagar.findByPk(id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    // Somente pix e débito exigem conta bancária
    const contaBancariaId =
      formaPagamento === "pix" || formaPagamento === "debito"
        ? contaBancaria?.id || null
        : null;

    // Atualizar
    await conta.update({
      dataPagamento,
      formaPagamento,
      contaBancariaId,
      valorPago,
      troco,
      tipoCredito: formaPagamento === "credito" ? tipoCredito : null,
      parcelas:
        formaPagamento === "credito" && tipoCredito === "parcelado"
          ? parcelas
          : null,
      status: "pago",
    });

    // Buscar novamente com includes para retornar ao frontend com todos os dados
    const contaAtualizada = await ContaPagar.findByPk(id, {
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

    res.json(contaAtualizada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamento." });
  }
};

// Estornar conta
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

// Excluir conta
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
