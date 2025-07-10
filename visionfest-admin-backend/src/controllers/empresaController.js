const { Empresa, Plano } = require("../models");
const { criarBancoCliente } = require("../../utils/tenantUtils");

exports.criarEmpresa = async (req, res) => {
  try {
    const {
      nome,
      cpfCnpj,
      dominio,
      planoId, // Agora recebe o id do plano
      cep,
      endereco,
      bairro,
      cidade,
      uf,
      whatsapp,
      instagram,
      email,
      usuarioSuperAdmin,
      senhaSuperAdmin,
    } = req.body;

    // 🔒 Valida se o plano existe pelo ID
    const planoEncontrado = await Plano.findByPk(planoId);
    if (!planoEncontrado) {
      return res.status(400).json({ mensagem: "Plano informado não existe." });
    }

    // 🔒 Verifica duplicidade de CPF/CNPJ
    const empresaExistente = await Empresa.findOne({
      where: { cpfCnpj },
    });
    if (empresaExistente) {
      return res
        .status(400)
        .json({ mensagem: "Já existe uma empresa com este CPF/CNPJ." });
    }

    // 🔒 Verifica duplicidade de domínio
    const dominioExistente = await Empresa.findOne({
      where: { dominio },
    });
    if (dominioExistente) {
      return res
        .status(400)
        .json({ mensagem: "Já existe uma empresa com este domínio." });
    }

    // 🗄️ Cria banco de dados para a empresa
    const nomeBanco = `cliente_${dominio.replace(/\W/g, "_").toLowerCase()}`;
    await criarBancoCliente(nomeBanco);

    // 📂 Salvar logo se enviada
    let logoUrl = null;
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    // 📄 Cria empresa usando planoId no FK
    const novaEmpresa = await Empresa.create({
      nome,
      cpfCnpj,
      dominio,
      bancoDados: nomeBanco,
      cep,
      endereco,
      bairro,
      cidade,
      uf,
      whatsapp,
      instagram,
      email,
      logoUrl,
      planoId,  // usar o campo correto FK
      usuarioSuperAdmin,
      senhaSuperAdmin,
      status: "ativo", // padrão
    });

    res.status(201).json(novaEmpresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao criar empresa" });
  }
};

exports.listarEmpresas = async (_req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: {
        exclude: ["senhaSuperAdmin"], // nunca enviar senha
      },
    });
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
    if (!empresa) {
      return res.status(404).json({ mensagem: "Empresa não encontrada" });
    }

    empresa.status = "bloqueado";
    await empresa.save();

    res.json({ mensagem: "Empresa bloqueada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao bloquear empresa" });
  }
};
