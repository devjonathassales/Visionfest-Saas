const { getDbCliente } = require("../utils/multiTenant");
const { Op } = require("sequelize");

module.exports = {
  async listar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Cliente } = db.models;

      const { busca } = req.query;

      const where = busca
        ? {
            [Op.and]: [
              { empresaId: req.empresaId },
              {
                [Op.or]: [
                  { nome: { [Op.iLike]: `%${busca}%` } },
                  { cpf: { [Op.iLike]: `%${busca}%` } },
                  { email: { [Op.iLike]: `%${busca}%` } },
                  { whatsapp: { [Op.iLike]: `%${busca}%` } },
                ],
              },
            ],
          }
        : { empresaId: req.empresaId };

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
      const db = getDbCliente(req.bancoCliente);
      const { Cliente } = db.models;

      const { id } = req.params;
      const cliente = await Cliente.findOne({
        where: { id, empresaId: req.empresaId },
      });

      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

      return res.json(cliente);
    } catch (error) {
      console.error("Erro buscar cliente:", error);
      return res.status(500).json({ message: "Erro ao buscar cliente." });
    }
  },

  async criar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Cliente } = db.models;

      const {
        nome, cpf, whatsapp, celular, dataNascimento,
        email, instagram, cep, logradouro, numero,
        complemento, bairro, cidade, estado,
      } = req.body;

      const cpfExistente = await Cliente.findOne({
        where: { cpf, empresaId: req.empresaId },
      });
      if (cpfExistente) return res.status(400).json({ message: "CPF já cadastrado." });

      const emailExistente = await Cliente.findOne({
        where: { email, empresaId: req.empresaId },
      });
      if (emailExistente) return res.status(400).json({ message: "Email já cadastrado." });

      const novoCliente = await Cliente.create({
        nome, cpf, whatsapp, celular,
        dataNascimento: dataNascimento ? dataNascimento.split("/").reverse().join("-") : null,
        email, instagram, cep, logradouro, numero,
        complemento, bairro, cidade, estado,
        empresaId: req.empresaId,
      });

      return res.status(201).json(novoCliente);
    } catch (error) {
      console.error("Erro criar cliente:", error);
      return res.status(500).json({ message: "Erro ao criar cliente." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Cliente } = db.models;

      const { id } = req.params;
      const cliente = await Cliente.findOne({
        where: { id, empresaId: req.empresaId },
      });
      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

      const {
        nome, cpf, whatsapp, celular, dataNascimento,
        email, instagram, cep, logradouro, numero,
        complemento, bairro, cidade, estado,
      } = req.body;

      const cpfExistente = await Cliente.findOne({
        where: { cpf, empresaId: req.empresaId, id: { [Op.ne]: id } },
      });
      if (cpfExistente) return res.status(400).json({ message: "CPF já cadastrado." });

      const emailExistente = await Cliente.findOne({
        where: { email, empresaId: req.empresaId, id: { [Op.ne]: id } },
      });
      if (emailExistente) return res.status(400).json({ message: "Email já cadastrado." });

      await cliente.update({
        nome, cpf, whatsapp, celular,
        dataNascimento: dataNascimento ? dataNascimento.split("/").reverse().join("-") : null,
        email, instagram, cep, logradouro, numero,
        complemento, bairro, cidade, estado,
      });

      return res.json(cliente);
    } catch (error) {
      console.error("Erro atualizar cliente:", error);
      return res.status(500).json({ message: "Erro ao atualizar cliente." });
    }
  },

  async deletar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Cliente } = db.models;

      const { id } = req.params;
      const cliente = await Cliente.findOne({
        where: { id, empresaId: req.empresaId },
      });
      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

      await cliente.destroy();
      return res.json({ message: "Cliente deletado com sucesso." });
    } catch (error) {
      console.error("Erro deletar cliente:", error);
      return res.status(500).json({ message: "Erro ao deletar cliente." });
    }
  },
};
