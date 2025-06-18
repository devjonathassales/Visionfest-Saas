const Cliente = require("../models/Cliente");
const { Op } = require("sequelize");

module.exports = {
  async listar(req, res) {
    try {
      const { busca } = req.query;

      const where = busca
        ? {
            [Op.or]: [
              { nome: { [Op.iLike]: `%${busca}%` } },
              { cpf: { [Op.iLike]: `%${busca}%` } },
              { email: { [Op.iLike]: `%${busca}%` } },
              { whatsapp: { [Op.iLike]: `%${busca}%` } },
            ],
          }
        : {};

      const clientes = await Cliente.findAll({ where, order: [["nome", "ASC"]] });
      return res.json(clientes);
    } catch (error) {
      console.error("Erro listar clientes:", error);
      return res.status(500).json({ message: "Erro ao listar clientes." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const cliente = await Cliente.findByPk(id);
      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

      return res.json(cliente);
    } catch (error) {
      console.error("Erro buscar cliente:", error);
      return res.status(500).json({ message: "Erro ao buscar cliente." });
    }
  },

  async criar(req, res) {
    try {
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
      } = req.body;

      // Validar se já existe CPF ou email
      const cpfExistente = await Cliente.findOne({ where: { cpf } });
      if (cpfExistente) return res.status(400).json({ message: "CPF já cadastrado." });

      const emailExistente = await Cliente.findOne({ where: { email } });
      if (emailExistente) return res.status(400).json({ message: "Email já cadastrado." });

      const novoCliente = await Cliente.create({
        nome,
        cpf,
        whatsapp,
        celular,
        dataNascimento: dataNascimento
          ? dataNascimento.split("/").reverse().join("-") // dd/mm/yyyy => yyyy-mm-dd
          : null,
        email,
        instagram,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      });

      return res.status(201).json(novoCliente);
    } catch (error) {
      console.error("Erro criar cliente:", error);
      return res.status(500).json({ message: "Erro ao criar cliente." });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const cliente = await Cliente.findByPk(id);
      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

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
      } = req.body;

      // Validar se o CPF ou email já existe para outro cliente
      const cpfExistente = await Cliente.findOne({
        where: { cpf, id: { [Op.ne]: id } },
      });
      if (cpfExistente) return res.status(400).json({ message: "CPF já cadastrado." });

      const emailExistente = await Cliente.findOne({
        where: { email, id: { [Op.ne]: id } },
      });
      if (emailExistente) return res.status(400).json({ message: "Email já cadastrado." });

      await cliente.update({
        nome,
        cpf,
        whatsapp,
        celular,
        dataNascimento: dataNascimento
          ? dataNascimento.split("/").reverse().join("-")
          : null,
        email,
        instagram,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      });

      return res.json(cliente);
    } catch (error) {
      console.error("Erro atualizar cliente:", error);
      return res.status(500).json({ message: "Erro ao atualizar cliente." });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const cliente = await Cliente.findByPk(id);
      if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

      await cliente.destroy();
      return res.json({ message: "Cliente deletado com sucesso." });
    } catch (error) {
      console.error("Erro deletar cliente:", error);
      return res.status(500).json({ message: "Erro ao deletar cliente." });
    }
  },
};
