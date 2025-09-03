const { getDbAdmin, getDbCliente } = require("../utils/tenant");

function statusByDates(vencimento, pagoEm) {
  if (pagoEm) return "pago";
  const hoje = new Date();
  const d = new Date(vencimento);
  return d < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    ? "atrasado"
    : "pendente";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

module.exports = {
  // Lista 12 parcelas do plano para a empresa (tenant). Tenta do Admin; se não houver, gera.
  async listar(req, res) {
    try {
      const empresaId = req.empresaId;
      const dbA = await getDbAdmin();
      const dbT = await getDbCliente(req.bancoCliente);

      const EmpresaA = dbA.models?.Empresa;
      const AssinaturaParcela = dbA.models?.AssinaturaParcela; // se existir
      let faturas = [];

      if (AssinaturaParcela) {
        // busca parcelas cadastradas no admin (preferível)
        const parcelas = await AssinaturaParcela.findAll({
          where: { empresaId },
          order: [["numeroParcela", "ASC"]],
          limit: 12,
          raw: true,
        });

        faturas = parcelas.map((p) => ({
          id: p.id,
          numero: `${pad2(p.numeroParcela)}/${p.totalParcelas || 12}`,
          vencimento: p.vencimento,
          valor: Number(p.valor || 0),
          status: p.status || statusByDates(p.vencimento, p.pagoEm),
          pagoEm: p.pagoEm || null,
        }));
      } else {
        // fallback: gerar 12 parcelas com base nos dados da empresa no admin
        const emp = EmpresaA
          ? await EmpresaA.findByPk(empresaId, { raw: true })
          : null;

        const baseDate = emp?.dataAtivacao || emp?.createdAt || new Date();
        const start = new Date(baseDate);
        const dia = Math.min(new Date(baseDate).getDate() || 10, 28); // garante dia <= 28
        const valorPlano =
          Number(emp?.valorPlano) ||
          Number(process.env.PLANO_VALOR_PADRAO || 199.9);

        const hoje = new Date();

        for (let i = 0; i < 12; i++) {
          const venc = new Date(start.getFullYear(), start.getMonth() + i, dia);
          const pagoEm = null; // sem registro de pagamento no fallback
          faturas.push({
            id: `${empresaId}-${i + 1}`,
            numero: `${pad2(i + 1)}/12`,
            vencimento: venc,
            valor: valorPlano,
            status:
              venc <
              new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
                ? "atrasado"
                : "pendente",
            pagoEm,
          });
        }
      }

      return res.json(faturas);
    } catch (err) {
      console.error("[faturaController] listar:", err);
      return res.status(500).json({ error: "Erro ao carregar faturas." });
    }
  },

  // Placeholder de pagamento (em breve integração com gateway)
  async iniciarPagamento(req, res) {
    try {
      const { id } = req.params;
      return res.json({
        ok: true,
        message: "Fluxo de pagamento ainda não habilitado para esta conta.",
        faturaId: id,
      });
    } catch (err) {
      console.error("[faturaController] iniciarPagamento:", err);
      return res.status(500).json({ error: "Erro ao iniciar pagamento." });
    }
  },
};
