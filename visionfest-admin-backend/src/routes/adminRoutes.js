const express = require("express");
const Empresa = require("../models/Empresa");
const authMiddleware = require("../middlewares/authMiddleware"); // ajuste o caminho conforme sua estrutura
const router = express.Router();

// Todas as rotas abaixo são protegidas por autenticação
router.use(authMiddleware);

// Listar empresas
router.get("/empresas", async (req, res) => {
  try {
    const empresas = await Empresa.findAll();
    res.json(empresas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar empresas" });
  }
});

// Criar nova empresa
router.post("/empresas", async (req, res) => {
  try {
    const { nomeFantasia, dominio } = req.body;

    const bancoDados = `visionfest_${dominio.replace(/\W/g, "").toLowerCase()}`;

    const empresa = await Empresa.create({
      nomeFantasia,
      dominio,
      bancoDados,
    });

    // TODO: Criar o banco de dados separado para o cliente aqui

    res.status(201).json(empresa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar empresa" });
  }
});

// Bloquear/Desbloquear empresa
router.patch("/empresas/:id/bloquear", async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa)
      return res.status(404).json({ error: "Empresa não encontrada" });

    empresa.status = empresa.status === "ativo" ? "bloqueado" : "ativo";
    await empresa.save();

    res.json(empresa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao alterar status da empresa" });
  }
});

module.exports = router;
