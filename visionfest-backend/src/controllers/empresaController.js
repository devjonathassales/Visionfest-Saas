// src/controllers/empresaController.js
const path = require("path");
const fs = require("fs/promises");
const { getDbCliente, getDbAdmin } = require("../utils/tenant");

// helper: normaliza string vazia -> null
const nz = (v) => (v === "" ? null : v);

async function unlinkIfExists(file) {
  if (!file) return;
  const full = path.join(__dirname, "..", "uploads", file);
  try { await fs.unlink(full); } catch (_) {}
}

module.exports = {
  // 1) Importa do ADMIN -> TENANT (idempotente)
  async importarDoAdmin(req, res) {
    try {
      const dbT = await getDbCliente(req.bancoCliente);
      const dbA = await getDbAdmin();

      const { Empresa: EmpresaA, Endereco: EnderecoA } = dbA.models;
      const { Empresa: EmpresaT, Endereco: EnderecoT, sequelize } = dbT.models;

      const empresaId = req.empresaId;
      if (!empresaId) return res.status(400).json({ error: "empresaId ausente." });

      // carrega do admin
      const adm = await EmpresaA.findByPk(empresaId, { include: [{ model: EnderecoA, as: "enderecos" }] });
      if (!adm) return res.status(404).json({ error: "Empresa não encontrada no admin." });

      await sequelize.transaction(async (t) => {
        // upsert empresa no tenant
        const payloadEmpresa = {
          adminEmpresaId: adm.id,
          nome: adm.nome || "",
          documento: adm.documento || "",
          whatsapp: adm.whatsapp || "",
          telefone: adm.telefone || "",
          email: adm.email || "",
          instagram: adm.instagram || "",
          logo: adm.logo || null,
        };

        const [emp, created] = await EmpresaT.findOrCreate({
          where: { id: empresaId }, // se no tenant a PK for o mesmo id do admin
          defaults: payloadEmpresa,
          transaction: t,
        });

        if (!created) {
          await emp.update(payloadEmpresa, { transaction: t });
        }

        // endereços: apaga somente os que são espelho do admin e recria
        await EnderecoT.destroy({
          where: { empresaId: emp.id, adminEnderecoId: { [dbT.Sequelize.Op.ne]: null } },
          transaction: t,
        });

        const ends = (adm.enderecos || []).map((e) => ({
          empresaId: emp.id,
          adminEnderecoId: e.id,
          logradouro: e.logradouro || "",
          numero: e.numero || "",
          bairro: e.bairro || "",
          cidade: e.cidade || "",
          estado: e.estado || "",
          cep: e.cep || "",
          padrao: !!e.padrao,
        }));

        if (ends.length) {
          await EnderecoT.bulkCreate(ends, { transaction: t });
        }
      });

      return res.json({ ok: true, message: "Importado do admin." });
    } catch (err) {
      console.error("[empresaController] importarDoAdmin:", err);
      return res.status(500).json({ error: "Erro ao importar empresa do admin." });
    }
  },

  // 2) GET empresa do tenant (com endereços)
  async getEmpresa(req, res) {
    try {
      const db = await getDbCliente(req.bancoCliente);
      const { Empresa, Endereco } = db.models;
      const id = req.empresaId;

      const empresa = await Empresa.findByPk(id, {
        include: [{ model: Endereco, as: "enderecos" }],
      });

      if (!empresa) {
        // retorna shape vazio amigável
        return res.json({
          id,
          adminEmpresaId: null,
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

      res.json(empresa);
    } catch (err) {
      console.error("[empresaController] getEmpresa:", err);
      res.status(500).json({ error: "Erro ao carregar empresa." });
    }
  },

  // 3) PUT empresa (TENANT -> ADMIN) — aceita multipart (logo)
  async atualizarEmpresa(req, res) {
    try {
      const dbT = await getDbCliente(req.bancoCliente);
      const dbA = await getDbAdmin();

      const { Empresa: EmpresaT, Endereco: EnderecoT } = dbT.models;
      const { Empresa: EmpresaA } = dbA.models;

      const id = req.empresaId;
      const empresa = await EmpresaT.findByPk(id);
      if (!empresa) return res.status(404).json({ error: "Empresa não encontrada no tenant." });

      const oldLogo = empresa.logo;
      const newLogo = req.file ? req.file.filename : oldLogo;

      const payload = {
        nome: nz(req.body?.nome),
        documento: nz(req.body?.documento),
        whatsapp: nz(req.body?.whatsapp),
        telefone: nz(req.body?.telefone),
        email: nz(req.body?.email),
        instagram: nz(req.body?.instagram),
        logo: newLogo,
      };

      await empresa.update(payload);

      // se trocou logo, remove antiga
      if (req.file && oldLogo && oldLogo !== newLogo) {
        await unlinkIfExists(oldLogo);
      }

      // espelha no admin
      const adminId = empresa.adminEmpresaId || id; // fallback pelo id
      await EmpresaA.update(payload, { where: { id: adminId } });

      // se vier "enderecos" no mesmo PUT, trate aqui opcionalmente
      // (mantive CRUD de endereço separado)
      res.json(await EmpresaT.findByPk(id, { include: ["enderecos"] }));
    } catch (err) {
      console.error("[empresaController] atualizarEmpresa:", err);
      res.status(500).json({ error: "Erro ao atualizar empresa." });
    }
  },

  // 4) POST /enderecos (TENANT -> ADMIN)
  async criarEndereco(req, res) {
    try {
      const dbT = await getDbCliente(req.bancoCliente);
      const dbA = await getDbAdmin();

      const { Empresa: EmpresaT, Endereco: EnderecoT } = dbT.models;
      const { Endereco: EnderecoA } = dbA.models;

      const empresaId = req.empresaId;
      const emp = await EmpresaT.findByPk(empresaId);
      if (!emp) return res.status(404).json({ error: "Empresa não encontrada no tenant." });

      const dados = {
        empresaId,
        logradouro: nz(req.body.logradouro),
        numero: nz(req.body.numero),
        bairro: nz(req.body.bairro),
        cidade: nz(req.body.cidade),
        estado: nz(req.body.estado),
        cep: nz(req.body.cep),
        padrao: !!req.body.padrao,
      };

      const created = await EnderecoT.create(dados);

      // espelha no admin
      const adminEmpresaId = emp.adminEmpresaId || empresaId;
      const criadoAdmin = await EnderecoA.create({ ...dados, empresaId: adminEmpresaId });

      await created.update({ adminEnderecoId: criadoAdmin.id });

      res.status(201).json(created);
    } catch (err) {
      console.error("[empresaController] criarEndereco:", err);
      res.status(500).json({ error: "Erro ao criar endereço." });
    }
  },

  // 5) PUT /enderecos/:id (TENANT -> ADMIN)
  async atualizarEndereco(req, res) {
    try {
      const dbT = await getDbCliente(req.bancoCliente);
      const dbA = await getDbAdmin();

      const { Endereco: EnderecoT } = dbT.models;
      const { Endereco: EnderecoA } = dbA.models;

      const empresaId = req.empresaId;
      const { id } = req.params;

      const end = await EnderecoT.findOne({ where: { id, empresaId } });
      if (!end) return res.status(404).json({ error: "Endereço não encontrado." });

      const patch = {
        logradouro: nz(req.body.logradouro),
        numero: nz(req.body.numero),
        bairro: nz(req.body.bairro),
        cidade: nz(req.body.cidade),
        estado: nz(req.body.estado),
        cep: nz(req.body.cep),
        padrao: req.body.padrao !== undefined ? !!req.body.padrao : end.padrao,
      };

      // se marcar padrao, desmarca os demais
      if (patch.padrao === true) {
        await EnderecoT.update({ padrao: false }, { where: { empresaId, id: { [dbT.Sequelize.Op.ne]: id } } });
      }

      await end.update(patch);

      if (end.adminEnderecoId) {
        await EnderecoA.update(patch, { where: { id: end.adminEnderecoId } });
      }

      res.json(end);
    } catch (err) {
      console.error("[empresaController] atualizarEndereco:", err);
      res.status(500).json({ error: "Erro ao atualizar endereço." });
    }
  },

  // 6) DELETE /enderecos/:id (TENANT -> ADMIN)
  async excluirEndereco(req, res) {
    try {
      const dbT = await getDbCliente(req.bancoCliente);
      const dbA = await getDbAdmin();

      const { Endereco: EnderecoT } = dbT.models;
      const { Endereco: EnderecoA } = dbA.models;

      const empresaId = req.empresaId;
      const { id } = req.params;

      const end = await EnderecoT.findOne({ where: { id, empresaId } });
      if (!end) return res.status(404).json({ error: "Endereço não encontrado." });

      if (end.adminEnderecoId) {
        await EnderecoA.destroy({ where: { id: end.adminEnderecoId } });
      }

      await end.destroy();
      res.json({ message: "Endereço excluído." });
    } catch (err) {
      console.error("[empresaController] excluirEndereco:", err);
      res.status(500).json({ error: "Erro ao excluir endereço." });
    }
  },
};
