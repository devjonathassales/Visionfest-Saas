const { getDbCliente } = require("../utils/tenant");

// helper p/ obter o DB do tenant de forma tolerante
async function getDbFromReq(req) {
  // preferimos o que o authCliente colocou:
  if (req.dbCliente) return req.dbCliente;
  if (req.tenantDb) return req.tenantDb;

  // fallback (ex.: header X-Banco-Cliente já preenchido pelo front)
  if (req.bancoCliente) return await getDbCliente(req.bancoCliente);

  throw new Error("tenant_db_nao_disponivel");
}

// busca modelo tanto em db.models quanto em db.ModelName
const getModel = (db, name) => db?.models?.[name] ?? db?.[name];

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

      // garante que o usuário pertence ao tenant
      const usuario = await Usuario.findOne({
        where: { id: usuarioId, empresaId: req.empresaId },
        attributes: ["id"],
      });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const permissoes = await Permissao.findAll({
        where: { usuarioId, empresaId: req.empresaId },
      });

      const formatadas = {};
      for (const p of permissoes) {
        // p.modulo -> { visualizar, criarEditar, excluir }
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

      const usuario = await Usuario.findOne({
        where: { id: usuarioId, empresaId: req.empresaId },
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

      const rows = Object.entries(permissoes).map(([modulo, p]) => ({
        usuarioId,
        empresaId: req.empresaId,
        modulo,
        visualizar: !!p?.visualizar,
        criarEditar: !!p?.criarEditar,
        excluir: !!p?.excluir,
      }));

      await sequelize.transaction(async (t) => {
        await Permissao.destroy({
          where: { usuarioId, empresaId: req.empresaId },
          transaction: t,
        });
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
