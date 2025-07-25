const { getDbCliente } = require("../utils/multiTenant");

module.exports = {
  async listar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const contas = await ContaPagar.findAll({
        where: { empresaId: req.empresaId },
        order: [["vencimento", "ASC"]],
      });

      res.json(contas);
    } catch (error) {
      console.error("Erro ao listar contas a pagar:", error);
      res.status(500).json({ error: "Erro ao listar contas a pagar." });
    }
  },

  async obterPorId(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const conta = await ContaPagar.findOne({
        where: { id: req.params.id, empresaId: req.empresaId },
      });

      if (!conta) {
        return res.status(404).json({ error: "Conta a pagar não encontrada." });
      }

      res.json(conta);
    } catch (error) {
      console.error("Erro ao buscar conta a pagar:", error);
      res.status(500).json({ error: "Erro ao buscar conta a pagar." });
    }
  },

  async criar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const { descricao, valor, vencimento, fornecedorId, centroCustoId } = req.body;

      const novaConta = await ContaPagar.create({
        descricao,
        valor,
        vencimento,
        fornecedorId,
        centroCustoId,
        status: "aberto",
        empresaId: req.empresaId,
      });

      res.status(201).json(novaConta);
    } catch (error) {
      console.error("Erro ao criar conta a pagar:", error);
      res.status(500).json({ error: "Erro ao criar conta a pagar." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const conta = await ContaPagar.findOne({
        where: { id: req.params.id, empresaId: req.empresaId },
      });

      if (!conta) {
        return res.status(404).json({ error: "Conta a pagar não encontrada." });
      }

      const { descricao, valor, vencimento, fornecedorId, centroCustoId } = req.body;

      await conta.update({
        descricao,
        valor,
        vencimento,
        fornecedorId,
        centroCustoId,
      });

      res.json(conta);
    } catch (error) {
      console.error("Erro ao atualizar conta a pagar:", error);
      res.status(500).json({ error: "Erro ao atualizar conta a pagar." });
    }
  },

  async baixar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const conta = await ContaPagar.findOne({
        where: { id: req.params.id, empresaId: req.empresaId },
      });

      if (!conta) {
        return res.status(404).json({ error: "Conta a pagar não encontrada." });
      }

      if (conta.status === "pago") {
        return res.status(400).json({ error: "Conta já está paga." });
      }

      await conta.update({
        status: "pago",
        dataPagamento: new Date(),
      });

      res.json({ message: "Conta baixada com sucesso.", conta });
    } catch (error) {
      console.error("Erro ao baixar conta a pagar:", error);
      res.status(500).json({ error: "Erro ao baixar conta a pagar." });
    }
  },

  async estornar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const conta = await ContaPagar.findOne({
        where: { id: req.params.id, empresaId: req.empresaId },
      });

      if (!conta) {
        return res.status(404).json({ error: "Conta a pagar não encontrada." });
      }

      if (conta.status !== "pago") {
        return res.status(400).json({ error: "Conta não está paga para estornar." });
      }

      await conta.update({
        status: "aberto",
        dataPagamento: null,
      });

      res.json({ message: "Estorno realizado com sucesso.", conta });
    } catch (error) {
      console.error("Erro ao estornar conta a pagar:", error);
      res.status(500).json({ error: "Erro ao estornar conta a pagar." });
    }
  },

  async excluir(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { ContaPagar } = db.models;

      const conta = await ContaPagar.findOne({
        where: { id: req.params.id, empresaId: req.empresaId },
      });

      if (!conta) {
        return res.status(404).json({ error: "Conta a pagar não encontrada." });
      }

      if (conta.status === "pago") {
        return res.status(400).json({ error: "Não é possível excluir uma conta paga." });
      }

      await conta.destroy();

      res.json({ message: "Conta a pagar excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir conta a pagar:", error);
      res.status(500).json({ error: "Erro ao excluir conta a pagar." });
    }
  },
};
