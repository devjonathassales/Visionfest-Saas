const path = require("path");
const fs = require("fs/promises");
const adminDb = require("../lib/adminDb"); // { Empresa, Endereco, ... }

// ---------- helpers ----------
const nz = (v) => (v === "" ? null : v);

async function unlinkIfExists(file) {
  if (!file) return;
  const full = path.join(__dirname, "..", "uploads", file);
  try {
    await fs.unlink(full);
  } catch {}
}

function getModels(req) {
  // ⚠️ Qualifica os models no schema ATUAL do request (defensivo)
  const base =
    req.models || (req.tenantDb && (req.tenantDb.models || req.tenantDb)) || {};
  const schema = req.bancoCliente;
  const qualify = (mdl) =>
    mdl && typeof mdl.schema === "function" && schema
      ? mdl.schema(schema)
      : mdl;

  return {
    ...base,
    Empresa: qualify(base.Empresa) || base.Empresa,
    Endereco: qualify(base.Endereco) || base.Endereco,
    Sequelize: base.Sequelize,
  };
}

function normalizeEmpresaShape(row) {
  if (!row) return null;
  const e = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: e.id,
    adminEmpresaId: e.adminEmpresaId ?? null,
    nome: e.nome ?? "",
    documento: e.documento ?? e.cpfCnpj ?? "",
    cpfCnpj: e.cpfCnpj ?? e.documento ?? "",
    whatsapp: e.whatsapp ?? e.telefone ?? "",
    telefone: e.telefone ?? "",
    email: e.email ?? "",
    instagram: e.instagram ?? "",
    dominio: e.dominio ?? "",
    logo: e.logo ?? e.logoUrl ?? null,
    enderecos: Array.isArray(e.enderecos) ? e.enderecos : [],
  };
}

function getDominio(req) {
  const h = String(
    req?.headers?.["x-tenant"] || req?.headers?.["x-dominio"] || ""
  )
    .trim()
    .toLowerCase();
  if (h) return h;
  const q = String(req?.query?.dominio || req?.query?.tenant || "")
    .trim()
    .toLowerCase();
  if (q) return q;
  const b = String(req?.body?.dominio || req?.body?.tenant || "")
    .trim()
    .toLowerCase();
  if (b) return b;
  try {
    const u = new URL(req?.headers?.origin || req?.headers?.referer || "");
    const host = u.hostname;
    const parts = host.split(".");
    if (parts.length > 2) return parts[0].toLowerCase();
  } catch {}
  return "";
}

function isRelationMissing(err) {
  // Postgres 42P01 “relation does not exist” (pt-BR e en-US)
  return (
    err &&
    (err.code === "42P01" ||
      /relation .* does not exist/i.test(err.message || "") ||
      /relação .* não existe/i.test(err.message || ""))
  );
}

// --------- discovery helpers (evita selecionar colunas ausentes) ----------
async function getExistingColumnsForTable(sequelize, schema, table) {
  const [rows] = await sequelize.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = :schema
      AND table_name   = :table
  `,
    { replacements: { schema, table: String(table).toLowerCase() } }
  );
  return new Set(
    (rows || []).map((r) => String(r.column_name || "").toLowerCase())
  );
}

function getTableNameOnly(model) {
  const t = model.getTableName();
  if (typeof t === "string") return t;
  return t?.tableName || model.name;
}

/** Garante SEMPRE pelo menos ["id"]. */
async function buildSafeAttributes(model, schema, preferList = null) {
  const sequelize = model.sequelize;
  const table = getTableNameOnly(model);
  const existing = await getExistingColumnsForTable(sequelize, schema, table);

  const allAttrs = Object.entries(model.rawAttributes || {}).map(
    ([name, def]) => {
      const col = (def && def.field) || name;
      return { attr: name, col: String(col).toLowerCase() };
    }
  );

  const candidates = preferList
    ? preferList
        .filter((n) => allAttrs.find((a) => a.attr === n))
        .map((n) => allAttrs.find((a) => a.attr === n))
    : allAttrs;

  const safe = [];
  for (const a of candidates) {
    if (existing.has(a.col)) safe.push(a.attr);
  }

  if (!safe.includes("id") && existing.has("id")) safe.unshift("id");
  return safe.length ? safe : ["id"];
}

async function hasColumn(model, schema, attrName) {
  const sequelize = model.sequelize;
  const table = getTableNameOnly(model);
  const existing = await getExistingColumnsForTable(sequelize, schema, table);
  const def = model.rawAttributes?.[attrName];
  const col = (def && def.field) || attrName;
  return existing.has(String(col).toLowerCase());
}

// Remove do patch as chaves cujas colunas não existem na tabela
async function filterPatchByExisting(model, schema, patch) {
  const sequelize = model.sequelize;
  const table = getTableNameOnly(model);
  const existing = await getExistingColumnsForTable(sequelize, schema, table);

  const filtered = {};
  for (const [attrName, value] of Object.entries(patch)) {
    const def = model.rawAttributes?.[attrName];
    const col = def?.field || attrName;
    if (existing.has(String(col).toLowerCase())) filtered[attrName] = value;
  }
  return filtered;
}

// ================================================================
// Controller
// ================================================================
module.exports = {
  // ------------------- Importar do admin ------------------------
  async importarDoAdmin(req, res) {
    try {
      const { Empresa: EmpresaA, Endereco: EnderecoA } = adminDb;
      const {
        Empresa: EmpresaT,
        Endereco: EnderecoT,
        Sequelize,
      } = getModels(req);
      if (!EmpresaT)
        return res
          .status(500)
          .json({ error: "Model Empresa indisponível no tenant." });

      const empresaId = req.empresaId;
      if (!empresaId)
        return res.status(400).json({ error: "empresaId ausente." });

      const adminEmpresa = await EmpresaA.findByPk(empresaId, {
        include: EnderecoA ? [{ model: EnderecoA, as: "enderecos" }] : [],
      });
      if (!adminEmpresa)
        return res
          .status(404)
          .json({ error: "Empresa não encontrada no admin." });

      await EmpresaT.sequelize.transaction(async (t) => {
        const payloadEmpresa = {
          // NÃO define adminEmpresaId para evitar tenants sem a coluna
          nome: adminEmpresa.nome || "",
          documento:
            adminEmpresa.documento ||
            adminEmpresa.cpfCnpj ||
            adminEmpresa.cnpj ||
            "",
          whatsapp: adminEmpresa.whatsapp || "",
          telefone: adminEmpresa.telefone || "",
          email: adminEmpresa.email || "",
          instagram: adminEmpresa.instagram || "",
          dominio: adminEmpresa.dominio || "",
          logo: adminEmpresa.logo || null,
        };

        // Só seta cpfCnpj se a coluna existir (no model e na tabela)
        if (
          EmpresaT.rawAttributes?.cpfCnpj &&
          (await hasColumn(EmpresaT, req.bancoCliente, "cpfCnpj"))
        ) {
          payloadEmpresa.cpfCnpj =
            adminEmpresa.cpfCnpj ||
            adminEmpresa.documento ||
            adminEmpresa.cnpj ||
            "";
        }

        const safePayload = await filterPatchByExisting(
          EmpresaT,
          req.bancoCliente,
          payloadEmpresa
        );

        const [emp, created] = await EmpresaT.findOrCreate({
          where: { id: empresaId },
          defaults: safePayload,
          transaction: t,
        });
        if (!created) await emp.update(safePayload, { transaction: t });

        if (EnderecoT) {
          await EnderecoT.destroy({
            where: {
              empresaId: emp.id,
              ...(EnderecoT.rawAttributes?.adminEnderecoId
                ? { adminEnderecoId: { [Sequelize.Op.ne]: null } }
                : {}),
            },
            transaction: t,
          });

          const ends = (adminEmpresa.enderecos || []).map((e) => {
            const base = {
              empresaId: emp.id,
              logradouro: e.logradouro || e.endereco || "",
              numero: e.numero || "",
              bairro: e.bairro || "",
              cidade: e.cidade || "",
              estado: e.estado || e.uf || "",
              cep: e.cep || "",
              padrao: !!e.padrao,
            };
            if (EnderecoT.rawAttributes?.adminEnderecoId)
              base.adminEnderecoId = e.id;
            return base;
          });

          if (ends.length) await EnderecoT.bulkCreate(ends, { transaction: t });
        }
      });

      return res.json({ ok: true, mensagem: "Importado do admin." });
    } catch (err) {
      console.error("[empresaController.importarDoAdmin]", err);
      return res
        .status(500)
        .json({ error: "Erro ao importar empresa do admin." });
    }
  },

  // ------------------- GET /api/empresa -------------------------
  async getMinhaEmpresa(req, res) {
    try {
      const { Empresa, Endereco } = getModels(req);
      if (!Empresa)
        return res
          .status(500)
          .json({ error: "Model Empresa indisponível no tenant." });

      const include = Endereco ? [{ model: Endereco, as: "enderecos" }] : [];

      // atributos seguros (nunca undefined; mínimo ["id"])
      const attributes = await buildSafeAttributes(Empresa, req.bancoCliente, [
        "id",
        "adminEmpresaId",
        "nome",
        "documento",
        "cpfCnpj",
        "whatsapp",
        "telefone",
        "email",
        "instagram",
        "dominio",
        "logo",
        "createdAt",
        "updatedAt",
      ]);

      let id = req.empresaId;
      let debugHint = null;

      // fallback #1: se não veio empresaId, resolve pelo domínio no ADMIN
      if (!id) {
        const dominio = getDominio(req);
        if (dominio) {
          const adm = await adminDb.Empresa.findOne({ where: { dominio } });
          if (adm) {
            id = adm.id;
            debugHint = "fallback:empresaIdFromAdminByDominio";
          }
        }
      }

      let row = null;

      // tenta com include; se a relação não existir, refaz sem include
      try {
        row = id ? await Empresa.findByPk(id, { include, attributes }) : null;
      } catch (e) {
        if (isRelationMissing(e)) {
          debugHint =
            (debugHint ? debugHint + "|" : "") + "retryWithoutEnderecos";
          row = id ? await Empresa.findByPk(id, { attributes }) : null;
        } else {
          throw e;
        }
      }

      // fallback #2: procura por adminEmpresaId — só se a coluna existir
      if (
        !row &&
        id &&
        (await hasColumn(Empresa, req.bancoCliente, "adminEmpresaId"))
      ) {
        try {
          row = await Empresa.findOne({
            where: { adminEmpresaId: id },
            include,
            attributes,
          });
          if (row)
            debugHint =
              (debugHint ? debugHint + "|" : "") + "foundByAdminEmpresaId";
        } catch {
          // ignora
        }
      }

      // fallback #3: procura por dominio (no tenant) — só se a coluna existir
      if (!row && (await hasColumn(Empresa, req.bancoCliente, "dominio"))) {
        const dominio = getDominio(req);
        if (dominio) {
          try {
            row = await Empresa.findOne({
              where: { dominio },
              include,
              attributes,
            });
          } catch (e) {
            if (isRelationMissing(e)) {
              row = await Empresa.findOne({ where: { dominio }, attributes });
              debugHint =
                (debugHint ? debugHint + "|" : "") + "retryWithoutEnderecos";
            } else {
              throw e;
            }
          }
          if (row)
            debugHint =
              (debugHint ? debugHint + "|" : "") + "foundByDominioInTenant";
        }
      }

      if (!row) {
        return res.json({
          ...normalizeEmpresaShape({
            id: id || null,
            adminEmpresaId: id || null,
            nome: "",
            documento: "",
            cpfCnpj: "",
            whatsapp: "",
            telefone: "",
            email: "",
            instagram: "",
            dominio: getDominio(req) || "",
            logo: null,
            enderecos: [],
          }),
          _debug: debugHint || "not-found",
        });
      }

      const payload = normalizeEmpresaShape(row);
      if (debugHint) payload._debug = debugHint;
      res.json(payload);
    } catch (err) {
      console.error("[empresaController.getMinhaEmpresa]", err);
      res.status(500).json({ error: "Erro ao carregar empresa." });
    }
  },

  // ------------- PUT /api/empresa (TENANT -> ADMIN) --------------
  async atualizarMinhaEmpresa(req, res) {
    try {
      const { Empresa } = getModels(req);
      if (!Empresa)
        return res
          .status(500)
          .json({ error: "Model Empresa indisponível no tenant." });

      const EmpresaA = adminDb?.Empresa;
      const id = req.empresaId;

      const attrs = await buildSafeAttributes(Empresa, req.bancoCliente, [
        "id",
        "nome",
        "documento",
        "cpfCnpj",
        "whatsapp",
        "telefone",
        "email",
        "instagram",
        "dominio",
        "logo",
        "adminEmpresaId",
        "createdAt",
        "updatedAt",
      ]);
      const empresa = await Empresa.findByPk(id, { attributes: attrs });
      if (!empresa)
        return res
          .status(404)
          .json({ error: "Empresa não encontrada no tenant." });

      const oldLogo = empresa.logo;
      const newLogo = req.file ? req.file.filename : oldLogo;
      const doc = nz(req.body?.documento) ?? nz(req.body?.cpfCnpj);

      const patchWide = {
        nome: nz(req.body?.nome),
        documento: doc,
        whatsapp: nz(req.body?.whatsapp),
        telefone: nz(req.body?.telefone),
        email: nz(req.body?.email),
        instagram: nz(req.body?.instagram),
        dominio: nz(req.body?.dominio),
        logo: newLogo,
      };
      if (await hasColumn(Empresa, req.bancoCliente, "cpfCnpj")) {
        patchWide.cpfCnpj = doc;
      }

      const patch = await filterPatchByExisting(
        Empresa,
        req.bancoCliente,
        patchWide
      );

      await empresa.update(patch);
      if (req.file && oldLogo && oldLogo !== newLogo)
        await unlinkIfExists(oldLogo);

      // espelha no admin
      if (EmpresaA) {
        const adminId =
          (await hasColumn(Empresa, req.bancoCliente, "adminEmpresaId")) &&
          empresa.adminEmpresaId
            ? empresa.adminEmpresaId
            : id;

        await EmpresaA.update(
          {
            nome: patch.nome,
            documento: patch.documento ?? null,
            cpfCnpj: patch.cpfCnpj ?? null,
            whatsapp: patch.whatsapp,
            telefone: patch.telefone,
            email: patch.email,
            instagram: patch.instagram,
            dominio: patch.dominio,
            logo: patch.logo,
          },
          { where: { id: adminId } }
        );
      }

      const refreshed = await Empresa.findByPk(id, { attributes: attrs });
      res.json(normalizeEmpresaShape(refreshed));
    } catch (err) {
      console.error("[empresaController.atualizarMinhaEmpresa]", err);
      res.status(500).json({ error: "Erro ao atualizar empresa." });
    }
  },

  // ------------------- Endereços -------------------------------
  async criarEndereco(req, res) {
    try {
      const { Empresa, Endereco } = getModels(req);
      if (!Empresa || !Endereco)
        return res
          .status(500)
          .json({ error: "Models Empresa/Endereco indisponíveis no tenant." });

      const EnderecoA = adminDb?.Endereco;
      const empresaId = req.empresaId;
      const emp = await Empresa.findByPk(empresaId);
      if (!emp)
        return res
          .status(404)
          .json({ error: "Empresa não encontrada no tenant." });

      const dados = {
        empresaId,
        logradouro: nz(req.body.logradouro) ?? nz(req.body.endereco),
        numero: nz(req.body.numero),
        bairro: nz(req.body.bairro),
        cidade: nz(req.body?.cidade),
        estado: nz(req.body.estado) ?? nz(req.body.uf),
        cep: nz(req.body.cep),
        padrao: !!req.body.padrao,
      };

      const created = await Endereco.create(dados);

      if (EnderecoA) {
        const adminEmpresaId =
          (await hasColumn(Empresa, req.bancoCliente, "adminEmpresaId")) &&
          emp.adminEmpresaId
            ? emp.adminEmpresaId
            : empresaId;

        const criadoAdmin = await EnderecoA.create({
          empresaId: adminEmpresaId,
          logradouro: dados.logradouro,
          numero: dados.numero,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
          padrao: dados.padrao,
        });
        if (
          Endereco.rawAttributes?.adminEnderecoId &&
          (await hasColumn(Endereco, req.bancoCliente, "adminEnderecoId"))
        ) {
          await created.update({ adminEnderecoId: criadoAdmin.id });
        }
      }

      res.status(201).json(created);
    } catch (err) {
      console.error("[empresaController.criarEndereco]", err);
      res.status(500).json({ error: "Erro ao criar endereço." });
    }
  },

  async atualizarEndereco(req, res) {
    try {
      const { Endereco, Sequelize } = getModels(req);
      if (!Endereco)
        return res
          .status(500)
          .json({ error: "Model Endereco indisponível no tenant." });

      const EnderecoA = adminDb?.Endereco;
      const empresaId = req.empresaId;
      const { id } = req.params;

      const end = await Endereco.findOne({ where: { id, empresaId } });
      if (!end)
        return res.status(404).json({ error: "Endereço não encontrado." });

      const patch = {
        logradouro: nz(req.body.logradouro) ?? nz(req.body.endereco),
        numero: nz(req.body.numero),
        bairro: nz(req.body.bairro),
        cidade: nz(req.body.cidade),
        estado: nz(req.body.estado) ?? nz(req.body.uf),
        cep: nz(req.body.cep),
        padrao: req.body.padrao !== undefined ? !!req.body.padrao : end.padrao,
      };

      if (patch.padrao === true) {
        await Endereco.update(
          { padrao: false },
          { where: { empresaId, id: { [Sequelize.Op.ne]: id } } }
        );
      }

      await end.update(patch);
      if (
        EnderecoA &&
        end.adminEnderecoId &&
        (await hasColumn(Endereco, req.bancoCliente, "adminEnderecoId"))
      ) {
        await EnderecoA.update(patch, { where: { id: end.adminEnderecoId } });
      }

      res.json(end);
    } catch (err) {
      console.error("[empresaController.atualizarEndereco]", err);
      res.status(500).json({ error: "Erro ao atualizar endereço." });
    }
  },

  async excluirEndereco(req, res) {
    try {
      const { Endereco } = getModels(req);
      if (!Endereco)
        return res
          .status(500)
          .json({ error: "Model Endereco indisponível no tenant." });

      const EnderecoA = adminDb?.Endereco;
      const empresaId = req.empresaId;
      const { id } = req.params;

      const end = await Endereco.findOne({ where: { id, empresaId } });
      if (!end)
        return res.status(404).json({ error: "Endereço não encontrado." });

      if (
        EnderecoA &&
        end.adminEnderecoId &&
        (await hasColumn(Endereco, req.bancoCliente, "adminEnderecoId"))
      ) {
        await EnderecoA.destroy({ where: { id: end.adminEnderecoId } });
      }
      await end.destroy();
      res.json({ message: "Endereço excluído." });
    } catch (err) {
      console.error("[empresaController.excluirEndereco]", err);
      res.status(500).json({ error: "Erro ao excluir endereço." });
    }
  },

  // Placeholder do botão
  async syncFinanceiro(_req, res) {
    try {
      return res.json({
        ok: true,
        mensagem: "Sincronização financeira disparada.",
      });
    } catch (e) {
      console.error("[empresaController.syncFinanceiro]", e);
      return res.status(500).json({ error: "Erro ao sincronizar financeiro." });
    }
  },
};

// Aliases p/ compatibilidade
module.exports.getEmpresa = module.exports.getMinhaEmpresa;
module.exports.atualizarEmpresa = module.exports.atualizarMinhaEmpresa;
module.exports.reimportarDoAdmin = module.exports.importarDoAdmin;
module.exports.importarFinanceiro = module.exports.syncFinanceiro;
