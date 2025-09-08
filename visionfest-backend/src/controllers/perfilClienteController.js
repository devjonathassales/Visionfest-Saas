// src/controllers/perfilClienteController.js
const { getDbCliente, getDbAdmin } = require("../utils/tenant");

const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];

exports.obter = async (req, res) => {
  try {
    const empresaId = req.empresaId;

    // 1) tenta no TENANT (espelho que criamos no cadastro)
    const dbC = await getDbCliente();
    const EmpresaT = dbC.models?.Empresa;
    if (EmpresaT) {
      const emp = await EmpresaT.findByPk(empresaId);
      if (emp) {
        return res.json({
          id: emp.id,
          nome: emp.nome,
          documento: hasAttr(EmpresaT, "cpfCnpj") ? emp.cpfCnpj : emp.documento,
          email: emp.email || null,
          whatsapp: emp.whatsapp || null,
          dominio: emp.dominio || null,
          cep: emp.cep || null,
          endereco: emp.endereco || emp.logradouro || null,
          numero: emp.numero || null,
          bairro: emp.bairro || null,
          cidade: emp.cidade || null,
          uf: emp.uf || emp.estado || null,
        });
      }
    }

    // 2) fallback: ADMIN
    const dbA = await getDbAdmin();
    const EmpresaA = dbA.models?.Empresa;
    if (!EmpresaA) return res.json(null);

    const empA = await EmpresaA.findByPk(empresaId);
    if (!empA) return res.json(null);

    return res.json({
      id: empA.id,
      nome: empA.nome,
      documento: empA.cpfCnpj,
      email: empA.email || null,
      whatsapp: empA.whatsapp || null,
      dominio: empA.dominio || null,
      cep: empA.cep || null,
      endereco: empA.endereco || null,
      numero: empA.numero || null,
      bairro: empA.bairro || null,
      cidade: empA.cidade || null,
      uf: empA.uf || null,
    });
  } catch (err) {
    console.error("[perfilCliente] obter:", err);
    return res.status(500).json({ error: "Erro ao carregar perfil." });
  }
};
