const { ContaReceber, Cliente, Contrato } = require("../models");

/**
 * Atualiza o status do contrato conforme o pagamento das contas a receber vinculadas.
 * Só marca como 'Totalmente Pago' se todas as contas estiverem com status 'pago' e valor recebido >= valor total.
 * Caso contrário, mantém 'Parcialmente Pago' ou 'Aberto'.
 */
async function atualizarStatusContratoSePago(contratoId, transaction = null) {
  // Busca todas as contas vinculadas ao contrato
  const contas = await ContaReceber.findAll({
    where: { contratoId },
    transaction,
  });

  if (!contas.length) {
    // Se não existir nenhuma conta vinculada, pode ser que contrato esteja aberto ou não definido
    await Contrato.update(
      { statusPagamento: "Aberto" },
      { where: { id: contratoId }, transaction }
    );
    return;
  }

  // Verifica se todas as contas estão pagas (status = 'pago') E valorRecebido >= valorTotal
  const todasPagas = contas.every(
    (c) => c.status === "pago" && Number(c.valorRecebido) >= Number(c.valorTotal)
  );

  // Verifica se existe pelo menos uma conta com algum valor recebido
  const algumPago = contas.some(
    (c) => Number(c.valorRecebido) > 0
  );

  if (todasPagas) {
    // Atualiza para Totalmente Pago
    await Contrato.update(
      { statusPagamento: "Totalmente Pago" },
      { where: { id: contratoId }, transaction }
    );
  } else if (algumPago) {
    // Se algum valor foi pago mas não todas as contas, status parcial
    await Contrato.update(
      { statusPagamento: "Parcialmente Pago" },
      { where: { id: contratoId }, transaction }
    );
  } else {
    // Nenhum pagamento efetuado ainda
    await Contrato.update(
      { statusPagamento: "Aberto" },
      { where: { id: contratoId }, transaction }
    );
  }
}

async function gerarContasReceberContrato(contrato, params, transaction) {
  const {
    clienteId,
    centroCustoId,
    valorEntrada,
    dataContrato,
    valorRestante,
    parcelasRestante,
  } = params;

  const cliente = await Cliente.findByPk(clienteId, { transaction });
  const nomeCliente = cliente?.nome || "Cliente";

  const contas = [];

  // Entrada
  if (valorEntrada && Number(valorEntrada) > 0) {
    contas.push(
      await ContaReceber.create(
        {
          descricao: `Entrada do contrato #${contrato.id} - ${nomeCliente}`,
          valor: Number(valorEntrada),
          valorTotal: Number(valorEntrada),
          vencimento: dataContrato,
          dataRecebimento: new Date(),
          status: "pago",
          valorRecebido: Number(valorEntrada),
          clienteId,
          contratoId: contrato.id,
          centroCustoId,
        },
        { transaction }
      )
    );
  }

  // Parcelas
  if (valorRestante && Number(valorRestante) > 0) {
    if (Array.isArray(parcelasRestante) && parcelasRestante.length > 0) {
      for (const parcela of parcelasRestante) {
        if (!parcela.valor || !parcela.vencimento) {
          throw new Error(
            `Parcela inválida para contrato #${contrato.id}: valor e vencimento são obrigatórios`
          );
        }

        contas.push(
          await ContaReceber.create(
            {
              descricao: `Parcela do contrato #${contrato.id} - ${nomeCliente}`,
              valor: Number(parcela.valor),
              valorTotal: Number(parcela.valor),
              vencimento: parcela.vencimento,
              status: "aberto",
              valorRecebido: 0,
              clienteId,
              contratoId: contrato.id,
              centroCustoId,
            },
            { transaction }
          )
        );
      }
    } else {
      contas.push(
        await ContaReceber.create(
          {
            descricao: `Saldo restante do contrato #${contrato.id} - ${nomeCliente}`,
            valor: Number(valorRestante),
            valorTotal: Number(valorRestante),
            vencimento: dataContrato,
            status: "aberto",
            valorRecebido: 0,
            clienteId,
            contratoId: contrato.id,
            centroCustoId,
          },
          { transaction }
        )
      );
    }
  }

  // Atualiza o status do contrato após criar as contas
  await atualizarStatusContratoSePago(contrato.id, transaction);

  return contas;
}

module.exports = { gerarContasReceberContrato, atualizarStatusContratoSePago };
