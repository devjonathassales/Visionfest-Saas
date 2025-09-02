// src/controllers/clienteController.js
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// tenta usar o db já colocado pelo middleware; se não, resolve na hora
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// dd/mm/aaaa -> aaaa-mm-dd (ou mantém como veio se já estiver ISO)
function normalizeDate(d) {
  if (!d || typeof d !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d; // já ISO
  const [dd, mm, yyyy] = d.split("/");
  if (dd && mm && yyyy)
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  return d;
}

// aplica escopo por empresaId somente se o campo existir no model
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Cliente = db.Cliente;

      const { busca } = req.query;

      const where = scopedWhere(Cliente, req);
      if (busca && String(busca).trim() !== "") {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${busca}%` } },
          { cpf: { [Op.iLike]: `%${busca}%` } },
          { email: { [Op.iLike]: `%${busca}%` } },
          { whatsapp: { [Op.iLike]: `%${busca}%` } },
        ];
      }

      const clientes = await Cliente.findAll({
        where,
        order: [["nome", "ASC"]],
      });
      return res.json(clientes);
    } catch (error) {
      console.error("Erro listar clientes:", error);
      return res.status(500).json({ message: "Erro ao listar clientes." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Cliente = db.Cliente;

      const { id } = req.params;
      const where = scopedWhere(Cliente, req, { id: Number(id) });

      const cliente = await Cliente.findOne({ where });
      if (!cliente)
        return res.status(404).json({ message: "Cliente não encontrado." });

      return res.json(cliente);
    } catch (error) {
      console.error("Erro buscar cliente:", error);
      return res.status(500).json({ message: "Erro ao buscar cliente." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Cliente = db.Cliente;

      const {
        nome,
        cpf,
        whatsapp,
        celular,
        dataNascimento,
        email,
        instagram,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      } = req.body || {};

      // unicidade por CPF/email dentro da empresa, se houver coluna empresaId
      if (cpf) {
        const cpfWhere = scopedWhere(Cliente, req, { cpf });
        const cpfExistente = await Cliente.findOne({ where: cpfWhere });
        if (cpfExistente)
          return res.status(400).json({ message: "CPF já cadastrado." });
      }

      if (email) {
        const emailWhere = scopedWhere(Cliente, req, { email });
        const emailExistente = await Cliente.findOne({ where: emailWhere });
        if (emailExistente)
          return res.status(400).json({ message: "Email já cadastrado." });
      }

      const payload = {
        nome,
        cpf,
        whatsapp,
        celular,
        dataNascimento: normalizeDate(dataNascimento),
        email,
        instagram,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };

      // injeta empresaId se existir a coluna
      if (Cliente?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const novoCliente = await Cliente.create(payload);
      return res.status(201).json(novoCliente);
    } catch (error) {
      console.error("Erro criar cliente:", error);
      return res.status(500).json({ message: "Erro ao criar cliente." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Cliente = db.Cliente;

      const { id } = req.params;
      const where = scopedWhere(Cliente, req, { id: Number(id) });
      const cliente = await Cliente.findOne({ where });
      if (!cliente)
        return res.status(404).json({ message: "Cliente não encontrado." });

      const {
        nome,
        cpf,
        whatsapp,
        celular,
        dataNascimento,
        email,
        instagram,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      } = req.body || {};

      if (cpf) {
        const cpfWhere = scopedWhere(Cliente, req, {
          cpf,
          id: { [Op.ne]: Number(id) },
        });
        const cpfExistente = await Cliente.findOne({ where: cpfWhere });
        if (cpfExistente)
          return res.status(400).json({ message: "CPF já cadastrado." });
      }

      if (email) {
        const emailWhere = scopedWhere(Cliente, req, {
          email,
          id: { [Op.ne]: Number(id) },
        });
        const emailExistente = await Cliente.findOne({ where: emailWhere });
        if (emailExistente)
          return res.status(400).json({ message: "Email já cadastrado." });
      }

      const updates = {
        nome,
        cpf,
        whatsapp,
        celular,
        dataNascimento:
          dataNascimento !== undefined
            ? normalizeDate(dataNascimento)
            : cliente.dataNascimento,
        email,
        instagram,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };

      // remove undefined para não sobrescrever com undefined
      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await cliente.update(updates);
      return res.json(cliente);
    } catch (error) {
      console.error("Erro atualizar cliente:", error);
      return res.status(500).json({ message: "Erro ao atualizar cliente." });
    }
  },

  async deletar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Cliente = db.Cliente;

      const { id } = req.params;
      const where = scopedWhere(Cliente, req, { id: Number(id) });
      const cliente = await Cliente.findOne({ where });
      if (!cliente)
        return res.status(404).json({ message: "Cliente não encontrado." });

      await cliente.destroy();
      return res.json({ message: "Cliente deletado com sucesso." });
    } catch (error) {
      console.error("Erro deletar cliente:", error);
      return res.status(500).json({ message: "Erro ao deletar cliente." });
    }
  },
};
