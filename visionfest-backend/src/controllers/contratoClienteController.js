const { Op } = require("sequelize");
const { getDbAdmin, getDbCliente } = require("../utils/tenant");

// Helpers ---------------------------------------------------------------------
const HOJE0 = () =>
  new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

const toBRL = (v) => Number(v || 0);
const addMonths = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

function parseFunc(f) {
  if (!f) return [];
  if (Array.isArray(f)) return f;
  // tenta quebrar por ; ou ,
  return String(f)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function rankPlanos(planos) {
  // ordena por valor asc e devolve um mapa id -> rank
  const sorted = [...planos].sort(
    (a, b) => toBRL(a.valorMensal) - toBRL(b.valorMensal)
  );
  const rank = {};
  sorted.forEach((p, i) => (rank[p.id] = i));
  return rank;
}

function mesesEntre(inicio, fim) {
  const d1 = new Date(inicio);
  const d2 = new Date(fim);
  let m =
    (d2.getFullYear() - d1.getFullYear()) * 12 +
    (d2.getMonth() - d1.getMonth());
  if (d2.getDate() < d1.getDate()) m -= 1;
  return Math.max(0, m);
}

// Controller -------------------------------------------------------------------
module.exports = {
  // Retorna o contrato/plano atual (do Admin) com fallback
  async obterAtual(req, res) {
    try {
      const empresaId = req.empresaId;
      const dbA = await getDbAdmin();
      const Assinatura = dbA.models?.Assinatura;
      const Plano = dbA.models?.Plano;
      const Empresa = dbA.models?.Empresa;

      let atual = null;

      if (Assinatura && Plano) {
        atual = await Assinatura.findOne({
          where: {
            empresaId,
            status: { [Op.in]: ["ativa", "trial", "cancelamento_pendente"] },
          },
          order: [["dataInicio", "DESC"]],
          include: [{ model: Plano, as: "plano" }],
        });
      }

      // Fallback: usa Empresa
      if (!atual && Empresa) {
        const emp = await Empresa.findByPk(empresaId);
        if (emp) {
          atual = {
            id: `emp-${emp.id}`,
            plano: {
              id: emp.planoId || "fallback",
              nome: emp.planoNome || "VisionFest",
              funcionalidades: parseFunc(
                emp.planoFuncionalidades ||
                  "Contratos; Agenda; Financeiro; Usuários"
              ),
              valorMensal: toBRL(
                emp.valorPlano || process.env.PLANO_VALOR_PADRAO || 199.9
              ),
            },
            dataInicio: emp.dataAtivacao || emp.createdAt || new Date(),
            dataFim: emp.dataValidade || addMonths(new Date(), 12),
            renovacaoAutomatica: !!emp.renovacaoAutomatica,
            metodoPagamento: emp.metodoPagamento || "pix", // "cartao" | "pix" | "boleto"
            status: "ativa",
          };
        }
      }

      if (!atual) return res.json(null);

      const payload = {
        id: atual.id,
        planoId: atual.plano?.id || null,
        plano: atual.plano?.nome || "Plano",
        valor: toBRL(atual.plano?.valorMensal),
        funcionalidades: parseFunc(atual.plano?.funcionalidades),
        dataInicio: atual.dataInicio,
        dataValidade: atual.dataFim,
        renovacaoAutomatica: !!atual.renovacaoAutomatica,
        metodoPagamento: atual.metodoPagamento || "pix",
        status: atual.status || "ativa",
      };

      return res.json(payload);
    } catch (err) {
      console.error("[contratoCliente] obterAtual:", err);
      return res.status(500).json({ error: "Erro ao carregar contrato." });
    }
  },

  // Lista histórico (todas assinaturas passadas)
  async historico(req, res) {
    try {
      const empresaId = req.empresaId;
      const dbA = await getDbAdmin();
      const Assinatura = dbA.models?.Assinatura;
      const Plano = dbA.models?.Plano;
      const Empresa = dbA.models?.Empresa;

      let hist = [];

      if (Assinatura && Plano) {
        const list = await Assinatura.findAll({
          where: { empresaId },
          order: [["dataInicio", "DESC"]],
          include: [{ model: Plano, as: "plano" }],
        });
        hist = list.map((a) => ({
          id: a.id,
          plano: a.plano?.nome || "Plano",
          valor: toBRL(a.plano?.valorMensal),
          dataInicio: a.dataInicio,
          dataFim: a.dataFim,
          status: a.status,
        }));
      } else if (Empresa) {
        const emp = await Empresa.findByPk(empresaId);
        if (emp) {
          hist = [
            {
              id: `emp-${emp.id}`,
              plano: emp.planoNome || "VisionFest",
              valor: toBRL(
                emp.valorPlano || process.env.PLANO_VALOR_PADRAO || 199.9
              ),
              dataInicio: emp.dataAtivacao || emp.createdAt || new Date(),
              dataFim: emp.dataValidade || addMonths(new Date(), 12),
              status: "ativa",
            },
          ];
        }
      }

      return res.json(hist);
    } catch (err) {
      console.error("[contratoCliente] historico:", err);
      return res.status(500).json({ error: "Erro ao carregar histórico." });
    }
  },

  // Lista planos disponíveis para upgrade
  async planosDisponiveis(req, res) {
    try {
      const dbA = await getDbAdmin();
      const Plano = dbA.models?.Plano;

      if (Plano) {
        const planos = await Plano.findAll({
          attributes: ["id", "nome", "valorMensal", "funcionalidades"],
          order: [["valorMensal", "ASC"]],
        });
        return res.json(
          planos.map((p) => ({
            id: p.id,
            nome: p.nome,
            valor: toBRL(p.valorMensal),
            funcionalidades: parseFunc(p.funcionalidades),
          }))
        );
      }

      // fallback estático
      const fallback = [
        {
          id: "basic",
          nome: "Basic",
          valor: 149.9,
          funcionalidades: ["Contratos", "Agenda"],
        },
        {
          id: "pro",
          nome: "Pro",
          valor: 199.9,
          funcionalidades: ["Contratos", "Agenda", "Financeiro", "Usuários"],
        },
        {
          id: "enterprise",
          nome: "Enterprise",
          valor: 299.9,
          funcionalidades: [
            "Tudo do Pro",
            "Relatórios Avançados",
            "Prioridade",
          ],
        },
      ];
      return res.json(fallback);
    } catch (err) {
      console.error("[contratoCliente] planosDisponiveis:", err);
      return res.status(500).json({ error: "Erro ao carregar planos." });
    }
  },

  // Liga/desliga renovação automática
  async atualizarRenovacao(req, res) {
    try {
      const empresaId = req.empresaId;
      const { renovacaoAutomatica } = req.body || {};
      const dbA = await getDbAdmin();
      const Assinatura = dbA.models?.Assinatura;
      const Empresa = dbA.models?.Empresa;

      if (Assinatura) {
        const atual = await Assinatura.findOne({
          where: {
            empresaId,
            status: { [Op.in]: ["ativa", "trial", "cancelamento_pendente"] },
          },
          order: [["dataInicio", "DESC"]],
        });
        if (!atual)
          return res.status(404).json({ error: "Assinatura não encontrada." });
        atual.renovacaoAutomatica = !!renovacaoAutomatica;
        await atual.save();
        return res.json({
          ok: true,
          renovacaoAutomatica: !!atual.renovacaoAutomatica,
        });
      }

      // fallback via Empresa
      if (Empresa) {
        const emp = await Empresa.findByPk(empresaId);
        if (!emp)
          return res.status(404).json({ error: "Empresa não encontrada." });
        emp.renovacaoAutomatica = !!renovacaoAutomatica;
        await emp.save();
        return res.json({
          ok: true,
          renovacaoAutomatica: !!emp.renovacaoAutomatica,
        });
      }

      return res
        .status(400)
        .json({ error: "Modelo de assinatura indisponível." });
    } catch (err) {
      console.error("[contratoCliente] atualizarRenovacao:", err);
      return res.status(500).json({ error: "Erro ao atualizar renovação." });
    }
  },

  // Renovar agora (placeholder): estende +12 meses
  async renovarAgora(req, res) {
    try {
      const empresaId = req.empresaId;
      const dbA = await getDbAdmin();
      const Assinatura = dbA.models?.Assinatura;
      const Empresa = dbA.models?.Empresa;

      if (Assinatura) {
        const atual = await Assinatura.findOne({
          where: { empresaId, status: { [Op.in]: ["ativa", "trial"] } },
          order: [["dataInicio", "DESC"]],
        });
        if (!atual)
          return res.status(404).json({ error: "Assinatura não encontrada." });
        atual.dataFim = addMonths(new Date(atual.dataFim || new Date()), 12);
        atual.renovacaoAutomatica = true;
        await atual.save();
        return res.json({
          ok: true,
          dataValidade: atual.dataFim,
          renovacaoAutomatica: true,
        });
      }

      if (Empresa) {
        const emp = await Empresa.findByPk(empresaId);
        if (!emp)
          return res.status(404).json({ error: "Empresa não encontrada." });
        emp.dataValidade = addMonths(
          new Date(emp.dataValidade || new Date()),
          12
        );
        emp.renovacaoAutomatica = true;
        await emp.save();
        return res.json({
          ok: true,
          dataValidade: emp.dataValidade,
          renovacaoAutomatica: true,
        });
      }

      return res
        .status(400)
        .json({ error: "Modelo de assinatura indisponível." });
    } catch (err) {
      console.error("[contratoCliente] renovarAgora:", err);
      return res.status(500).json({ error: "Erro ao renovar." });
    }
  },

  // Upgrade — valida "sem downgrade" e cria uma solicitação
  async solicitarUpgrade(req, res) {
    try {
      const empresaId = req.empresaId;
      const { planoId } = req.body || {};
      if (!planoId)
        return res.status(400).json({ error: "Plano destino não informado." });

      const dbA = await getDbAdmin();
      const Assinatura = dbA.models?.Assinatura;
      const Plano = dbA.models?.Plano;
      const SolicUpgrade = dbA.models?.SolicitacaoUpgrade;

      // pega planos p/ ranking
      let planos = [];
      if (Plano) {
        planos = await Plano.findAll({
          attributes: ["id", "valorMensal"],
          raw: true,
        });
      }
      // contrato atual
      let atual = null;
      if (Assinatura) {
        atual = await Assinatura.findOne({
          where: { empresaId, status: { [Op.in]: ["ativa", "trial"] } },
          order: [["dataInicio", "DESC"]],
          raw: true,
        });
      }

      // sem modelo de plano? permitir (não dá pra comparar) — segue
      if (planos.length && atual?.planoId) {
        const rank = rankPlanos(planos);
        if (rank[planoId] <= rank[atual.planoId]) {
          return res.status(400).json({ error: "Downgrade não é permitido." });
        }
      }

      if (SolicUpgrade) {
        await SolicUpgrade.create({
          empresaId,
          planoDestinoId: planoId,
          status: "pendente",
          solicitadoEm: new Date(),
        });
      }

      return res.json({
        ok: true,
        message:
          "Solicitação de upgrade registrada. Em breve entraremos em contato/ativaremos o novo plano.",
      });
    } catch (err) {
      console.error("[contratoCliente] solicitarUpgrade:", err);
      return res.status(500).json({ error: "Erro ao solicitar upgrade." });
    }
  },

  // Cancelamento — aplica regras e calcula multa
  async solicitarCancelamento(req, res) {
    try {
      const empresaId = req.empresaId;
      const { motivo } = req.body || {};

      const dbA = await getDbAdmin();
      const Assinatura = dbA.models?.Assinatura;
      const Plano = dbA.models?.Plano;
      const Empresa = dbA.models?.Empresa;
      const SolicCancel = dbA.models?.SolicitacaoCancelamento;

      // carrega assinatura/empresa atual
      let dados = null;
      if (Assinatura && Plano) {
        dados = await Assinatura.findOne({
          where: {
            empresaId,
            status: { [Op.in]: ["ativa", "trial", "cancelamento_pendente"] },
          },
          order: [["dataInicio", "DESC"]],
          include: [{ model: Plano, as: "plano" }],
        });
      }
      if (!dados && Empresa) {
        const emp = await Empresa.findByPk(empresaId);
        if (emp) {
          dados = {
            plano: { valorMensal: toBRL(emp.valorPlano || 199.9) },
            metodoPagamento: emp.metodoPagamento || "pix",
            dataInicio: emp.dataAtivacao || emp.createdAt || new Date(),
            dataFim: emp.dataValidade || addMonths(new Date(), 12),
            status: "ativa",
          };
        }
      }
      if (!dados)
        return res.status(404).json({ error: "Assinatura não encontrada." });

      const metodo = dados.metodoPagamento || "pix"; // "cartao" | "pix" | "boleto"
      const hoje = HOJE0();

      // regra de aviso prévio
      const diasAviso = metodo === "cartao" ? 30 : 15;

      // próxima fatura (aproximação: dataFim é fim do ciclo; usa -diasAviso p/ limite)
      const proximoCiclo = new Date(dados.dataFim || addMonths(hoje, 1));
      const limiteAviso = new Date(proximoCiclo);
      limiteAviso.setDate(limiteAviso.getDate() - diasAviso);

      if (hoje > limiteAviso) {
        return res.status(400).json({
          error:
            metodo === "cartao"
              ? "Cancelamento recorrente deve ser solicitado com 30 dias de antecedência da próxima parcela."
              : "Cancelamento via pix/boleto deve ser solicitado com 15 dias de antecedência do vencimento.",
        });
      }

      // multa: 2 mensalidades se menos de 6 meses de uso; 1 mensalidade após 6 meses
      const mesesUso = mesesEntre(dados.dataInicio, hoje);
      const multa = mesesUso < 6 ? 2 : 1;
      const valorMulta = multa * toBRL(dados.plano?.valorMensal || 0);

      if (SolicCancel) {
        await SolicCancel.create({
          empresaId,
          motivo: motivo || null,
          valorMulta,
          status: "pendente",
          solicitadoEm: new Date(),
        });
      }

      // marca assinatura como cancelamento_pendente se existir
      if (dbA.models?.Assinatura && dados.id) {
        const atual = await dbA.models.Assinatura.findByPk(dados.id);
        if (atual) {
          atual.status = "cancelamento_pendente";
          await atual.save();
        }
      } else if (Empresa) {
        const emp = await Empresa.findByPk(empresaId);
        if (emp) {
          emp.statusAssinatura = "cancelamento_pendente";
          await emp.save();
        }
      }

      return res.json({
        ok: true,
        message:
          "Solicitação de cancelamento registrada. Nossa equipe entrará em contato para concluir o processo.",
        regraAvisoDias: diasAviso,
        valorMulta,
      });
    } catch (err) {
      console.error("[contratoCliente] solicitarCancelamento:", err);
      return res.status(500).json({ error: "Erro ao solicitar cancelamento." });
    }
  },
};
