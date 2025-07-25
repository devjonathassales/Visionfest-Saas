const { Empresa, Plano, ContaReceber } = require("../models");
const { gerarParcelasPlanoAnual } = require("../utils/financeiroUtils");
const { createSchemaAndUser } = require("../utils/dbUtils");
const bcrypt = require("bcryptjs");

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

    // ✅ Validação básica
    if (
      !nome ||
      !cpfCnpj ||
      !dominio ||
      !planoId ||
      !diaVencimento ||
      !email ||
      !senhaSuperAdmin
    ) {
      return res
        .status(400)
        .json({ mensagem: "Preencha todos os campos obrigatórios." });
    }

    // ✉️ E-mail válido
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      return res.status(400).json({ mensagem: "E-mail inválido." });
    }

    // 🔐 Senha mínima
    if (senhaSuperAdmin.length < 6) {
      return res
        .status(400)
        .json({ mensagem: "A senha deve ter no mínimo 6 caracteres." });
    }

    // 📦 Verifica plano
    const plano = await Plano.findByPk(planoId);
    if (!plano) {
      return res.status(400).json({ mensagem: "Plano informado não existe." });
    }

    // 🔁 Unicidade
    const [empresaExistente, dominioExistente] = await Promise.all([
      Empresa.findOne({ where: { cpfCnpj } }),
      Empresa.findOne({ where: { dominio } }),
    ]);

    if (empresaExistente) {
      return res
        .status(400)
        .json({ mensagem: "Já existe uma empresa com este CPF/CNPJ." });
    }
    if (dominioExistente) {
      return res
        .status(400)
        .json({ mensagem: "Já existe uma empresa com este domínio." });
    }

    // 🛠 Gera nome do schema e cria banco + usuário
    const nomeBanco = `cliente_${dominio.replace(/\W/g, "_").toLowerCase()}`;
    const senhaCriptografada = await bcrypt.hash(senhaSuperAdmin, 10);
    await createSchemaAndUser(nomeBanco, email, senhaCriptografada);

    // 🏢 Cria empresa
    const novaEmpresa = await Empresa.create(
      {
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
        // logo: logoUrl, // ❌ Removido porque está indefinido
      },
      { transaction: t }
    );

    // 💰 Gera parcelas
    await gerarParcelasPlanoAnual({
      empresa: novaEmpresa,
      plano,
      diaVencimento,
      transaction: t,
    });

    await t.commit();

    return res.status(201).json({
      mensagem:
        "Empresa criada com sucesso. É necessário efetuar o pagamento para ativar.",
      empresa: novaEmpresa,
    });
  } catch (error) {
    console.error("❌ Erro ao criar empresa:", {
      mensagem: error.message,
      stack: error.stack,
    });
    await t.rollback();
    return res.status(500).json({ mensagem: "Erro ao criar empresa." });
  }
}

// 🔒 Rota protegida
exports.criarEmpresa = async (req, res) => processarCriacaoEmpresa(req, res);

// 🌐 Rota pública
exports.criarEmpresaViaWizard = async (req, res) =>
  processarCriacaoEmpresa(req, res);

// ✅ Ativar empresa (após verificar pagamentos)
exports.ativarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id, {
      include: [
        {
          model: ContaReceber,
          attributes: ["id", "status", "valor", "vencimento"],
        },
      ],
    });

    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });

    const contasAbertas = empresa.ContaRecebers.filter(
      (c) => c.status !== "pago"
    );

    if (contasAbertas.length > 0) {
      return res.status(400).json({
        mensagem:
          "Não é possível ativar a empresa. Existem contas a receber em aberto ou em atraso.",
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

// 📋 Listar empresas
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
// 🚀 Upgrade de Plano
exports.upgradePlanoEmpresa = async (req, res) => {
  const t = await Empresa.sequelize.transaction();
  try {
    const { id } = req.params;
    const { novoPlanoId, novaDataVencimento } = req.body;

    const empresa = await Empresa.findByPk(id, { transaction: t });
    if (!empresa) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Empresa não encontrada." });
    }

    const planoAtual = await Plano.findByPk(empresa.planoId);
    const novoPlano = await Plano.findByPk(novoPlanoId);

    if (!novoPlano) {
      await t.rollback();
      return res.status(400).json({ mensagem: "Novo plano não encontrado." });
    }

    // ⛔ Impede downgrade
    if (novoPlano.valor < planoAtual.valor) {
      await t.rollback();
      return res
        .status(400)
        .json({ mensagem: "Não é permitido fazer downgrade de plano." });
    }

    // 🧹 Remove contas futuras ainda não pagas
    await ContaReceber.destroy({
      where: {
        empresaId: empresa.id,
        status: "pendente",
      },
      transaction: t,
    });

    // 💾 Atualiza dados da empresa
    empresa.planoId = novoPlanoId;
    empresa.diaVencimento = novaDataVencimento;
    await empresa.save({ transaction: t });

    // 💰 Gera novas parcelas com cálculo proporcional (função já existente)
    await gerarParcelasPlanoAnual({
      empresa,
      plano: novoPlano,
      diaVencimento: novaDataVencimento,
      transaction: t,
    });

    await t.commit();
    return res.json({ mensagem: "Upgrade realizado com sucesso.", empresa });
  } catch (error) {
    await t.rollback();
    console.error("❌ Erro no upgrade de plano:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao realizar upgrade de plano." });
  }
};

// 🔐 Bloquear/desbloquear
exports.bloquearDesbloquear = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);

    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });

    empresa.status = empresa.status === "bloqueado" ? "ativo" : "bloqueado";
    await empresa.save();

    return res.json({
      mensagem: `Empresa ${
        empresa.status === "ativo" ? "desbloqueada" : "bloqueada"
      } com sucesso.`,
      status: empresa.status,
    });
  } catch (error) {
    console.error("❌ Erro ao bloquear/desbloquear empresa:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao atualizar status da empresa." });
  }
};
