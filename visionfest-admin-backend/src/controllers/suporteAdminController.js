// src/controllers/suporteAdminController.js
const { Op } = require("sequelize");
const { SuporteChamado } = require("../models"); // modelo no schema admin

/**
 * GET /api/admin/suporte/chamados?status=&empresaId=&q=
 * Lista chamados com filtros opcionais.
 */
exports.listarChamados = async (req, res) => {
  try {
    const { status, empresaId, q } = req.query || {};

    const where = {};
    if (status) where.status = status; // "aberto" | "em_andamento" | "resolvido"
    if (empresaId) where.empresaId = Number(empresaId) || 0;
    if (q) {
      where[Op.or] = [
        { assunto: { [Op.iLike]: `%${q}%` } },
        { mensagem: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const itens = await SuporteChamado.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(itens);
  } catch (error) {
    console.error("❌ [suporteAdmin] listarChamados:", error);
    res.status(500).json({ mensagem: "Erro ao listar chamados." });
  }
};

/**
 * GET /api/admin/suporte/chamados/:id
 * Busca um chamado específico.
 */
exports.buscarChamado = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const chamado = await SuporteChamado.findByPk(id);
    if (!chamado)
      return res.status(404).json({ mensagem: "Chamado não encontrado." });
    res.json(chamado);
  } catch (error) {
    console.error("❌ [suporteAdmin] buscarChamado:", error);
    res.status(500).json({ mensagem: "Erro ao buscar chamado." });
  }
};

/**
 * PATCH /api/admin/suporte/chamados/:id/status
 * Body: { status: "aberto" | "em_andamento" | "resolvido" }
 */
exports.atualizarStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    const validos = ["aberto", "em_andamento", "resolvido"];
    if (!validos.includes(status)) {
      return res.status(400).json({ mensagem: "Status inválido." });
    }

    const chamado = await SuporteChamado.findByPk(id);
    if (!chamado)
      return res.status(404).json({ mensagem: "Chamado não encontrado." });

    chamado.status = status;
    await chamado.save();

    res.json({ mensagem: "Status atualizado com sucesso.", chamado });
  } catch (error) {
    console.error("❌ [suporteAdmin] atualizarStatus:", error);
    res.status(500).json({ mensagem: "Erro ao atualizar status do chamado." });
  }
};
