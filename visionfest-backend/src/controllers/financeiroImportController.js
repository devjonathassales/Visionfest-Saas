// src/controllers/financeiroImportController.js
const { getDbAdmin } = require("../lib/adminDb"); // o mesmo lugar onde você corrigiu getDbAdmin
// helper
const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];

async function mapClienteAdminToTenant(
  modelsT,
  modelsA,
  adminClienteId,
  empresaId
) {
  if (!adminClienteId || !modelsT?.Cliente) return null;

  const ClienteT = modelsT.Cliente;
  // 1) se tenant tem coluna adminClienteId, use-a
  if (hasAttr(ClienteT, "adminClienteId")) {
    const c = await ClienteT.findOne({
      where: {
        adminClienteId,
        ...(hasAttr(ClienteT, "empresaId") ? { empresaId } : {}),
      },
    });
    if (c) return c.id;
  }

  // 2) fallback: tenta casar por documento/email se ambos os lados tiverem
  try {
    const ClienteA = modelsA.Cliente;
    if (!ClienteA) return null;
    const ca = await ClienteA.findByPk(adminClienteId);
    if (!ca) return null;

    const where = {};
    if (hasAttr(ClienteT, "documento") && ca.documento)
      where.documento = ca.documento;
    else if (hasAttr(ClienteT, "email") && ca.email) where.email = ca.email;
    else return null;

    if (hasAttr(ClienteT, "empresaId")) where.empresaId = empresaId;

    const c2 = await ClienteT.findOne({ where });
    return c2 ? c2.id : null;
  } catch {
    return null;
  }
}

function buildPayloadFromOverlap(modelT, plainAdminRow) {
  const payload = {};
  for (const col of Object.keys(modelT.rawAttributes || {})) {
    if (["id", "createdAt", "updatedAt"].includes(col)) continue;
    if (plainAdminRow[col] !== undefined) {
      payload[col] = plainAdminRow[col];
    }
  }
  return payload;
}

async function importReceber({ modelsT, modelsA, empresaId }) {
  const ReceberA =
    modelsA.ContasReceber || modelsA.Receber || modelsA.TituloReceber;
  const ReceberT =
    modelsT.ContasReceber || modelsT.Receber || modelsT.TituloReceber;
  if (!ReceberA || !ReceberT) return { imported: 0, updated: 0, skipped: 0 };

  // Puxa todos os títulos do ADMIN dessa empresa
  const whereAdmin = {};
  if (hasAttr(ReceberA, "empresaId")) whereAdmin.empresaId = empresaId;
  const lista = await ReceberA.findAll({ where: whereAdmin });

  let imported = 0,
    updated = 0,
    skipped = 0;

  for (const r of lista) {
    const plain = r.get({ plain: true });

    // mapeia clienteId
    let clienteId = plain.clienteId || null;
    if (clienteId && hasAttr(ReceberT, "clienteId")) {
      const mapped = await mapClienteAdminToTenant(
        modelsT,
        modelsA,
        clienteId,
        empresaId
      );
      if (mapped) clienteId = mapped;
    }

    // monta payload com interseção de colunas
    const payload = buildPayloadFromOverlap(ReceberT, plain);
    if (hasAttr(ReceberT, "empresaId")) payload.empresaId = empresaId;
    if (hasAttr(ReceberT, "clienteId"))
      payload.clienteId = clienteId || payload.clienteId || null;
    if (hasAttr(ReceberT, "adminReceberId")) payload.adminReceberId = r.id;

    // idempotência: tenta localizar por adminReceberId
    let existente = null;
    if (hasAttr(ReceberT, "adminReceberId")) {
      const whereT = { adminReceberId: r.id };
      if (hasAttr(ReceberT, "empresaId")) whereT.empresaId = empresaId;
      existente = await ReceberT.findOne({ where: whereT });
    }

    if (existente) {
      await existente.update(payload);
      updated++;
    } else {
      await ReceberT.create(payload);
      imported++;
    }
  }

  return { imported, updated, skipped };
}

async function importFaturas({ modelsT, modelsA, empresaId }) {
  const FaturaA = modelsA.Fatura || modelsA.Faturas;
  const FaturaItemA = modelsA.FaturaItem || modelsA.FaturaItens;
  const FaturaT = modelsT.Fatura || modelsT.Faturas;
  const FaturaItemT = modelsT.FaturaItem || modelsT.FaturaItens;

  if (!FaturaA || !FaturaT) return { imported: 0, updated: 0, items: 0 };

  const whereAdmin = {};
  if (hasAttr(FaturaA, "empresaId")) whereAdmin.empresaId = empresaId;

  const faturas = await FaturaA.findAll({ where: whereAdmin });
  let imported = 0,
    updated = 0,
    items = 0;

  for (const f of faturas) {
    const plain = f.get({ plain: true });

    const payload = buildPayloadFromOverlap(FaturaT, plain);
    if (hasAttr(FaturaT, "empresaId")) payload.empresaId = empresaId;
    if (hasAttr(FaturaT, "adminFaturaId")) payload.adminFaturaId = f.id;

    // mapeia clienteId se existir
    if (hasAttr(FaturaT, "clienteId") && plain.clienteId) {
      const mapped = await mapClienteAdminToTenant(
        modelsT,
        modelsA,
        plain.clienteId,
        empresaId
      );
      if (mapped) payload.clienteId = mapped;
    }

    // idempotência pela adminFaturaId
    let ft = null;
    if (hasAttr(FaturaT, "adminFaturaId")) {
      const whereT = { adminFaturaId: f.id };
      if (hasAttr(FaturaT, "empresaId")) whereT.empresaId = empresaId;
      ft = await FaturaT.findOne({ where: whereT });
    }

    if (ft) {
      await ft.update(payload);
      updated++;
    } else {
      ft = await FaturaT.create(payload);
      imported++;
    }

    // itens (se ambos tiverem)
    if (FaturaItemA && FaturaItemT) {
      // apaga e reespelha
      if (hasAttr(FaturaItemT, "faturaId")) {
        await FaturaItemT.destroy({ where: { faturaId: ft.id } });
      }

      if (FaturaItemA && hasAttr(FaturaItemA, "faturaId")) {
        const itens = await FaturaItemA.findAll({ where: { faturaId: f.id } });
        const toCreate = [];
        for (const it of itens) {
          const ip = it.get({ plain: true });
          const p2 = buildPayloadFromOverlap(FaturaItemT, ip);
          if (hasAttr(FaturaItemT, "faturaId")) p2.faturaId = ft.id;
          if (hasAttr(FaturaItemT, "empresaId")) p2.empresaId = empresaId;
          if (hasAttr(FaturaItemT, "adminFaturaItemId"))
            p2.adminFaturaItemId = it.id;
          toCreate.push(p2);
        }
        if (toCreate.length) {
          await FaturaItemT.bulkCreate(toCreate);
          items += toCreate.length;
        }
      }
    }
  }

  return { imported, updated, items };
}

module.exports = {
  async importarFinanceiroDoAdmin(req, res) {
    try {
      const dbA = await getDbAdmin();
      const modelsA = dbA.models;

      const { models: modelsT, empresaId } = req;
      if (!modelsT || !empresaId) {
        return res.status(400).json({ error: "Contexto do tenant inválido." });
      }

      const [r1, r2] = await Promise.all([
        importReceber({ modelsT, modelsA, empresaId }),
        importFaturas({ modelsT, modelsA, empresaId }),
      ]);

      return res.json({
        ok: true,
        contasReceber: r1,
        faturas: r2,
        message: "Financeiro espelhado do Admin para o Tenant.",
      });
    } catch (e) {
      console.error("[financeiroImport] importarFinanceiroDoAdmin:", e);
      return res
        .status(500)
        .json({ error: "Erro ao importar financeiro do admin." });
    }
  },
};
