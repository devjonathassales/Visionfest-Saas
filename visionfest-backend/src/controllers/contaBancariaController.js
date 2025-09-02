const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Usa o DB já injetado pelo middleware, senão resolve pelo tenant
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// Aplica escopo por empresaId somente se o campo existir na model
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

// Mantém apenas campos permitidos e que existem na model
function pickAllowed(Model, src, keys) {
  const out = {};
  for (const k of keys) {
    if (
      Object.prototype.hasOwnProperty.call(Model?.rawAttributes || {}, k) &&
      src[k] !== undefined
    ) {
      out[k] = src[k];
    }
  }
  return out;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaBancaria = db.ContaBancaria;
      if (!ContaBancaria) {
        console.error(
          "[contaBancaria:listar] Model ContaBancaria não encontrado no tenant."
        );
        return res
          .status(500)
          .json({ message: "Modelo ContaBancaria não carregado no tenant." });
      }

      const { busca } = req.query || {};
      const where = scopedWhere(ContaBancaria, req);

      if (busca && String(busca).trim()) {
        const like = { [Op.iLike]: `%${String(busca).trim()}%` };
        // Só usa os campos que de fato existirem na model
        const possiveis = [
          "banco",
          "instituicao",
          "agencia",
          "conta",
          "titular",
          "pixChave",
          "descricao",
          "apelido",
        ];
        const orConds = possiveis
          .filter((k) => ContaBancaria.rawAttributes?.[k])
          .map((k) => ({ [k]: like }));
        if (orConds.length) where[Op.or] = orConds;
      }

      // Ordena por 'banco' se existir, senão por criação
      const order = ContaBancaria.rawAttributes?.banco
        ? [
            ["banco", "ASC"],
            ["createdAt", "ASC"],
          ]
        : [["createdAt", "ASC"]];

      const contas = await ContaBancaria.findAll({ where, order });
      return res.json(contas);
    } catch (error) {
      console.error("Erro ao listar contas bancárias:", error);
      return res
        .status(500)
        .json({ message: "Erro ao listar contas bancárias." });
    }
  },

  async obterPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaBancaria = db.ContaBancaria;
      if (!ContaBancaria) {
        return res
          .status(500)
          .json({ message: "Modelo ContaBancaria não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaBancaria, req, { id: Number(id) });

      const conta = await ContaBancaria.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta bancária não encontrada." });

      return res.json(conta);
    } catch (error) {
      console.error("Erro ao obter conta bancária:", error);
      return res.status(500).json({ message: "Erro ao obter conta bancária." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaBancaria = db.ContaBancaria;
      if (!ContaBancaria) {
        return res
          .status(500)
          .json({ message: "Modelo ContaBancaria não carregado no tenant." });
      }

      // Lista de campos que costumam existir — só serão aplicados se existirem no model
      const campos = [
        "banco",
        "instituicao",
        "agencia",
        "conta",
        "titular",
        "documento",
        "pixChave",
        "tipoChave",
        "descricao",
        "apelido",
        "saldoInicial",
        "saldo",
        "ativa",
        "tipo", // ex.: corrente/poupanca
      ];

      const payload = pickAllowed(ContaBancaria, req.body || {}, campos);

      // Normaliza booleanos comuns
      if (payload.ativa !== undefined) payload.ativa = !!payload.ativa;

      // Injeta empresaId se a coluna existir
      if (ContaBancaria?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const criada = await ContaBancaria.create(payload);
      return res.status(201).json(criada);
    } catch (error) {
      console.error("Erro ao criar conta bancária:", error);
      return res.status(500).json({ message: "Erro ao criar conta bancária." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaBancaria = db.ContaBancaria;
      if (!ContaBancaria) {
        return res
          .status(500)
          .json({ message: "Modelo ContaBancaria não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaBancaria, req, { id: Number(id) });
      const conta = await ContaBancaria.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta bancária não encontrada." });

      const campos = [
        "banco",
        "instituicao",
        "agencia",
        "conta",
        "titular",
        "documento",
        "pixChave",
        "tipoChave",
        "descricao",
        "apelido",
        "saldoInicial",
        "saldo",
        "ativa",
        "tipo",
      ];
      const updates = pickAllowed(ContaBancaria, req.body || {}, campos);
      if (updates.ativa !== undefined) updates.ativa = !!updates.ativa;

      // Remove undefined para não sobrescrever
      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await conta.update(updates);
      return res.json(conta);
    } catch (error) {
      console.error("Erro ao atualizar conta bancária:", error);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar conta bancária." });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaBancaria = db.ContaBancaria;
      if (!ContaBancaria) {
        return res
          .status(500)
          .json({ message: "Modelo ContaBancaria não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaBancaria, req, { id: Number(id) });
      const conta = await ContaBancaria.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta bancária não encontrada." });

      await conta.destroy();
      return res.sendStatus(204);
    } catch (error) {
      console.error("Erro ao excluir conta bancária:", error);
      return res
        .status(500)
        .json({ message: "Erro ao excluir conta bancária." });
    }
  },
};
