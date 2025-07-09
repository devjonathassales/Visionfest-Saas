const { Empresa } = require("../models");
const { criarBancoCliente } = require("../../utils/tenantUtils");

exports.criarEmpresa = async (req, res) => {
  try {
    const { nome, dominio } = req.body;
    const nomeBanco = `cliente_${dominio.replace(/\W/g, "_")}`;

    await criarBancoCliente(nomeBanco);

    const empresa = await Empresa.create({
      nome,
      dominio,
      bancoDados: nomeBanco,
    });

    res.status(201).json(empresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao criar empresa" });
  }
};

exports.listarEmpresas = async (_req, res) => {
  try {
    const empresas = await Empresa.findAll();
    res.json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao listar empresas" });
  }
};

exports.bloquearEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada" });

    empresa.status = "bloqueado";
    await empresa.save();

    res.json({ mensagem: "Empresa bloqueada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao bloquear empresa" });
  }
};
