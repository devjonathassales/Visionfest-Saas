// controllers/empresaController.js
const { Op } = require("sequelize");
const {
  Empresa,
  Plano,
  ContaReceber,
  CentroCusto: CentroCustoAdmin,
  sequelize,
} = require("../models");
const { gerarParcelasPlanoAnual } = require("../utils/financeiroUtils");
const { createSchemaAndSyncModels, withTenantDb } = require("../utils/dbUtils");
const { verificarEAtivarEmpresa } = require("../utils/empresaUtils");
const bcrypt = require("bcryptjs");

// helpers
const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];
const pickAttr = (Model, candidates = []) =>
  candidates.find((n) => !!Model?.rawAttributes?.[n]);
const numberOr = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  return 0;
};

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

    // 🛠 Nome do schema seguro
    const nomeBanco = `cliente_${dominio.replace(/\W/g, "_").toLowerCase()}`;

    // 🗄 Criar schema do cliente e sincronizar models do APP DO CLIENTE
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

    // 💰 Gera parcelas no schema public (Contas a Receber do admin)
    await gerarParcelasPlanoAnual({
      empresa: novaEmpresa,
      plano,
      transaction: t,
    });

    /* ===================== CLONE -> TENANT ===================== */
    await withTenantDb(nomeBanco, async ({ models }) => {
      const {
        Empresa: EmpresaT,
        Endereco: EnderecoT,
        ContratoCliente: ContratoClienteT, // contrato do SaaS no tenant
        ContaPagar: CPT, // vamos criar Pagar no tenant
        CentroCusto: CCT, // centros de custo tenant
        Fornecedor: FNT, // fornecedor padrão (SaaS)
      } = models;

      // 1) Empresa do tenant
      let empresaTenant = null;
      if (EmpresaT) {
        const payloadEmpresa = {
          id: novaEmpresa.id, // tenta manter o mesmo id (se permitido)
          nome,
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

      // 3) Contrato do SaaS (ContratoCliente) – sem conflitar com "Contrato" de eventos
      let contratoClienteId = null;
      if (ContratoClienteT && empresaTenant) {
        const agora = new Date();
        const validade = new Date(agora);
        validade.setMonth(validade.getMonth() + 12);

        const valorPlano = numberOr(plano.valorMensal, plano.valor, 0);

        const contratoPayload = {
          ...(hasAttr(ContratoClienteT, "empresaId")
            ? { empresaId: empresaTenant.id }
            : {}),
          ...(hasAttr(ContratoClienteT, "plano") ? { plano: plano.nome } : {}),
          ...(hasAttr(ContratoClienteT, "valor") ? { valor: valorPlano } : {}),
          ...(hasAttr(ContratoClienteT, "dataInicio")
            ? { dataInicio: agora }
            : {}),
          ...(hasAttr(ContratoClienteT, "dataValidade")
            ? { dataValidade: validade }
            : {}),
          ...(hasAttr(ContratoClienteT, "renovacaoAutomatica")
            ? { renovacaoAutomatica: true }
            : {}),
          ...(hasAttr(ContratoClienteT, "status") ? { status: "ativo" } : {}),
          ...(hasAttr(ContratoClienteT, "metodoPagamento")
            ? { metodoPagamento: "pix" }
            : {}),
        };

        const cc = await ContratoClienteT.create(contratoPayload);
        contratoClienteId = cc.id;
      }

      // 4) Clonar Centros de Custo do admin (apenas os usados nas parcelas) + garantir "Planos e Assinaturas" (id 1)
      const publicParcelas = await ContaReceber.findAll({
        where: { empresaId: novaEmpresa.id },
        order: [["vencimento", "ASC"]],
        transaction: t,
      });

      const usados = new Set(
        publicParcelas.map((p) => p.centroCustoId).filter((v) => v != null)
      );
      usados.add(1); // garante 'Planos e Assinaturas' no tenant

      let centrosAdmin = [];
      if (CentroCustoAdmin) {
        centrosAdmin = await CentroCustoAdmin.findAll({
          where: { id: { [Op.in]: Array.from(usados) } },
          transaction: t,
        });
      }

      const centroMap = {};
      let defaultTenantCentroId = null;
      if (CCT) {
        for (const c of centrosAdmin) {
          const [row] = await CCT.findOrCreate({
            where: { descricao: c.descricao },
            defaults: {
              ...(hasAttr(CCT, "tipo") ? { tipo: c.tipo || "Ambos" } : {}),
              ...(hasAttr(CCT, "ativo") ? { ativo: true } : {}),
            },
          });
          centroMap[c.id] = row.id;
          if (
            String(c.id) === "1" ||
            c.descricao?.toLowerCase() === "planos e assinaturas"
          ) {
            defaultTenantCentroId = row.id;
          }
        }
        if (!defaultTenantCentroId) {
          const [row] = await CCT.findOrCreate({
            where: { descricao: "Planos e Assinaturas" },
            defaults: {
              ...(hasAttr(CCT, "tipo") ? { tipo: "Ambos" } : {}),
              ...(hasAttr(CCT, "ativo") ? { ativo: true } : {}),
            },
          });
          defaultTenantCentroId = row.id;
        }
      }

      // 5) Fornecedor padrão (SaaS) no tenant — para cumprir NOT NULL em ContaPagar.fornecedorId
      const fornecedorNome =
        process.env.SAAS_FORNECEDOR_NOME || "VisionFest (SaaS)";
      const fornecedorDoc =
        process.env.SAAS_FORNECEDOR_DOC || "00.000.000/0000-00";

      let fornecedorTenantId = null;
      if (FNT) {
        const where = hasAttr(FNT, "nome") ? { nome: fornecedorNome } : {}; // fallback
        const defaults = {};
        if (hasAttr(FNT, "nome")) defaults.nome = fornecedorNome;
        if (hasAttr(FNT, "cpfCnpj")) defaults.cpfCnpj = fornecedorDoc;
        if (hasAttr(FNT, "documento")) defaults.documento = fornecedorDoc;
        if (hasAttr(FNT, "ativo")) defaults.ativo = true;
        if (hasAttr(FNT, "email")) defaults.email = "financeiro@visionfest.com";
        if (hasAttr(FNT, "telefone")) defaults.telefone = whatsapp || null;

        const [forn] = await FNT.findOrCreate({ where, defaults });
        fornecedorTenantId = forn.id;
      }

      // 6) Criar CONTAS A PAGAR no tenant a partir das CONTAS A RECEBER do admin
      if (CPT && empresaTenant && publicParcelas.length) {
        const attrValorPagar = pickAttr(CPT, [
          "valor",
          "valorTotal",
          "valor_total",
          "valorBruto",
          "valorLiquido",
          "valor_liquido",
        ]);

        // detectar nome do campo FK do fornecedor
        const fkFornecedorAttr = pickAttr(CPT, [
          "fornecedorId",
          "idFornecedor",
          "fornecedor_id",
        ]);

        const linhas = publicParcelas.map((p) => {
          const r = {};

          if (hasAttr(CPT, "empresaId")) r.empresaId = empresaTenant.id;

          // Centro de custo
          const adminCC = p.centroCustoId ?? 1;
          const tenantCC = centroMap[adminCC] || defaultTenantCentroId || null;
          if (tenantCC && hasAttr(CPT, "centroCustoId"))
            r.centroCustoId = tenantCC;

          // Fornecedor obrigatório
          if (fkFornecedorAttr && fornecedorTenantId) {
            r[fkFornecedorAttr] = fornecedorTenantId;
          }

          // descrição, datas, numeração
          const desc = p.descricao || `Assinatura do plano ${plano.nome}`;
          if (hasAttr(CPT, "descricao")) r.descricao = desc;
          if (hasAttr(CPT, "vencimento"))
            r.vencimento = p.vencimento || new Date();

          const v = numberOr(
            p.valorTotal,
            p.valor,
            plano.valorMensal,
            plano.valor,
            0
          );
          if (attrValorPagar) r[attrValorPagar] = v;

          if (hasAttr(CPT, "status")) r.status = "aberto";

          // vínculo com contrato do SaaS (se a FK existir)
          if (contratoClienteId) {
            if (hasAttr(CPT, "contratoClienteId"))
              r.contratoClienteId = contratoClienteId;
            else if (hasAttr(CPT, "contratoId"))
              r.contratoId = contratoClienteId;
          }

          // completar NOT NULLs não-FK
          for (const [name, a] of Object.entries(CPT.rawAttributes || {})) {
            if (
              name === "id" ||
              r[name] !== undefined ||
              a.allowNull !== false ||
              a.defaultValue !== undefined ||
              a.references
            ) {
              continue;
            }
            const typeStr = String(a.type || "").toLowerCase();
            if (typeStr.includes("boolean")) r[name] = false;
            else if (
              typeStr.includes("integer") ||
              typeStr.includes("bigint") ||
              typeStr.includes("decimal") ||
              typeStr.includes("float") ||
              typeStr.includes("double") ||
              typeStr.includes("real") ||
              typeStr.includes("numeric")
            ) {
              r[name] = 0;
            } else if (typeStr.includes("date")) {
              r[name] = new Date();
            } else if (a.values?.length) {
              r[name] = a.values[0];
            } else {
              r[name] = "";
            }
          }

          return r;
        });

        if (linhas.length) {
          try {
            await CPT.bulkCreate(linhas, { validate: true });
          } catch (e) {
            console.warn(
              "[ContaPagar tenant] bulkCreate falhou. Inserindo item a item…"
            );
            for (let i = 0; i < linhas.length; i++) {
              try {
                await CPT.create(linhas[i]);
              } catch (e1) {
                console.warn(
                  `  • Falha na parcela #${i + 1}:`,
                  e1?.errors?.map((x) => x.message).join(" | ") || e1.message
                );
              }
            }
          }
        }
      }
    });
    /* ===================== /CLONE ===================== */

    await t.commit();
    // mantém retorno compatível com o modal de recebimento do front
    return res.status(201).json({
      mensagem:
        "Empresa criada com sucesso. É necessário efetuar o pagamento para ativar.",
      empresa: novaEmpresa,
      empresaId: novaEmpresa.id,
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

    if (
      (novoPlano.valorMensal ?? novoPlano.valor ?? 0) <
      (planoAtual.valorMensal ?? planoAtual.valor ?? 0)
    ) {
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
