const { getDbCliente } = require("../utils/tenant");

// helper p/ obter o DB do tenant de forma tolerante
async function getDbFromReq(req) {
  if (req.dbCliente) return req.dbCliente;
  if (req.tenantDb) return req.tenantDb;
  if (req.bancoCliente) return await getDbCliente(req.bancoCliente);
  throw new Error("tenant_db_nao_disponivel");
}

// busca modelo tanto em db.models quanto em db.ModelName
const getModel = (db, name) => db?.models?.[name] ?? db?.[name];

// ----- NOVO: checa se a coluna existe fisicamente na tabela -----
async function hasColumn(db, model, attrName) {
  if (!model || !db?.sequelize) return false;
  const sequelize = db.sequelize;

  // nome real da tabela
  const t = model.getTableName();
  const tableName = typeof t === "string" ? t : t?.tableName || model.name;

  // schema atual (já ajustado no multiTenant)
  const [[{ current_schemas }]] = await sequelize.query(
    `SELECT current_schemas(true)`
  );
  const schema =
    (Array.isArray(current_schemas) && current_schemas[0]) ||
    db?.schema ||
    undefined;

  // nome real da coluna (respeita field)
  const def = model.rawAttributes?.[attrName];
  const column = (def?.field || attrName).toString().toLowerCase();

  const [rows] = await sequelize.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = :table
      ${schema ? "AND table_schema = :schema" : ""}
  `,
    { replacements: { table: tableName.toLowerCase(), schema } }
  );

  return (rows || []).some(
    (r) => String(r.column_name || "").toLowerCase() === column
  );
}

module.exports = {
  async buscarPermissoes(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Permissao = getModel(db, "Permissao");
      const Usuario = getModel(db, "Usuario");

      if (!Permissao || !Usuario) {
        console.error("[permissoes] Model(s) não registrados no tenant.");
        return res
          .status(500)
          .json({ error: "Modelos de permissão/usuário não registrados." });
      }

      const usuarioId = Number(req.params.id);
      if (!Number.isFinite(usuarioId)) {
        return res.status(400).json({ error: "ID de usuário inválido." });
      }

      // checa se Usuario tem empresaId (p/ validar pertencimento)
      const usuarioTemEmpresaId = await hasColumn(db, Usuario, "empresaId");
      const whereUsuario = { id: usuarioId };
      if (usuarioTemEmpresaId && req.empresaId) {
        whereUsuario.empresaId = req.empresaId;
      }

      const usuario = await Usuario.findOne({
        where: whereUsuario,
        attributes: ["id"],
      });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      // checa se Permissao tem empresaId
      const permissaoTemEmpresaId = await hasColumn(db, Permissao, "empresaId");

      const wherePerm = { usuarioId };
      if (permissaoTemEmpresaId && req.empresaId) {
        wherePerm.empresaId = req.empresaId;
      }

      const permissoes = await Permissao.findAll({
        where: wherePerm,
      });

      const formatadas = {};
      for (const p of permissoes) {
        formatadas[p.modulo] = {
          visualizar: !!p.visualizar,
          criarEditar: !!p.criarEditar,
          excluir: !!p.excluir,
        };
      }

      return res.json({ permissoes: formatadas });
    } catch (err) {
      console.error("Erro ao buscar permissões:", err);
      return res.status(500).json({ error: "Erro ao buscar permissões." });
    }
  },

  async salvarPermissoes(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Permissao = getModel(db, "Permissao");
      const Usuario = getModel(db, "Usuario");
      const sequelize = db?.sequelize;

      if (!Permissao || !Usuario || !sequelize) {
        console.error("[permissoes] Model(s)/sequelize não registrados.");
        return res
          .status(500)
          .json({ error: "Recursos do tenant indisponíveis." });
      }

      const usuarioId = Number(req.params.id);
      if (!Number.isFinite(usuarioId)) {
        return res.status(400).json({ error: "ID de usuário inválido." });
      }

      const usuarioTemEmpresaId = await hasColumn(db, Usuario, "empresaId");
      const whereUsuario = { id: usuarioId };
      if (usuarioTemEmpresaId && req.empresaId) {
        whereUsuario.empresaId = req.empresaId;
      }

      const usuario = await Usuario.findOne({
        where: whereUsuario,
        attributes: ["id"],
      });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const { permissoes } = req.body || {};
      if (!permissoes || typeof permissoes !== "object") {
        return res
          .status(400)
          .json({ error: "Objeto de permissões inválido." });
      }

      const permissaoTemEmpresaId = await hasColumn(db, Permissao, "empresaId");

      const rows = Object.entries(permissoes).map(([modulo, p]) => {
        const base = {
          usuarioId,
          modulo,
          visualizar: !!p?.visualizar,
          criarEditar: !!p?.criarEditar,
          excluir: !!p?.excluir,
        };
        if (permissaoTemEmpresaId && req.empresaId) {
          base.empresaId = req.empresaId;
        }
        return base;
      });

      await sequelize.transaction(async (t) => {
        const whereDel = { usuarioId };
        if (permissaoTemEmpresaId && req.empresaId) {
          whereDel.empresaId = req.empresaId;
        }
        await Permissao.destroy({ where: whereDel, transaction: t });

        if (rows.length) {
          await Permissao.bulkCreate(rows, { transaction: t });
        }
      });

      return res.json({ message: "Permissões salvas com sucesso." });
    } catch (err) {
      console.error("Erro ao salvar permissões:", err);
      return res.status(500).json({ error: "Erro ao salvar permissões." });
    }
  },
};
