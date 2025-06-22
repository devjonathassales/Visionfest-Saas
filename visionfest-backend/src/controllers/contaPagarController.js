const { ContaPagar, CentroCusto } = require("../models");

exports.listar = async (req, res) => {
  try {
    const contas = await ContaPagar.findAll({
      include: [
        {
          model: CentroCusto,
          as: "centroCusto", // <- use o alias declarado no model
          attributes: ["descricao"],
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
    const { dataPagamento, formaPagamento, contaBancariaId, valorPago, troco } =
      req.body;

    const conta = await ContaPagar.findByPk(id);
    if (!conta) return res.status(404).json({ error: "Conta não encontrada." });

    await conta.update({
      dataPagamento,
      formaPagamento,
      contaBancariaId: contaBancariaId || null,
      valorPago,
      troco,
      status: "pago",
    });

    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamento." });
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
