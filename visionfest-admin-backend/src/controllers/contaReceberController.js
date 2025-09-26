// src/controllers/contasReceberController.js
const {
  ContaReceber,
  CentroCusto,
  ContaBancaria,
  Empresa,
  Sequelize,
} = require("../models");
const { verificarEAtivarEmpresa } = require("../utils/financeiroUtils");
const { syncTenantFaturaFromPublic } = require("../utils/faturasSync");

const { Op } = Sequelize;

exports.listar = async (_req, res) => {
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
          attributes: ["nome"],
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
  if (isNaN(Number(id))) return res.status(400).json({ error: "ID inválido." });

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
          attributes: ["nome"],
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
          tipo: "Ambos",
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

    if (conta.status === "pago") {
      return res
        .status(400)
        .json({ error: "Não é possível alterar uma conta já paga." });
    }

    await conta.update(req.body);

    // >>> sincroniza no tenant se ainda estiver ABERTO
    try {
      // pega empresa para passar ao util (evita falha se model não estiver carregado dentro do util)
      let empresa = null;
      if (conta.empresaId) {
        try {
          empresa = await Empresa.findByPk(conta.empresaId, {
            attributes: ["id", "bancoDados"],
          });
        } catch {}
      }

      const patch = {};
      if (req.body.descricao !== undefined) patch.descricao = conta.descricao;

      if (req.body.vencimento !== undefined) {
        patch.vencimento = conta.vencimento;
        if (conta.vencimento) {
          const d = new Date(conta.vencimento);
          if (!isNaN(d.getTime())) {
            patch.competencia = `${d.getFullYear()}-${String(
              d.getMonth() + 1
            ).padStart(2, "0")}`;
          }
        }
      }

      if (
        ["valor", "valorTotal", "desconto", "tipoDesconto"].some(
          (k) => req.body[k] !== undefined
        )
      ) {
        const baseValor = Number(conta.valorTotal ?? conta.valor ?? 0) || 0;
        patch.valor = baseValor;
      }

      if (Object.keys(patch).length) {
        await syncTenantFaturaFromPublic(conta, patch, empresa);
      }
    } catch (e) {
      console.warn(
        "[contasReceber.atualizar] Falha ao sincronizar fatura:",
        e.message
      );
    }

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

    // >>> sincroniza no tenant (pago)
    try {
      let empresa = null;
      if (conta.empresaId) {
        try {
          empresa = await Empresa.findByPk(conta.empresaId, {
            attributes: ["id", "bancoDados"],
          });
        } catch {}
      }

      await syncTenantFaturaFromPublic(
        conta,
        {
          status: "pago",
          formaPagamento: formaPagamento || "pix",
          dataPagamento: conta.dataRecebimento || new Date(),
          valorPago:
            Number(
              conta.valorRecebido || conta.valor || conta.valorTotal || 0
            ) || 0,
        },
        empresa
      );
    } catch (e) {
      console.warn(
        "[contasReceber.receber] Falha ao sincronizar fatura:",
        e.message
      );
    }

    // Ativação inteligente da empresa após o pagamento
    if (conta.empresaId) {
      try {
        await verificarEAtivarEmpresa(conta.empresaId);
      } catch (e) {
        console.warn("[contasReceber.receber] ativação empresa:", e.message);
      }
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

    // >>> sincroniza no tenant (reabrir)
    try {
      let empresa = null;
      if (conta.empresaId) {
        try {
          empresa = await Empresa.findByPk(conta.empresaId, {
            attributes: ["id", "bancoDados"],
          });
        } catch {}
      }

      await syncTenantFaturaFromPublic(
        conta,
        {
          status: "aberto",
          formaPagamento: null,
          dataPagamento: null,
          valorPago: null,
        },
        empresa
      );
    } catch (e) {
      console.warn(
        "[contasReceber.estornar] Falha ao sincronizar fatura:",
        e.message
      );
    }

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
