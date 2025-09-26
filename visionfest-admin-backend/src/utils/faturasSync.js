// src/utils/faturasSync.js
/**
 * Sincroniza/espelha faturas do SaaS no TENANT a partir de ContaReceber do ADMIN.
 * - syncTenantFaturaFromPublic: cria/atualiza uma fatura no tenant para uma ContaReceber específica
 * - seedTenantFaturasForEmpresa: espelha TODAS as parcelas (ContaReceber) de uma empresa para o tenant
 */

const adminModels = require("../models"); // precisa exportar Empresa, ContaReceber, sequelize, Sequelize
const { withTenantDb } = require("./dbUtils");

// Busca Empresa no schema public com fallback a query crua (caso adminModels.Empresa não esteja pronto)
async function getEmpresaAdminByIdSafe(id) {
  const Empresa = adminModels?.Empresa;
  if (Empresa?.findByPk) {
    return await Empresa.findByPk(id);
  }

  const sequelize = adminModels?.sequelize;
  const Sequelize = adminModels?.Sequelize;
  if (!sequelize || !Sequelize) return null;

  const [row] = await sequelize.query(
    'SELECT id, "bancoDados" FROM "Empresas" WHERE id = :id LIMIT 1',
    {
      replacements: { id },
      type: adminModels.Sequelize.QueryTypes.SELECT,
      raw: true,
    }
  );
  return row || null;
}

// Normaliza campos vindos do admin (ContaReceber) para o modelo do tenant (FaturaSaaS)
function mapPublicContaToTenantFields(publicConta = {}) {
  // competencia YYYY-MM
  let competencia = null;
  if (publicConta.vencimento) {
    const d = new Date(publicConta.vencimento);
    if (!Number.isNaN(d.getTime())) {
      competencia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    }
  }

  const valor = Number(publicConta.valorTotal ?? publicConta.valor ?? 0) || 0;

  const status = publicConta.status || "aberto";

  return {
    descricao: publicConta.descricao || "Assinatura do plano",
    competencia,
    vencimento: publicConta.vencimento || new Date(),
    valor,
    status,
    formaPagamento: null,
    dataPagamento: null,
    valorPago: null,
    referenciaPublicContaId: publicConta.id || null,
    observacoes: null,
  };
}

/**
 * Cria/atualiza a fatura no tenant para a ContaReceber informada.
 * @param {object} publicConta  - instancia/obj de ContaReceber (admin)
 * @param {object} patch        - sobrescritas (ex.: { status: 'pago', dataPagamento: ... })
 */
async function syncTenantFaturaFromPublic(publicConta, patch = {}) {
  if (!publicConta) return { ok: false, reason: "conta_public_null" };

  // empresa (admin) -> schema do tenant
  const empresaId =
    publicConta.empresaId ||
    publicConta.EmpresaId ||
    publicConta.get?.("empresaId");
  if (!empresaId) return { ok: false, reason: "empresaId_missing" };

  const empresa = await getEmpresaAdminByIdSafe(empresaId);
  const bancoDados = empresa?.bancoDados;
  if (!bancoDados) return { ok: false, reason: "tenant_schema_missing" };

  const baseFields = mapPublicContaToTenantFields(publicConta);
  const data = { ...baseFields, ...patch };

  // Se houver pagamento no admin, propaga forma/data/valorPago
  if (publicConta.status === "pago") {
    data.status = data.status || "pago";
    if (!data.dataPagamento)
      data.dataPagamento = publicConta.dataRecebimento || new Date();
    if (!data.valorPago) {
      data.valorPago =
        Number(
          publicConta.valorRecebido ||
            publicConta.valorTotal ||
            publicConta.valor ||
            0
        ) || 0;
    }
  }

  // Escreve no tenant
  await withTenantDb(bancoDados, async ({ models }) => {
    const FaturaSaaS = models?.FaturaSaaS;
    if (!FaturaSaaS) throw new Error("FaturaSaaS model not found in tenant DB");

    // garante empresaId no tenant se o campo existir
    if (FaturaSaaS.rawAttributes?.empresaId && empresa?.id) {
      data.empresaId = empresa.id;
    }

    const where = { referenciaPublicContaId: publicConta.id };
    const existing = await FaturaSaaS.findOne({ where });

    if (!existing) {
      await FaturaSaaS.create(data);
    } else {
      await existing.update(data);
    }
  });

  return { ok: true };
}

/**
 * Espelha TODAS as parcelas (ContaReceber) do admin no tenant da empresa informada.
 * @param {number|string} empresaId
 */
async function seedTenantFaturasForEmpresa(empresaId) {
  if (!empresaId)
    return { ok: false, total: 0, created: 0, reason: "empresaId_missing" };

  const empresa = await getEmpresaAdminByIdSafe(empresaId);
  if (!empresa?.bancoDados) {
    return { ok: false, total: 0, created: 0, reason: "tenant_schema_missing" };
  }

  const { ContaReceber } = adminModels;
  if (!ContaReceber?.findAll) {
    throw new Error("Admin model ContaReceber not available");
  }

  const contas = await ContaReceber.findAll({
    where: { empresaId },
    order: [["vencimento", "ASC"]],
  });

  let created = 0;

  await withTenantDb(empresa.bancoDados, async ({ models }) => {
    const FaturaSaaS = models?.FaturaSaaS;
    if (!FaturaSaaS) {
      console.warn(
        "[seedTenantFaturasForEmpresa] FaturaSaaS inexistente no tenant:",
        empresa.bancoDados
      );
      return;
    }

    for (const c of contas) {
      const exists = await FaturaSaaS.findOne({
        where: { referenciaPublicContaId: c.id },
      });
      if (exists) continue;

      const data = mapPublicContaToTenantFields(c);

      if (FaturaSaaS.rawAttributes?.empresaId && empresa?.id) {
        data.empresaId = empresa.id;
      }

      await FaturaSaaS.create(data);
      created++;
    }
  });

  return { ok: true, total: contas.length, created };
}

module.exports = {
  syncTenantFaturaFromPublic,
  seedTenantFaturasForEmpresa,
};
