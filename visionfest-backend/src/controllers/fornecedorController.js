// src/controllers/fornecedorController.js
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

function onlyDigits(v) {
  return typeof v === "string" ? v.replace(/\D/g, "") : v;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Fornecedor = db.Fornecedor;

      const where = scopedWhere(Fornecedor, req);
      const fornecedores = await Fornecedor.findAll({
        where,
        order: [["nome", "ASC"]],
      });
      return res.json(fornecedores);
    } catch (err) {
      console.error("Erro ao listar fornecedores:", err);
      return res.status(500).json({ message: "Erro ao listar fornecedores." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Fornecedor = db.Fornecedor;

      const { id } = req.params;
      const where = scopedWhere(Fornecedor, req, { id: Number(id) });

      const fornecedor = await Fornecedor.findOne({ where });
      if (!fornecedor) {
        return res.status(404).json({ message: "Fornecedor não encontrado." });
      }
      return res.json(fornecedor);
    } catch (err) {
      console.error("Erro ao buscar fornecedor:", err);
      return res.status(500).json({ message: "Erro ao buscar fornecedor." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Fornecedor = db.Fornecedor;

      const payload = {
        nome: req.body?.nome,
        cpfCnpj: onlyDigits(req.body?.cpfCnpj),
        endereco: req.body?.endereco,
        whatsapp: onlyDigits(req.body?.whatsapp),
        email: req.body?.email,
      };

      // checa duplicidade por cpfCnpj no escopo da empresa (se houver empresaId)
      if (payload.cpfCnpj) {
        const whereDup = scopedWhere(Fornecedor, req, {
          cpfCnpj: payload.cpfCnpj,
        });
        const existente = await Fornecedor.findOne({ where: whereDup });
        if (existente) {
          return res.status(400).json({ message: "CPF/CNPJ já cadastrado." });
        }
      }

      // injeta empresaId se a coluna existir
      if (Fornecedor?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const fornecedor = await Fornecedor.create(payload);
      return res.status(201).json(fornecedor);
    } catch (err) {
      console.error("Erro ao criar fornecedor:", err);
      return res.status(500).json({ message: "Erro ao criar fornecedor." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Fornecedor = db.Fornecedor;

      const { id } = req.params;
      const where = scopedWhere(Fornecedor, req, { id: Number(id) });
      const fornecedor = await Fornecedor.findOne({ where });
      if (!fornecedor) {
        return res.status(404).json({ message: "Fornecedor não encontrado." });
      }

      const updates = {
        nome: req.body?.nome,
        cpfCnpj: req.body?.cpfCnpj ? onlyDigits(req.body.cpfCnpj) : undefined,
        endereco: req.body?.endereco,
        whatsapp: req.body?.whatsapp
          ? onlyDigits(req.body.whatsapp)
          : undefined,
        email: req.body?.email,
      };

      // checa duplicidade por cpfCnpj (outro registro)
      if (updates.cpfCnpj) {
        const whereDup = scopedWhere(Fornecedor, req, {
          cpfCnpj: updates.cpfCnpj,
          id: { [Op.ne]: Number(id) },
        });
        const duplicado = await Fornecedor.findOne({ where: whereDup });
        if (duplicado) {
          return res
            .status(400)
            .json({ message: "CPF/CNPJ já cadastrado em outro fornecedor." });
        }
      }

      // remove undefined para não sobrescrever
      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await fornecedor.update(updates);
      return res.json(fornecedor);
    } catch (err) {
      console.error("Erro ao atualizar fornecedor:", err);
      return res.status(500).json({ message: "Erro ao atualizar fornecedor." });
    }
  },

  async deletar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Fornecedor = db.Fornecedor;

      const { id } = req.params;
      const where = scopedWhere(Fornecedor, req, { id: Number(id) });
      const fornecedor = await Fornecedor.findOne({ where });
      if (!fornecedor) {
        return res.status(404).json({ message: "Fornecedor não encontrado." });
      }

      await fornecedor.destroy();
      return res.json({ message: "Fornecedor excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir fornecedor:", err);
      return res.status(500).json({ message: "Erro ao excluir fornecedor." });
    }
  },
};
