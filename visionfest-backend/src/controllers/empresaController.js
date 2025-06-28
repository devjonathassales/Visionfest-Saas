const { Empresa, Endereco } = require("../models");
const path = require("path");
const fs = require("fs");

module.exports = {
  async listarTodas(req, res) {
    try {
      const empresas = await Empresa.findAll({
        include: [{ model: Endereco, as: "enderecos" }],
      });
      return res.json(empresas);
    } catch (error) {
      console.error("Erro ao listar empresas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  async buscar(req, res) {
    try {
      const { id } = req.params;

      if (id) {
        const empresa = await Empresa.findByPk(id, {
          include: [{ model: Endereco, as: "enderecos" }],
        });

        if (!empresa) {
          return res.status(404).json({ error: "Empresa não encontrada" });
        }

        return res.json(empresa);
      } else {
        const empresa = await Empresa.findOne({
          include: [{ model: Endereco, as: "enderecos" }],
        });

        if (!empresa) {
          return res.json({
            id: null,
            nome: "",
            documento: "",
            whatsapp: "",
            telefone: "",
            email: "",
            instagram: "",
            logo: null,
            enderecos: [],
          });
        }

        return res.json(empresa);
      }
    } catch (error) {
      console.error("Erro buscar empresa:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  async criarOuAtualizar(req, res) {
    try {
      let {
        nome,
        documento,
        whatsapp,
        telefone,
        email,
        instagram,
        enderecos,
      } = req.body;

      if (typeof enderecos === "string") {
        enderecos = JSON.parse(enderecos);
      }

      let logo = null;
      if (req.file) {
        logo = req.file.filename;
      }

      if (!req.params.id) {
        // Criar nova empresa
        const empresa = await Empresa.create({
          nome,
          documento,
          whatsapp,
          telefone,
          email,
          instagram,
          logo,
        });

        if (enderecos && Array.isArray(enderecos)) {
          for (const end of enderecos) {
            await Endereco.create({ ...end, empresaId: empresa.id });
          }
        }

        const empresaAtualizada = await Empresa.findByPk(empresa.id, {
          include: [{ model: Endereco, as: "enderecos" }],
        });

        return res.json(empresaAtualizada);
      } else {
        // Atualizar empresa existente
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
          return res.status(404).json({ error: "Empresa não encontrada" });
        }

        // Deletar logo anterior se nova for enviada
        if (logo && empresa.logo) {
          const caminhoLogo = path.join(__dirname, "../uploads/", empresa.logo);
          if (fs.existsSync(caminhoLogo)) fs.unlinkSync(caminhoLogo);
        }

        await empresa.update({
          nome,
          documento,
          whatsapp,
          telefone,
          email,
          instagram,
          logo: logo || empresa.logo,
        });

        await Endereco.destroy({ where: { empresaId: empresa.id } });

        if (enderecos && Array.isArray(enderecos)) {
          for (const end of enderecos) {
            await Endereco.create({ ...end, empresaId: empresa.id });
          }
        }

        const empresaAtualizada = await Empresa.findByPk(empresa.id, {
          include: [{ model: Endereco, as: "enderecos" }],
        });

        return res.json(empresaAtualizada);
      }
    } catch (error) {
      console.error("Erro criar/atualizar empresa:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  },

  async deletar(req, res) {
  try {
    const empresa = await Empresa.findByPk(req.params.id);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Apagar logo física se existir
    if (empresa.logo) {
      const caminhoLogo = path.join(__dirname, "../uploads/", empresa.logo);
      if (fs.existsSync(caminhoLogo)) fs.unlinkSync(caminhoLogo);
    }

    // Apagar endereços relacionados
    await Endereco.destroy({ where: { empresaId: empresa.id } });

    // Apagar empresa
    await empresa.destroy();

    res.json({ message: "Empresa excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir empresa:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
};