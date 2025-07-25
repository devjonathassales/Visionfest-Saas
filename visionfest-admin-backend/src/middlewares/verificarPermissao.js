const { AdminUser, Permissao } = require("../models");

/**
 * Middleware para verificar se o usuário autenticado tem a permissão necessária.
 * 
 * @param {string} chavePermissao - A chave de permissão a ser verificada (ex: "visualizarEmpresas").
 */
module.exports = (chavePermissao) => {
  return async (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ mensagem: "Usuário não autenticado." });
    }

    // Superadmin tem acesso irrestrito
    if (user.role === "superadmin") {
      return next();
    }

    try {
      // Se o objeto user já tem as permissões carregadas (ex: no login), usa elas
      let permissoes = user.permissoes;

      if (!permissoes || !permissoes.length) {
        // Busca permissões do banco associadas ao usuário
        const usuarioDb = await AdminUser.findByPk(user.id, {
          include: {
            model: Permissao,
            attributes: ["chave"],
            through: { attributes: [] }, // ignora dados da tabela pivô
          },
        });

        if (!usuarioDb) {
          return res.status(401).json({ mensagem: "Usuário não encontrado." });
        }

        // Monta array de chaves
        permissoes = usuarioDb.Permissaos.map((p) => p.chave); // cuidado com nome do relacionamento
      } else {
        // se vier como objeto no token transforma em array
        permissoes = Object.keys(permissoes).filter((k) => permissoes[k]);
      }

      if (permissoes.includes(chavePermissao)) {
        return next();
      }

      return res.status(403).json({ mensagem: "Acesso negado. Permissão insuficiente." });
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return res.status(500).json({ mensagem: "Erro ao verificar permissões." });
    }
  };
};
