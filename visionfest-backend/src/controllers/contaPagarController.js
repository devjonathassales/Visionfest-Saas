const {
  ContaPagar,
  CentroCusto,
  ContaBancaria,
  Fornecedor,
} = require("../models");

// Listar todas as contas a pagar com dados relacionados
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
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: [
            "id",
            "nome",
            "cpfCnpj",
            "endereco",
            "whatsapp",
            "email",
          ],
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

// Obter uma conta a pagar por ID
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
          attributes: ["banco", "agencia", "conta", "id"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: [
            "id",
            "nome",
            "cpfCnpj",
            "endereco",
            "whatsapp",
            "email",
          ],
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

// Criar conta
exports.criar = async (req, res) => {
  try {
    if (!req.body.fornecedorId)
      return res.status(400).json({ error: "Fornecedor é obrigatório." });

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
    const conta = await ContaPagar.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (!req.body.fornecedorId)
      return res.status(400).json({ error: "Fornecedor é obrigatório." });

    await conta.update(req.body);
    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar conta." });
  }
};

// Baixar conta com lógica de pagamento parcial
exports.baixar = async (req, res) => {
  try {
    const {
      dataPagamento,
      formaPagamento,
      contaBancaria,
      valorPago,
      troco,
      tipoCredito,
      parcelas,
      novaDataVencimento,
    } = req.body;

    const conta = await ContaPagar.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    const valorPagoNum = parseFloat(valorPago || 0);
    const valorTotalNum = parseFloat(conta.valorTotal || 0);

    await conta.update({
      dataPagamento,
      formaPagamento,
      contaBancariaId:
        formaPagamento === "pix" || formaPagamento === "debito"
          ? contaBancaria?.id
          : null,
      valorPago: valorPagoNum,
      troco,
      tipoCredito: formaPagamento === "credito" ? tipoCredito : null,
      parcelas:
        formaPagamento === "credito" && tipoCredito === "parcelado"
          ? parcelas
          : null,
      status: "pago",
    });

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
        fornecedorId: conta.fornecedorId,
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

// Estornar
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
      troco: null,
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

// Excluir
exports.excluir = async (req, res) => {
  try {
    const conta = await ContaPagar.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status === "pago")
      return res
        .status(400)
        .json({ error: "Não é possível excluir conta paga." });

    await conta.destroy();
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
};
