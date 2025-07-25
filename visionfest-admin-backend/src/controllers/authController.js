const { Empresa, Plano, ContaReceber } = require("../models");
const { gerarParcelasPlanoAnual } = require("../utils/financeiroUtils");
const { createSchemaAndUser } = require("../utils/dbUtils");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../models");

// 🔐 Função interna reutilizável
async function processarCriacaoEmpresa(req, res) {
  console.log("📩 Dados recebidos:", req.body);
  const t = await Empresa.sequelize.transaction();

  try {
    const {
      nome,
      cpfCnpj,
      dominio,
      planoId,
      diaVencimento,
      cep,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      whatsapp,
      instagram,
      email,
      senhaSuperAdmin,
    } = req.body;

    if (!nome || !cpfCnpj || !dominio || !planoId || !diaVencimento || !email || !senhaSuperAdmin) {
      return res.status(400).json({ mensagem: "Preencha todos os campos obrigatórios." });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) return res.status(400).json({ mensagem: "E-mail inválido." });
    if (senhaSuperAdmin.length < 6) return res.status(400).json({ mensagem: "Senha fraca." });

    const plano = await Plano.findByPk(planoId);
    if (!plano) return res.status(400).json({ mensagem: "Plano inválido." });

    const [empresaExistente, dominioExistente] = await Promise.all([
      Empresa.findOne({ where: { cpfCnpj } }),
      Empresa.findOne({ where: { dominio } }),
    ]);
    if (empresaExistente) return res.status(400).json({ mensagem: "CPF/CNPJ já cadastrado." });
    if (dominioExistente) return res.status(400).json({ mensagem: "Domínio já em uso." });

    const nomeBanco = `cliente_${dominio.replace(/\W/g, "_").toLowerCase()}`;
    const senhaCriptografada = await bcrypt.hash(senhaSuperAdmin, 10);

    await createSchemaAndUser(nomeBanco, email, senhaCriptografada);

    const novaEmpresa = await Empresa.create({
      nome,
      cpfCnpj,
      dominio,
      bancoDados: nomeBanco,
      cep,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      whatsapp,
      instagram,
      email,
      planoId,
      usuarioSuperAdmin: email,
      senhaSuperAdmin: senhaCriptografada,
      diaVencimento,
      status: "aguardando_pagamento",
    }, { transaction: t });

    await gerarParcelasPlanoAnual({
      empresa: novaEmpresa,
      plano,
      diaVencimento,
      transaction: t,
    });

    await t.commit();

    const linkAcesso = `https://${dominio}.seusistema.com.br`;

    return res.status(201).json({
      mensagem: "Empresa criada com sucesso. É necessário efetuar o pagamento.",
      empresa: novaEmpresa,
      linkAcesso,
    });
  } catch (error) {
    console.error("❌ Erro ao criar empresa:", error);
    await t.rollback();
    return res.status(500).json({ mensagem: "Erro ao criar empresa." });
  }
}

exports.criarEmpresa = processarCriacaoEmpresa;
exports.criarEmpresaViaWizard = processarCriacaoEmpresa;

exports.ativarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id, {
      include: [{ model: ContaReceber }],
    });

    if (!empresa) return res.status(404).json({ mensagem: "Empresa não encontrada." });

    const contasAbertas = empresa.ContaRecebers.filter((c) => c.status !== "pago");
    if (contasAbertas.length > 0) {
      return res.status(400).json({
        mensagem: "Não é possível ativar a empresa. Existem contas pendentes.",
        contasPendentes: contasAbertas,
      });
    }

    empresa.status = "ativo";
    await empresa.save();

    return res.json({ mensagem: "Empresa ativada com sucesso", empresa });
  } catch (error) {
    console.error("❌ Erro ao ativar empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao ativar empresa." });
  }
};

exports.listarEmpresas = async (_req, res) => {
  try {
    const empresas = await Empresa.findAll({
      attributes: { exclude: ["senhaSuperAdmin"] },
    });

    const empresasComBadge = empresas.map((e) => ({
      ...e.toJSON(),
      statusBadge:
        e.status === "ativo"
          ? { text: "Ativo", color: "green" }
          : e.status === "bloqueado"
          ? { text: "Bloqueado", color: "red" }
          : { text: "Aguardando Pagamento", color: "yellow" },
    }));

    return res.json(empresasComBadge);
  } catch (error) {
    console.error("❌ Erro ao listar empresas:", error);
    return res.status(500).json({ mensagem: "Erro ao listar empresas." });
  }
};

exports.bloquearDesbloquear = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) return res.status(404).json({ mensagem: "Empresa não encontrada." });

    empresa.status = empresa.status === "bloqueado" ? "ativo" : "bloqueado";
    await empresa.save();

    return res.json({
      mensagem: `Empresa ${empresa.status === "ativo" ? "desbloqueada" : "bloqueada"} com sucesso.`,
      status: empresa.status,
    });
  } catch (error) {
    console.error("❌ Erro ao bloquear/desbloquear empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao atualizar status da empresa." });
  }
};

// ✏️ Atualizar dados da empresa (exceto domínio/email/senha)
exports.editarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) return res.status(404).json({ mensagem: "Empresa não encontrada." });

    const camposNaoPermitidos = ["dominio", "email", "senhaSuperAdmin"];
    camposNaoPermitidos.forEach((campo) => delete req.body[campo]);

    await empresa.update(req.body);

    return res.json({ mensagem: "Empresa atualizada com sucesso.", empresa });
  } catch (error) {
    console.error("❌ Erro ao atualizar empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao atualizar empresa." });
  }
};

// 🗑 Excluir empresa (se nenhuma parcela foi paga)
exports.excluirEmpresa = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id, {
      include: [ContaReceber],
    });

    if (!empresa) return res.status(404).json({ mensagem: "Empresa não encontrada." });

    const algumaParcelaPaga = empresa.ContaRecebers.some((c) => c.status === "pago");
    if (algumaParcelaPaga) {
      return res.status(400).json({ mensagem: "Não é possível excluir empresa com pagamentos realizados." });
    }

    await ContaReceber.destroy({ where: { empresaId: id }, transaction: t });
    await Empresa.destroy({ where: { id }, transaction: t });

    // Remove schema do banco
    await sequelize.query(`DROP SCHEMA IF EXISTS "${empresa.bancoDados}" CASCADE;`, { transaction: t });

    await t.commit();
    return res.json({ mensagem: "Empresa excluída com sucesso." });
  } catch (error) {
    await t.rollback();
    console.error("❌ Erro ao excluir empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao excluir empresa." });
  }
};
