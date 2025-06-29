const {
  ContaReceber,
  CentroCusto,
  ContaBancaria,
  Cliente,
} = require("../models");

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
        { model: Cliente, as: "cliente", attributes: ["id", "nome"] },
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
        { model: Cliente, as: "cliente", attributes: ["id", "nome"] },
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
    const nova = await ContaReceber.create(req.body);
    res.status(201).json(nova);
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
      tipoCredito,
      parcelas,
      valorRecebido,
      novaDataVencimento,
      cartaoId,
      taxaRepassada,
    } = req.body;

    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    const valorRecebidoNum = parseFloat(valorRecebido || 0);
    const valorTotalNum = parseFloat(conta.valorTotal || 0);

    await conta.update({
      dataRecebimento: dataRecebimento || new Date(),
      formaPagamento,
      contaBancariaId: contaBancariaId || null,
      cartaoId: cartaoId || null,
      valorRecebido: valorRecebidoNum,
      tipoCredito: tipoCredito || null,
      parcelas: parcelas || null,
      taxaRepassada: taxaRepassada || false,
      status: "pago",
    });

    if (valorRecebidoNum < valorTotalNum && novaDataVencimento) {
      const valorRestante = (valorTotalNum - valorRecebidoNum).toFixed(2);

      await ContaReceber.create({
        descricao: `${conta.descricao} (Parcial - Restante)`,
        valor: valorRestante,
        desconto: 0,
        tipoDesconto: "valor",
        valorTotal: valorRestante,
        vencimento: novaDataVencimento,
        centroCustoId: conta.centroCustoId,
        clienteId: conta.clienteId,
        status: "aberto",
        referenciaId: conta.id,
      });
    }

    res.json(conta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao receber conta." });
  }
};

exports.estornar = async (req, res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status !== "pago") {
      return res.status(400).json({ error: "Só é possível estornar uma conta paga." });
    }

    await conta.update({
      dataRecebimento: null,
      formaPagamento: null,
      contaBancariaId: null,
      cartaoId: null,
      valorRecebido: null,
      tipoCredito: null,
      parcelas: null,
      taxaRepassada: false,
      status: "aberto",
    });

    res.json({ message: "Estornado com sucesso." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao estornar conta." });
  }
};

exports.excluir = async (req, res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    if (conta.status === "pago") {
      return res.status(400).json({ error: "Não é possível excluir uma conta já paga." });
    }

    await conta.destroy();
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
};

exports.getFormasPagamento = (req, res) => {
  try {
    const formasPagamento = [
      { id: 1, nome: "Dinheiro" },
      { id: 2, nome: "Cartão de Crédito" },
      { id: 3, nome: "Cartão de Débito" },
      { id: 4, nome: "Pix" },
      { id: 5, nome: "Transferência" },
      { id: 6, nome: "Boleto" },
    ];
    res.json(formasPagamento);
  } catch (err) {
    console.error("Erro ao obter formas de pagamento:", err);
    res.status(500).json({ error: "Erro ao obter formas de pagamento." });
  }
};
