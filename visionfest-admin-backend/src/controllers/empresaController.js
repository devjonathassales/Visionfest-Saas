// controllers/empresaController.js
const { Empresa, Plano, ContaReceber, sequelize } = require("../models");
const { gerarParcelasPlanoAnual } = require("../utils/financeiroUtils");
const { createSchemaAndSyncModels, withTenantDb } = require("../utils/dbUtils"); // <= IMPORT atualizado
const { verificarEAtivarEmpresa } = require("../utils/empresaUtils");
const bcrypt = require("bcryptjs");

// helper para checar atributos com segurança
const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];

async function processarCriacaoEmpresa(req, res) {
  console.log("📩 Dados recebidos:", req.body);
  const t = await Empresa.sequelize.transaction();

  try {
    const {
      nome,
      cpfCnpj,
      dominio,
      planoId,
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
      !email ||
      !senhaSuperAdmin
    ) {
      return res
        .status(400)
        .json({ mensagem: "Preencha todos os campos obrigatórios." });
    }

    // ✉️ Validação e-mail
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    if (!plano)
      return res.status(400).json({ mensagem: "Plano informado não existe." });

    // 🔁 Unicidade
    const [empresaExistente, dominioExistente] = await Promise.all([
      Empresa.findOne({ where: { cpfCnpj } }),
      Empresa.findOne({ where: { dominio } }),
    ]);
    if (empresaExistente)
      return res
        .status(400)
        .json({ mensagem: "Já existe uma empresa com este CPF/CNPJ." });
    if (dominioExistente)
      return res
        .status(400)
        .json({ mensagem: "Já existe uma empresa com este domínio." });

    // 🛠 Nome do schema seguro
    const nomeBanco = `cliente_${dominio.replace(/\W/g, "_").toLowerCase()}`;

    // 🗄 Criar schema do cliente isolado e carregar models
    await createSchemaAndSyncModels(nomeBanco, {
      nome,
      email,
      senhaSuperAdmin,
    });

    // 🏢 Criar registro da empresa no painel administrativo (schema public)
    const senhaCriptografada = await bcrypt.hash(senhaSuperAdmin, 10);
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
        status: "aguardando_pagamento",
      },
      { transaction: t }
    );

    // 💰 Gera parcelas no schema public
    await gerarParcelasPlanoAnual({
      empresa: novaEmpresa,
      plano,
      transaction: t,
    });

    /* ===================== NOVO: semear no schema do cliente ===================== */
    await withTenantDb(nomeBanco, async ({ models }) => {
      const {
        Empresa: EmpresaT,
        Endereco: EnderecoT,
        Contrato: ContratoT,
        ContaReceber: CRT,
      } = models;

      // 1) Empresa do tenant (mantém o mesmo id se possível)
      let empresaTenant = null;
      if (EmpresaT) {
        const payloadEmpresa = {
          id: novaEmpresa.id, // se PK permitir
          nome,
          // nomes de colunas variam entre apps; preencha onde existir:
          ...(hasAttr(EmpresaT, "documento") ? { documento: cpfCnpj } : {}),
          ...(hasAttr(EmpresaT, "cpfCnpj") ? { cpfCnpj } : {}),
          ...(hasAttr(EmpresaT, "whatsapp") ? { whatsapp } : {}),
          ...(hasAttr(EmpresaT, "telefone") ? { telefone: null } : {}),
          ...(hasAttr(EmpresaT, "email") ? { email } : {}),
          ...(hasAttr(EmpresaT, "instagram") ? { instagram } : {}),
          ...(hasAttr(EmpresaT, "dominio") ? { dominio } : {}),
          ...(hasAttr(EmpresaT, "cep") ? { cep } : {}),
          ...(hasAttr(EmpresaT, "endereco") ? { endereco } : {}),
          ...(hasAttr(EmpresaT, "numero") ? { numero } : {}),
          ...(hasAttr(EmpresaT, "bairro") ? { bairro } : {}),
          ...(hasAttr(EmpresaT, "cidade") ? { cidade } : {}),
          ...(hasAttr(EmpresaT, "uf") ? { uf } : {}),
          ...(hasAttr(EmpresaT, "ativo") ? { ativo: true } : {}),
        };

        try {
          empresaTenant = await EmpresaT.create(payloadEmpresa);
        } catch {
          // se não aceitar setar "id" manualmente
          delete payloadEmpresa.id;
          empresaTenant = await EmpresaT.create(payloadEmpresa);
        }
      }

      // 2) Endereço padrão
      if (EnderecoT && empresaTenant) {
        const endPayload = {
          ...(hasAttr(EnderecoT, "empresaId")
            ? { empresaId: empresaTenant.id }
            : {}),
          ...(hasAttr(EnderecoT, "cep") ? { cep } : {}),
          ...(hasAttr(EnderecoT, "logradouro") ? { logradouro: endereco } : {}),
          ...(hasAttr(EnderecoT, "numero") ? { numero } : {}),
          ...(hasAttr(EnderecoT, "bairro") ? { bairro } : {}),
          ...(hasAttr(EnderecoT, "cidade") ? { cidade } : {}),
          ...(hasAttr(EnderecoT, "estado") ? { estado: uf } : {}),
          ...(hasAttr(EnderecoT, "padrao") ? { padrao: true } : {}),
        };
        await EnderecoT.create(endPayload);
      }

      // 3) Contrato
      let contratoId = null;
      if (ContratoT && empresaTenant) {
        const agora = new Date();
        const validade = new Date(agora);
        validade.setMonth(validade.getMonth() + 12);

        const contratoPayload = {
          ...(hasAttr(ContratoT, "empresaId")
            ? { empresaId: empresaTenant.id }
            : {}),
          ...(hasAttr(ContratoT, "plano") ? { plano: plano.nome } : {}),
          ...(hasAttr(ContratoT, "valor") ? { valor: plano.valor } : {}),
          ...(hasAttr(ContratoT, "dataInicio") ? { dataInicio: agora } : {}),
          ...(hasAttr(ContratoT, "dataValidade")
            ? { dataValidade: validade }
            : {}),
          ...(hasAttr(ContratoT, "renovacaoAutomatica")
            ? { renovacaoAutomatica: true }
            : {}),
          ...(hasAttr(ContratoT, "status") ? { status: "ativo" } : {}),
          ...(hasAttr(ContratoT, "dataEvento") ? { dataEvento: agora } : {}),
        };

        const contrato = await ContratoT.create(contratoPayload);
        contratoId = contrato.id;
      }

      // 4) Clonar parcelas (ContaReceber) do PUBLIC -> TENANT
      if (CRT && empresaTenant) {
        const publicParcelas = await ContaReceber.findAll({
          where: { empresaId: novaEmpresa.id },
          order: [["vencimento", "ASC"]],
          transaction: t, // lê dentro da transação do public
        });

        const rows = publicParcelas.map((p) => {
          const r = {};
          if (hasAttr(CRT, "empresaId")) r.empresaId = empresaTenant.id;
          if (hasAttr(CRT, "numero") && p.numero != null) r.numero = p.numero;
          if (hasAttr(CRT, "descricao"))
            r.descricao = p.descricao || `Mensalidade do plano ${plano.nome}`;
          if (hasAttr(CRT, "vencimento")) r.vencimento = p.vencimento;

          // valor
          if (hasAttr(CRT, "valorTotal"))
            r.valorTotal = p.valorTotal ?? p.valor ?? plano.valor;
          if (!hasAttr(CRT, "valorTotal") && hasAttr(CRT, "valor"))
            r.valor = p.valor ?? p.valorTotal ?? plano.valor;

          // status
          if (hasAttr(CRT, "status")) r.status = p.status || "aberto";

          // link com contrato, se houver
          if (hasAttr(CRT, "contratoId") && contratoId)
            r.contratoId = contratoId;

          return r;
        });

        if (rows.length) {
          await CRT.bulkCreate(rows);
        }
      }
    });
    /* ===================== /NOVO ===================== */

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
exports.criarEmpresa = (req, res) => processarCriacaoEmpresa(req, res);

// 🌐 Rota pública (Wizard)
exports.criarEmpresaViaWizard = (req, res) => processarCriacaoEmpresa(req, res);

// ✅ Ativar empresa
exports.ativarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    await verificarEAtivarEmpresa(id);
    const empresaAtualizada = await Empresa.findByPk(id);
    if (!empresaAtualizada)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });

    if (empresaAtualizada.status !== "ativo") {
      return res.status(400).json({
        mensagem:
          "Empresa não pode ser ativada. Verifique pagamentos e atrasos.",
      });
    }

    return res.json({
      mensagem: "Empresa ativada com sucesso.",
      empresa: empresaAtualizada,
    });
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

// 🔄 Editar empresa
exports.editarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });

    await empresa.update(req.body);
    return res.json({ mensagem: "Empresa atualizada com sucesso.", empresa });
  } catch (error) {
    console.error("❌ Erro ao editar empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao editar empresa." });
  }
};

// 🔒 Excluir empresa
exports.excluirEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.schema("public").findByPk(id);
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });

    const contasPagas = await ContaReceber.schema("public").findAll({
      where: { empresaId: id, status: "pago" },
    });
    if (contasPagas.length > 0) {
      return res.status(400).json({
        mensagem:
          "Não é possível excluir a empresa, pois já existem pagamentos realizados.",
      });
    }

    const schema = empresa.bancoDados;
    await sequelize.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`, {
      raw: true,
    });
    await ContaReceber.schema("public").destroy({ where: { empresaId: id } });
    await empresa.destroy();

    return res.json({ mensagem: "Empresa excluída com sucesso." });
  } catch (error) {
    console.error("❌ Erro ao excluir empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao excluir empresa." });
  }
};

// 🚀 Upgrade de plano
exports.upgradePlanoEmpresa = async (req, res) => {
  const t = await Empresa.sequelize.transaction();
  try {
    const { id } = req.params;
    const { novoPlanoId } = req.body;

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

    if (novoPlano.valor < planoAtual.valor) {
      await t.rollback();
      return res
        .status(400)
        .json({ mensagem: "Não é permitido fazer downgrade de plano." });
    }

    await ContaReceber.destroy({
      where: { empresaId: empresa.id, status: "aberto" },
      transaction: t,
    });

    empresa.planoId = novoPlanoId;
    await gerarParcelasPlanoAnual({
      empresa,
      plano: novoPlano,
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

// 🔐 Bloquear/desbloquear empresa
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
