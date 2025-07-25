const { Empresa, Endereco, sequelize } = require("../models");
const path = require("path");
const fs = require("fs/promises");

module.exports = {
  async listarTodas(req, res) {
    try {
      const empresas = await Empresa.findAll({
        include: [{ model: Endereco, as: "enderecos" }],
      });
      res.json(empresas);
    } catch (error) {
      console.error("Erro ao listar empresas:", error);
      res.status(500).json({ error: "Erro ao listar empresas." });
    }
  },

  async buscar(req, res) {
    const { id } = req.params;
    try {
      const empresa = id
        ? await Empresa.findByPk(id, { include: ["enderecos"] })
        : await Empresa.findOne({ include: ["enderecos"] });

      if (!empresa && id)
        return res.status(404).json({ error: "Empresa não encontrada." });

      res.json(
        empresa || {
          id: null,
          nome: "",
          documento: "",
          whatsapp: "",
          telefone: "",
          email: "",
          instagram: "",
          logo: null,
          enderecos: [],
        }
      );
    } catch (error) {
      console.error("Erro buscar empresa:", error);
      res.status(500).json({ error: "Erro ao buscar empresa." });
    }
  },

  async criarOuAtualizar(req, res) {
    const t = await sequelize.transaction();
    try {
      let { nome, documento, whatsapp, telefone, email, instagram, enderecos } =
        req.body;
      if (typeof enderecos === "string") enderecos = JSON.parse(enderecos);
      const logo = req.file ? req.file.filename : null;

      let empresa;
      if (!req.params.id) {
        empresa = await Empresa.create(
          { nome, documento, whatsapp, telefone, email, instagram, logo },
          { transaction: t }
        );
        for (const end of enderecos) {
          await Endereco.create(
            { ...end, empresaId: empresa.id },
            { transaction: t }
          );
        }
      } else {
        empresa = await Empresa.findByPk(req.params.id, { transaction: t });
        if (!empresa) {
          await t.rollback();
          return res.status(404).json({ error: "Empresa não encontrada." });
        }
        if (logo && empresa.logo) {
          const caminhoLogo = path.join(__dirname, "../uploads", empresa.logo);
          try {
            await fs.unlink(caminhoLogo);
          } catch {}
        }
        await empresa.update(
          {
            nome,
            documento,
            whatsapp,
            telefone,
            email,
            instagram,
            logo: logo || empresa.logo,
          },
          { transaction: t }
        );
        await Endereco.destroy({
          where: { empresaId: empresa.id },
          transaction: t,
        });
        for (const end of enderecos) {
          await Endereco.create(
            { ...end, empresaId: empresa.id },
            { transaction: t }
          );
        }
      }

      await t.commit();
      const empresaAtualizada = await Empresa.findByPk(empresa.id, {
        include: ["enderecos"],
      });
      res.json(empresaAtualizada);
    } catch (error) {
      await t.rollback();
      console.error("Erro criar/atualizar empresa:", error);
      res.status(500).json({ error: "Erro ao salvar empresa." });
    }
  },

  async deletar(req, res) {
    try {
      const empresa = await Empresa.findByPk(req.params.id);
      if (!empresa)
        return res.status(404).json({ error: "Empresa não encontrada." });

      if (empresa.logo) {
        const caminhoLogo = path.join(__dirname, "../uploads", empresa.logo);
        try {
          await fs.unlink(caminhoLogo);
        } catch {}
      }

      await Endereco.destroy({ where: { empresaId: empresa.id } });
      await empresa.destroy();

      res.json({ message: "Empresa excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      res.status(500).json({ error: "Erro ao excluir empresa." });
    }
  },
};
