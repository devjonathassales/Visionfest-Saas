// src/controllers/empresaController.js
const path = require("path");
const fs = require("fs/promises");

// ⛔️ REMOVER: const { getDbAdmin } = require("../utils/tenant");
// ✅ USAR APENAS O ADMIN DB DIRETO
const adminDb = require("../lib/adminDb"); // exporta { sequelize?, Empresa, Endereco, ... }

// helper: normaliza string vazia -> null
const nz = (v) => (v === "" ? null : v);

async function unlinkIfExists(file) {
  if (!file) return;
  const full = path.join(__dirname, "..", "uploads", file);
  try {
    await fs.unlink(full);
  } catch (_) {}
}

module.exports = {
  // 1) Importa do ADMIN -> TENANT (idempotente)
  async importarDoAdmin(req, res) {
    try {
      // ❇️ Pega models do admin
      const { Empresa: EmpresaA, Endereco: EnderecoA } = adminDb;

      // tenant vem do middleware
      const {
        Empresa: EmpresaT,
        Endereco: EnderecoT,
        Sequelize,
      } = req.models || {};
      if (!EmpresaT)
        return res
          .status(500)
          .json({ error: "Model Empresa indisponível no tenant." });

      const empresaId = req.empresaId;
      if (!empresaId)
        return res.status(400).json({ error: "empresaId ausente." });

      // carrega do admin
      const adm = await EmpresaA.findByPk(empresaId, {
        include: EnderecoA ? [{ model: EnderecoA, as: "enderecos" }] : [],
      });
      if (!adm)
        return res
          .status(404)
          .json({ error: "Empresa não encontrada no admin." });

      await EmpresaT.sequelize.transaction(async (t) => {
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
          where: { id: empresaId },
          defaults: payloadEmpresa,
          transaction: t,
        });

        if (!created) {
          await emp.update(payloadEmpresa, { transaction: t });
        }

        if (EnderecoT) {
          // apaga espelhos e recria
          await EnderecoT.destroy({
            where: {
              empresaId: emp.id,
              adminEnderecoId: { [Sequelize.Op.ne]: null },
            },
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
        }
      });

      return res.json({ ok: true, message: "Importado do admin." });
    } catch (err) {
      console.error("[empresaController] importarDoAdmin:", err);
      return res
        .status(500)
        .json({ error: "Erro ao importar empresa do admin." });
    }
  },

  // 2) GET empresa do tenant (com endereços)
  async getEmpresa(req, res) {
    try {
      const { Empresa, Endereco } = req.models || {};
      if (!Empresa)
        return res
          .status(500)
          .json({ error: "Model Empresa indisponível no tenant." });

      const id = req.empresaId;
      const include = Endereco ? [{ model: Endereco, as: "enderecos" }] : [];

      const empresa = await Empresa.findByPk(id, { include });
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
      const { Empresa, Endereco } = req.models || {};
      if (!Empresa)
        return res
          .status(500)
          .json({ error: "Model Empresa indisponível no tenant." });

      // ❇️ Admin Empresa (se existir)
      const EmpresaA = adminDb?.Empresa;

      const id = req.empresaId;
      const empresa = await Empresa.findByPk(id);
      if (!empresa)
        return res
          .status(404)
          .json({ error: "Empresa não encontrada no tenant." });

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

      if (req.file && oldLogo && oldLogo !== newLogo) {
        await unlinkIfExists(oldLogo);
      }

      // espelha no admin se possível
      if (EmpresaA) {
        const adminId = empresa.adminEmpresaId || id; // fallback pelo id
        await EmpresaA.update(payload, { where: { id: adminId } });
      }

      const include = Endereco ? ["enderecos"] : [];
      res.json(await Empresa.findByPk(id, { include }));
    } catch (err) {
      console.error("[empresaController] atualizarEmpresa:", err);
      res.status(500).json({ error: "Erro ao atualizar empresa." });
    }
  },

  // 4) POST /enderecos (TENANT -> ADMIN)
  async criarEndereco(req, res) {
    try {
      const { Empresa, Endereco } = req.models || {};
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
        logradouro: nz(req.body.logradouro),
        numero: nz(req.body.numero),
        bairro: nz(req.body.bairro),
        cidade: nz(req.body.cidade),
        estado: nz(req.body.estado),
        cep: nz(req.body.cep),
        padrao: !!req.body.padrao,
      };

      const created = await Endereco.create(dados);

      if (EnderecoA) {
        const adminEmpresaId = emp.adminEmpresaId || empresaId;
        const criadoAdmin = await EnderecoA.create({
          ...dados,
          empresaId: adminEmpresaId,
        });
        await created.update({ adminEnderecoId: criadoAdmin.id });
      }

      res.status(201).json(created);
    } catch (err) {
      console.error("[empresaController] criarEndereco:", err);
      res.status(500).json({ error: "Erro ao criar endereço." });
    }
  },

  // 5) PUT /enderecos/:id (TENANT -> ADMIN)
  async atualizarEndereco(req, res) {
    try {
      const { Endereco, Sequelize } = req.models || {};
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
        logradouro: nz(req.body.logradouro),
        numero: nz(req.body.numero),
        bairro: nz(req.body.bairro),
        cidade: nz(req.body.cidade),
        estado: nz(req.body.estado),
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

      if (EnderecoA && end.adminEnderecoId) {
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
      const { Endereco } = req.models || {};
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

      if (EnderecoA && end.adminEnderecoId) {
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
