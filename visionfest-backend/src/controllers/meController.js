// Retorna o "perfil" do usuário logado (admin ou usuário do tenant)
// Requer que authCliente já tenha validado o token e preenchido req.user, req.empresaId
const adminDb = require("../lib/adminDb");

module.exports = {
  async me(req, res) {
    try {
      // authCliente deve ter populado:
      // req.user: { id, tipo: 'admin' | 'usuario', email, nome, ... }
      // req.empresaId: id da empresa (no admin) que o token representa
      const u = req.user || {};
      const empresaId = req.empresaId || null;

      // carrega dados básicos da empresa (do admin) só para exibir nome/domínio, se quiser
      let empresa = null;
      if (empresaId && adminDb?.Empresa) {
        const e = await adminDb.Empresa.findByPk(empresaId, {
          attributes: ["id", "nome", "dominio", "status", "bancoDados"],
        });
        if (e) {
          empresa = {
            id: e.id,
            nome: e.nome,
            dominio: e.dominio,
            status: e.status,
            bancoDados: e.bancoDados,
          };
        }
      }

      // Formata o payload para o front
      const perfil = {
        id: u.id ?? null,
        tipo: u.tipo || (u.isAdmin ? "admin" : "usuario"),
        nome: u.nome || u.name || "",
        email: u.email || "",
        empresaId,
        // opcional: escopo/perfis
        roles: Array.isArray(u.roles) ? u.roles : [],
      };

      return res.json({ usuario: perfil, empresa });
    } catch (err) {
      console.error("[meController.me] erro:", err);
      return res.status(500).json({ error: "Falha ao carregar perfil." });
    }
  },
};
