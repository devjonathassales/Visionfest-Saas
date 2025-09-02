// src/controllers/funcionarioController.js
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Tenta usar o db já colocado pelo middleware; se não, resolve na hora
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// aplica escopo por empresaId somente se o campo existir no model
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

// normaliza números (CPF/telefone)
const onlyDigits = (v) => (v ? String(v).replace(/\D/g, "") : null);

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Funcionario = db.Funcionario;

      const { busca } = req.query;
      const where = scopedWhere(Funcionario, req);

      if (busca && String(busca).trim() !== "") {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${busca}%` } },
          { cpf: { [Op.iLike]: `%${busca}%` } },
          { email: { [Op.iLike]: `%${busca}%` } },
          { whatsapp: { [Op.iLike]: `%${busca}%` } },
        ];
      }

      const funcionarios = await Funcionario.findAll({
        where,
        order: [["nome", "ASC"]],
      });
      return res.json(funcionarios);
    } catch (err) {
      console.error("Erro listar funcionários:", err);
      return res.status(500).json({ message: "Erro ao listar funcionários." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Funcionario = db.Funcionario;

      const { id } = req.params;
      const where = scopedWhere(Funcionario, req, { id: Number(id) });

      const funcionario = await Funcionario.findOne({ where });
      if (!funcionario)
        return res.status(404).json({ message: "Funcionário não encontrado." });

      return res.json(funcionario);
    } catch (err) {
      console.error("Erro buscar funcionário:", err);
      return res.status(500).json({ message: "Erro ao buscar funcionário." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Funcionario = db.Funcionario;

      const {
        nome,
        cpf,
        whatsapp,
        celular,
        email,
        cargo,
        // quaisquer outros campos do seu model…
      } = req.body || {};

      if (!nome || !String(nome).trim())
        return res.status(400).json({ message: "Nome é obrigatório." });

      const cpfNorm = onlyDigits(cpf);
      const whatsNorm = onlyDigits(whatsapp);

      if (cpfNorm) {
        const where = scopedWhere(Funcionario, req, { cpf: cpfNorm });
        const existe = await Funcionario.findOne({ where });
        if (existe)
          return res.status(400).json({ message: "CPF já cadastrado." });
      }

      const payload = {
        nome: String(nome).trim(),
        cpf: cpfNorm,
        whatsapp: whatsNorm,
        celular,
        email,
        cargo,
      };

      // injeta empresaId se existir a coluna
      if (Funcionario?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const novo = await Funcionario.create(payload);
      return res.status(201).json(novo);
    } catch (err) {
      console.error("Erro criar funcionário:", err);
      return res.status(500).json({ message: "Erro ao criar funcionário." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Funcionario = db.Funcionario;

      const { id } = req.params;
      const where = scopedWhere(Funcionario, req, { id: Number(id) });
      const funcionario = await Funcionario.findOne({ where });
      if (!funcionario)
        return res.status(404).json({ message: "Funcionário não encontrado." });

      const {
        nome,
        cpf,
        whatsapp,
        celular,
        email,
        cargo,
        // quaisquer outros campos do seu model…
      } = req.body || {};

      const cpfNorm = cpf !== undefined ? onlyDigits(cpf) : funcionario.cpf;
      const whatsNorm =
        whatsapp !== undefined ? onlyDigits(whatsapp) : funcionario.whatsapp;

      if (cpfNorm) {
        const dupWhere = scopedWhere(Funcionario, req, {
          cpf: cpfNorm,
          id: { [Op.ne]: Number(id) },
        });
        const duplicado = await Funcionario.findOne({ where: dupWhere });
        if (duplicado)
          return res
            .status(400)
            .json({ message: "CPF já cadastrado em outro funcionário." });
      }

      const updates = {
        nome: nome !== undefined ? String(nome).trim() : funcionario.nome,
        cpf: cpfNorm,
        whatsapp: whatsNorm,
        celular: celular !== undefined ? celular : funcionario.celular,
        email: email !== undefined ? email : funcionario.email,
        cargo: cargo !== undefined ? cargo : funcionario.cargo,
      };

      await funcionario.update(updates);
      return res.json(funcionario);
    } catch (err) {
      console.error("Erro atualizar funcionário:", err);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar funcionário." });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Funcionario = db.Funcionario;

      const { id } = req.params;
      const where = scopedWhere(Funcionario, req, { id: Number(id) });
      const funcionario = await Funcionario.findOne({ where });
      if (!funcionario)
        return res.status(404).json({ message: "Funcionário não encontrado." });

      await funcionario.destroy();
      return res.json({ message: "Funcionário excluído com sucesso." });
    } catch (err) {
      console.error("Erro excluir funcionário:", err);
      return res.status(500).json({ message: "Erro ao excluir funcionário." });
    }
  },
};
