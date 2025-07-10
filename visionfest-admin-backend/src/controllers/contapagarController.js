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
          attributes: ["id", "banco", "agencia", "conta"],
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

// Obter uma conta por ID
exports.obterPorId = async (req, res) => {
  try {
    const conta = await ContaPagar.findByPk(req.params.id, {
      include: [
        {
          model: CentroCusto,
          as: "centroCusto",
          attributes: ["descricao"],
        },
        {
          model: ContaBancaria,
          as: "contaBancaria",
          attributes: ["id", "banco", "agencia", "conta"],
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
    const payload = {
      ...req.body,
      valorTotal: req.body.valor - (req.body.desconto || 0),
    };

    const nova = await ContaPagar.create(payload);
    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
};

// Atualizar conta existente
exports.atualizar = async (req, res) => {
  try {
    const conta = await ContaPagar.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    await conta.update({
      ...req.body,
      valorTotal: req.body.valor - (req.body.desconto || 0),
    });

    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar conta." });
  }
};

// Baixar (pagar) conta - Ajustado para contaBancariaId
exports.baixar = async (req, res) => {
  try {
    const {
      dataPagamento,
      formaPagamento,
      contaBancariaId,  // mudou aqui
      valorPago,
      tipoCredito,
      parcelas,
      novaDataVencimento,
    } = req.body;

    const conta = await ContaPagar.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    const valorPagoNum = parseFloat(valorPago || 0);
    const valorTotalNum = parseFloat(conta.valorTotal || 0);

    // Validar obrigatoriedade da conta bancária para pix, débito e crédito parcelado
    if (
      (formaPagamento === "pix" ||
        formaPagamento === "debito" ||
        (formaPagamento === "credito" && tipoCredito === "parcelado")) &&
      !contaBancariaId
    ) {
      return res.status(400).json({
        error: "Conta bancária é obrigatória para esta forma de pagamento.",
      });
    }

    await conta.update({
      dataPagamento,
      formaPagamento,
      contaBancariaId:
        (formaPagamento === "pix" ||
         formaPagamento === "debito" ||
         (formaPagamento === "credito" && tipoCredito === "parcelado"))
          ? contaBancariaId
          : null,
      valorPago: valorPagoNum,
      tipoCredito: formaPagamento === "credito" ? tipoCredito : null,
      parcelas:
        formaPagamento === "credito" && tipoCredito === "parcelado"
          ? parcelas
          : null,
      status: "pago",
    });

    // Criar nova conta para valor restante (se pagamento parcial)
    if (valorPagoNum < valorTotalNum && novaDataVencimento) {
      const valorRestante = (valorTotalNum - valorPagoNum).toFixed(2);

      await ContaPagar.create({
        descricao: `${conta.descricao} (Restante)`,
        valor: valorRestante,
        desconto: 0,
        tipoDesconto: "valor",
        valorTotal: valorRestante,
        vencimento: novaDataVencimento,
        centroCustoId: conta.centroCustoId,
        status: "aberto",
        referenciaId: conta.id,
      });
    }

    res.json({ message: "Pagamento realizado com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamento." });
  }
};

// Estornar pagamento
exports.estornar = async (req, res) => {
  try {
    const conta = await ContaPagar.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status !== "pago")
      return res.status(400).json({ error: "A conta não está paga." });

    await conta.update({
      dataPagamento: null,
      formaPagamento: null,
      contaBancariaId: null,
      valorPago: null,
      tipoCredito: null,
      parcelas: null,
      status: "aberto",
    });

    res.json({ message: "Conta estornada com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao estornar conta." });
  }
};

// Excluir conta
exports.excluir = async (req, res) => {
  try {
    const conta = await ContaPagar.findByPk(req.params.id);
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
