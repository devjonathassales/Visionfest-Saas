const path = require("path");
const nodemailer = require("nodemailer");
const { getDbAdmin } = require("../utils/tenant");

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "suporte@visionfest.com.br";

// SMTP (ajuste suas envs)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

function anexosFromFiles(files = []) {
  return (files || []).map((f) => ({
    name: f.originalname,
    path: `/uploads/suporte/${path.basename(f.path)}`,
    size: f.size,
  }));
}

module.exports = {
  async abrirChamado(req, res) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.userId || req.usuarioId || null;
      const empresaNome = req.empresaNome || null;
      const usuarioNome = req.usuarioNome || req.userName || null;

      const { assunto, mensagem, prioridade = "media" } = req.body || {};
      if (!assunto || !mensagem) {
        return res.status(400).json({ error: "Informe assunto e mensagem." });
      }

      const dbA = await getDbAdmin();
      const { SuporteChamado } = dbA.models;

      const anexos = anexosFromFiles(req.files);

      // salva no admin
      const chamado = await SuporteChamado.create({
        empresaId,
        empresaNome,
        usuarioId,
        usuarioNome,
        assunto,
        prioridade,
        mensagem,
        anexos,
        canal: "email",
        status: "aberto",
      });

      // envia e-mail
      const html = `
        <h2>Novo Chamado de Suporte</h2>
        <p><b>Empresa:</b> ${empresaNome || empresaId}</p>
        <p><b>Usuário:</b> ${usuarioNome || usuarioId || "-"}</p>
        <p><b>Assunto:</b> ${assunto}</p>
        <p><b>Prioridade:</b> ${prioridade}</p>
        <p><b>Mensagem:</b></p>
        <pre style="white-space:pre-wrap">${mensagem}</pre>
        <p><b>ID do Chamado:</b> ${chamado.id}</p>
      `;
      try {
        await transporter.sendMail({
          from:
            process.env.SMTP_FROM ||
            `"VisionFest" <no-reply@visionfest.com.br>`,
          to: SUPPORT_EMAIL,
          subject: `[Suporte] ${assunto} (Empresa ${empresaNome || empresaId})`,
          html,
          attachments: (req.files || []).map((f) => ({
            filename: f.originalname,
            path: f.path,
          })),
        });
      } catch (e) {
        // segue mesmo se o email falhar (registro fica salvo)
        console.error("Falha ao enviar e-mail de suporte:", e.message);
      }

      return res.status(201).json(chamado);
    } catch (err) {
      console.error("[suporteCliente] abrirChamado:", err);
      return res.status(500).json({ error: "Erro ao abrir chamado." });
    }
  },

  async meusChamados(req, res) {
    try {
      const empresaId = req.empresaId;
      const dbA = await getDbAdmin();
      const { SuporteChamado } = dbA.models;

      const itens = await SuporteChamado.findAll({
        where: { empresaId },
        order: [["createdAt", "DESC"]],
      });

      return res.json(itens);
    } catch (err) {
      console.error("[suporteCliente] meusChamados:", err);
      return res.status(500).json({ error: "Erro ao listar chamados." });
    }
  },
};
