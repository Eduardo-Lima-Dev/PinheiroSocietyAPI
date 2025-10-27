import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Relatórios de faturamento e vendas
 */

/**
 * @swagger
 * /relatorios/faturamento:
 *   get:
 *     tags: [Relatórios]
 *     summary: Relatório de faturamento por período
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Relatório de faturamento
 */
router.get('/faturamento', async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  
  if (!dataInicio || !dataFim) {
    return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios' });
  }

  // Converter para string e limpar espaços
  const dataInicioStr = String(dataInicio).trim();
  const dataFimStr = String(dataFim).trim();

  // Validar formato YYYY-MM-DD
  const formatoData = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatoData.test(dataInicioStr) || !formatoData.test(dataFimStr)) {
    return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
  }

  const inicio = new Date(dataInicioStr + 'T00:00:00');
  const fim = new Date(dataFimStr + 'T23:59:59');

  // Validar se as datas são válidas
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
  }

  // Faturamento de comandas
  const comandas = await prisma.comanda.findMany({
    where: {
      closedAt: {
        gte: inicio,
        lte: fim
      },
      payment: { not: null }
    },
    include: {
      items: true,
      cliente: { select: { nomeCompleto: true, telefone: true } }
    }
  });

  const totalComandas = comandas.reduce((acc, c) => acc + c.totalCents, 0);
  const totalComandasCount = comandas.length;

  // Faturamento de lançamentos
  const lancamentos = await prisma.lancamento.findMany({
    where: {
      createdAt: {
        gte: inicio,
        lte: fim
      }
    },
    include: {
      items: true,
      cliente: { select: { nomeCompleto: true, telefone: true } }
    }
  });

  const totalLancamentos = lancamentos.reduce((acc, l) => acc + l.totalCents, 0);
  const totalLancamentosCount = lancamentos.length;

  // Faturamento por forma de pagamento (comandas)
  const faturamentoPorPagamentoComandas = comandas.reduce((acc, c) => {
    const payment = c.payment || 'SEM_PAGAMENTO';
    acc[payment] = (acc[payment] || 0) + c.totalCents;
    return acc;
  }, {} as Record<string, number>);

  // Faturamento por forma de pagamento (lançamentos)
  const faturamentoPorPagamentoLancamentos = lancamentos.reduce((acc, l) => {
    const payment = l.payment;
    acc[payment] = (acc[payment] || 0) + l.totalCents;
    return acc;
  }, {} as Record<string, number>);

  // Faturamento total por pagamento
  const faturamentoPorPagamento = { ...faturamentoPorPagamentoComandas };
  Object.entries(faturamentoPorPagamentoLancamentos).forEach(([payment, valor]) => {
    faturamentoPorPagamento[payment] = (faturamentoPorPagamento[payment] || 0) + valor;
  });

  // Produtos mais vendidos (comandas + lançamentos)
  const produtosVendidosComandas = comandas.flatMap(c => c.items);
  const produtosVendidosLancamentos = lancamentos.flatMap(l => l.items);
  const todosProdutosVendidos = [...produtosVendidosComandas, ...produtosVendidosLancamentos];
  
  const produtosAgrupados = todosProdutosVendidos.reduce((acc, item) => {
    const key = item.produtoId ? `produto_${item.produtoId}` : `custom_${item.description}`;
    if (!acc[key]) {
      acc[key] = {
        description: item.description,
        quantidade: 0,
        totalCents: 0,
        produtoId: item.produtoId
      };
    }
    acc[key].quantidade += item.quantity;
    acc[key].totalCents += item.quantity * item.unitCents;
    return acc;
  }, {} as Record<string, any>);

  const produtosMaisVendidos = Object.values(produtosAgrupados)
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 10);

  const faturamentoTotal = totalComandas + totalLancamentos;

  res.json({
    periodo: { dataInicio, dataFim },
    faturamentoTotal,
    faturamentoPorTipoVenda: {
      comandas: totalComandas,
      lancamentos: totalLancamentos
    },
    comandas: {
      totalCents: totalComandas,
      totalCount: totalComandasCount
    },
    lancamentos: {
      totalCents: totalLancamentos,
      totalCount: totalLancamentosCount
    },
    faturamentoPorPagamento,
    produtosMaisVendidos
  });
});


/**
 * @swagger
 * /relatorios/dashboard:
 *   get:
 *     tags: [Relatórios]
 *     summary: Dashboard com resumo geral e métricas operacionais
 *     responses:
 *       200:
 *         description: Dashboard com resumo completo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mes:
 *                   type: object
 *                   properties:
 *                     faturamentoCents:
 *                       type: integer
 *                       description: Faturamento total do mês em centavos
 *                     comandasCount:
 *                       type: integer
 *                       description: Número de comandas do mês
 *                     lancamentosCount:
 *                       type: integer
 *                       description: Número de lançamentos do mês
 *                     reservasCount:
 *                       type: integer
 *                       description: Número de reservas ativas do mês
 *                     faturamentoPorTipo:
 *                       type: object
 *                       properties:
 *                         comandas:
 *                           type: integer
 *                         lancamentos:
 *                           type: integer
 *                 hoje:
 *                   type: object
 *                   properties:
 *                     reservas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           quadra:
 *                             type: string
 *                           hora:
 *                             type: integer
 *                           cliente:
 *                             type: string
 *                           precoCents:
 *                             type: integer
 *                     receitaHoje:
 *                       type: object
 *                       properties:
 *                         totalCents:
 *                           type: integer
 *                           description: Receita total de hoje em centavos
 *                         mediaDiaria30Dias:
 *                           type: integer
 *                           description: Média diária dos últimos 30 dias em centavos
 *                         variacao:
 *                           type: integer
 *                           description: "Variação percentual (ex: 15 para +15%)"
 *                         variacaoTipo:
 *                           type: string
 *                           enum: [positiva, negativa, neutro]
 *                 alertas:
 *                   type: object
 *                   properties:
 *                     estoqueBaixo:
 *                       type: integer
 *                       description: Número de produtos com estoque baixo
 *                     produtos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           quantidade:
 *                             type: integer
 *                           minQuantidade:
 *                             type: integer
 *                 statusMesas:
 *                   type: object
 *                   properties:
 *                     mesasOcupadas:
 *                       type: integer
 *                       description: Número de mesas ocupadas no momento
 *                     totalMesas:
 *                       type: integer
 *                       description: Total de mesas ativas no sistema
 *                 horariosOcupados:
 *                   type: object
 *                   properties:
 *                     percentualOcupacao:
 *                       type: integer
 *                       description: "Percentual de ocupação dos horários hoje (ex: 78)"
 *                     totalSlots:
 *                       type: integer
 *                       description: "Total de slots de horários disponíveis (6h-23h = 18)"
 *                     slotsOcupados:
 *                       type: integer
 *                       description: Número de slots ocupados hoje
 *                     horarioPico:
 *                       type: object
 *                       properties:
 *                         inicio:
 *                           type: integer
 *                           description: "Hora de início do pico (formato 24h)"
 *                         fim:
 *                           type: integer
 *                           description: "Hora de fim do pico (formato 24h)"
 *                         totalReservas:
 *                           type: integer
 *                           description: Total de reservas no horário de pico
 */
router.get('/dashboard', async (req, res) => {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  // Comandas do mês
  const comandasMes = await prisma.comanda.findMany({
    where: {
      closedAt: {
        gte: inicioMes,
        lte: fimMes
      },
      payment: { not: null }
    }
  });

  const faturamentoComandasMes = comandasMes.reduce((acc, c) => acc + c.totalCents, 0);

  // Lançamentos do mês
  const lancamentosMes = await prisma.lancamento.findMany({
    where: {
      createdAt: {
        gte: inicioMes,
        lte: fimMes
      }
    }
  });

  const faturamentoLancamentosMes = lancamentosMes.reduce((acc, l) => acc + l.totalCents, 0);
  const faturamentoMes = faturamentoComandasMes + faturamentoLancamentosMes;

  // Reservas do mês
  const reservasMes = await prisma.reserva.count({
    where: {
      data: {
        gte: inicioMes,
        lte: fimMes
      },
      status: 'ATIVA'
    }
  });

  // Produtos com estoque baixo
  const estoqueBaixo = await prisma.produto.findMany({
    where: {
      active: true,
      estoque: {
        quantidade: {
          lte: prisma.estoque.fields.minQuantidade
        }
      }
    },
    include: { estoque: true }
  });

  // Reservas de hoje
  const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const hojeFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  const reservasHoje = await prisma.reserva.findMany({
    where: {
      data: {
        gte: hojeInicio,
        lte: hojeFim
      },
      status: 'ATIVA'
    },
    include: {
      cliente: { select: { nomeCompleto: true } },
      quadra: { select: { nome: true } }
    },
    orderBy: { hora: 'asc' }
  });

  // 1. Status das Mesas (Mesas Ocupadas vs Total)
  const totalMesas = await prisma.mesa.count({
    where: { ativa: true }
  });

  const mesasOcupadas = await prisma.mesa.count({
    where: {
      ativa: true,
      clienteId: { not: null }
    }
  });

  // 2. Receita Hoje com Comparação Histórica
  const comandasHoje = await prisma.comanda.findMany({
    where: {
      closedAt: {
        gte: hojeInicio,
        lte: hojeFim
      },
      payment: { not: null }
    }
  });

  const lancamentosHoje = await prisma.lancamento.findMany({
    where: {
      createdAt: {
        gte: hojeInicio,
        lte: hojeFim
      }
    }
  });

  const receitaHoje = comandasHoje.reduce((acc, c) => acc + c.totalCents, 0) + 
                     lancamentosHoje.reduce((acc, l) => acc + l.totalCents, 0);

  // Calcular média dos últimos 30 dias
  const data30DiasAtras = new Date(hoje);
  data30DiasAtras.setDate(hoje.getDate() - 30);

  const comandas30Dias = await prisma.comanda.findMany({
    where: {
      closedAt: {
        gte: data30DiasAtras,
        lte: hojeFim
      },
      payment: { not: null }
    }
  });

  const lancamentos30Dias = await prisma.lancamento.findMany({
    where: {
      createdAt: {
        gte: data30DiasAtras,
        lte: hojeFim
      }
    }
  });

  const receita30Dias = comandas30Dias.reduce((acc, c) => acc + c.totalCents, 0) + 
                       lancamentos30Dias.reduce((acc, l) => acc + l.totalCents, 0);
  
  const mediaDiaria30Dias = receita30Dias / 30;
  const variacao = mediaDiaria30Dias > 0 ? 
    ((receitaHoje - mediaDiaria30Dias) / mediaDiaria30Dias) * 100 : 0;
  
  const variacaoTipo = variacao > 5 ? 'positiva' : variacao < -5 ? 'negativa' : 'neutro';

  // 3. Horários Ocupados
  const todasReservasHoje = await prisma.reserva.findMany({
    where: {
      data: {
        gte: hojeInicio,
        lte: hojeFim
      }
    },
    select: { hora: true }
  });

  // Definir horários de funcionamento (6h às 23h = 18 slots)
  const horariosFuncionamento = Array.from({ length: 18 }, (_, i) => i + 6);
  const slotsOcupados = new Set(todasReservasHoje.map(r => r.hora)).size;
  const percentualOcupacao = Math.round((slotsOcupados / horariosFuncionamento.length) * 100);

  // Identificar horário de pico (intervalo de 3h com mais reservas)
  const reservasPorHora = todasReservasHoje.reduce((acc, r) => {
    acc[r.hora] = (acc[r.hora] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  let maxReservas = 0;
  let horarioPicoInicio = 6;
  let horarioPicoFim = 9;

  // Verificar intervalos de 3 horas
  for (let inicio = 6; inicio <= 20; inicio++) {
    const fim = inicio + 3;
    const totalReservasIntervalo = Array.from({ length: 3 }, (_, i) => inicio + i)
      .reduce((acc, hora) => acc + (reservasPorHora[hora] || 0), 0);
    
    if (totalReservasIntervalo > maxReservas) {
      maxReservas = totalReservasIntervalo;
      horarioPicoInicio = inicio;
      horarioPicoFim = fim;
    }
  }

  res.json({
    mes: {
      faturamentoCents: faturamentoMes,
      comandasCount: comandasMes.length,
      lancamentosCount: lancamentosMes.length,
      reservasCount: reservasMes,
      faturamentoPorTipo: {
        comandas: faturamentoComandasMes,
        lancamentos: faturamentoLancamentosMes
      }
    },
    hoje: {
      reservas: reservasHoje.map(r => ({
        id: r.id,
        quadra: r.quadra.nome,
        hora: r.hora,
        cliente: r.cliente.nomeCompleto,
        precoCents: r.precoCents
      })),
      receitaHoje: {
        totalCents: receitaHoje,
        mediaDiaria30Dias: Math.round(mediaDiaria30Dias),
        variacao: Math.round(variacao),
        variacaoTipo
      }
    },
    alertas: {
      estoqueBaixo: estoqueBaixo.length,
      produtos: estoqueBaixo.map(p => ({
        id: p.id,
        name: p.name,
        quantidade: p.estoque?.quantidade || 0,
        minQuantidade: p.estoque?.minQuantidade || 0
      }))
    },
    statusMesas: {
      mesasOcupadas,
      totalMesas
    },
    horariosOcupados: {
      percentualOcupacao,
      totalSlots: horariosFuncionamento.length,
      slotsOcupados,
      horarioPico: {
        inicio: horarioPicoInicio,
        fim: horarioPicoFim,
        totalReservas: maxReservas
      }
    }
  });
});

/**
 * @swagger
 * /relatorios/reservas:
 *   get:
 *     tags: [Relatórios]
 *     summary: Relatório de reservas por período
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Relatório de reservas
 */
router.get('/reservas', async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  
  if (!dataInicio || !dataFim) {
    return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios' });
  }

  // Converter para string e limpar espaços (pegar primeiro valor se for array)
  const dataInicioStr = Array.isArray(dataInicio) ? String(dataInicio[0]) : String(dataInicio);
  const dataFimStr = Array.isArray(dataFim) ? String(dataFim[0]) : String(dataFim);
  
  const dataInicioLimpa = dataInicioStr.trim();
  const dataFimLimpa = dataFimStr.trim();

  // Validar formato YYYY-MM-DD
  const formatoData = /^\d{4}-\d{2}-\d{2}$/;
  const dataInicioValida = formatoData.test(dataInicioLimpa);
  const dataFimValida = formatoData.test(dataFimLimpa);
  
  if (!dataInicioValida || !dataFimValida) {
    return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
  }

  const inicio = new Date(dataInicioLimpa + 'T00:00:00');
  const fim = new Date(dataFimLimpa + 'T23:59:59');

  // Validar se as datas são válidas
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
  }

  const reservas = await prisma.reserva.findMany({
    where: {
      data: {
        gte: inicio,
        lte: fim
      }
    },
    include: {
      cliente: { select: { nomeCompleto: true, telefone: true } },
      quadra: { select: { nome: true } }
    },
    orderBy: [{ data: 'asc' }, { hora: 'asc' }]
  });

  // Estatísticas por status
  const porStatus = reservas.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Estatísticas por quadra
  const porQuadra = reservas.reduce((acc, r) => {
    const quadra = r.quadra.nome;
    if (!acc[quadra]) {
      acc[quadra] = { total: 0, faturamentoCents: 0 };
    }
    acc[quadra].total += 1;
    if (r.status === 'CONCLUIDA') {
      acc[quadra].faturamentoCents += r.precoCents;
    }
    return acc;
  }, {} as Record<string, { total: number; faturamentoCents: number }>);

  // Estatísticas por horário
  const porHorario = reservas.reduce((acc, r) => {
    acc[r.hora] = (acc[r.hora] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Faturamento total (apenas reservas concluídas)
  const faturamentoTotal = reservas
    .filter(r => r.status === 'CONCLUIDA')
    .reduce((acc, r) => acc + r.precoCents, 0);

  // Verificar se há reservas no período
  if (reservas.length === 0) {
    return res.json({
      periodo: { dataInicio: dataInicioLimpa, dataFim: dataFimLimpa },
      message: 'Não existem reservas neste período',
      total: 0,
      porStatus: {},
      porQuadra: {},
      porHorario: {},
      faturamentoTotal: 0,
      reservas: []
    });
  }

  res.json({
    periodo: { dataInicio: dataInicioLimpa, dataFim: dataFimLimpa },
    total: reservas.length,
    porStatus,
    porQuadra,
    porHorario,
    faturamentoTotal,
    reservas: reservas.map(r => ({
      id: r.id,
      data: r.data,
      hora: r.hora,
      precoCents: r.precoCents,
      status: r.status,
      cliente: r.cliente.nomeCompleto,
      quadra: r.quadra.nome
    }))
  });
});

/**
 * @swagger
 * /relatorios/clientes:
 *   get:
 *     tags: [Relatórios]
 *     summary: Relatório de clientes
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataFim
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Relatório de clientes
 */
router.get('/clientes', async (req, res) => {
  const { dataInicio, dataFim } = req.query as { dataInicio?: string; dataFim?: string };

  const where: any = {};
  if (dataInicio && dataFim) {
    // Converter para string e limpar espaços
    const dataInicioStr = String(dataInicio).trim();
    const dataFimStr = String(dataFim).trim();

    // Validar formato YYYY-MM-DD
    const formatoData = /^\d{4}-\d{2}-\d{2}$/;
    if (!formatoData.test(dataInicioStr) || !formatoData.test(dataFimStr)) {
      return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    const inicio = new Date(dataInicioStr + 'T00:00:00');
    const fim = new Date(dataFimStr + 'T23:59:59');

    // Validar se as datas são válidas
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    where.createdAt = {
      gte: inicio,
      lte: fim
    };
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      _count: {
        select: {
          comandas: true,
          reservas: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Clientes mais ativos (mais comandas)
  const clientesMaisAtivos = clientes
    .sort((a, b) => b._count.comandas - a._count.comandas)
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      nomeCompleto: c.nomeCompleto,
      telefone: c.telefone,
      totalComandas: c._count.comandas,
      totalReservas: c._count.reservas
    }));

  // Clientes com mais reservas
  const clientesMaisReservas = clientes
    .sort((a, b) => b._count.reservas - a._count.reservas)
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      nomeCompleto: c.nomeCompleto,
      telefone: c.telefone,
      totalComandas: c._count.comandas,
      totalReservas: c._count.reservas
    }));

  res.json({
    periodo: dataInicio && dataFim ? { dataInicio, dataFim } : null,
    total: clientes.length,
    clientesMaisAtivos,
    clientesMaisReservas,
    estatisticas: {
      totalComandas: clientes.reduce((acc, c) => acc + c._count.comandas, 0),
      totalReservas: clientes.reduce((acc, c) => acc + c._count.reservas, 0)
    }
  });
});

/**
 * @swagger
 * /relatorios/estoque:
 *   get:
 *     tags: [Relatórios]
 *     summary: Relatório de estoque
 *     responses:
 *       200:
 *         description: Relatório de estoque
 */
router.get('/estoque', async (req, res) => {
  const produtos = await prisma.produto.findMany({
    where: { active: true },
    include: { estoque: true },
    orderBy: { name: 'asc' }
  });

  const estoqueBaixo = produtos.filter(p => 
    p.estoque && p.estoque.quantidade <= p.estoque.minQuantidade
  );

  const semEstoque = produtos.filter(p => 
    p.estoque && p.estoque.quantidade === 0
  );

  const valorTotalEstoque = produtos.reduce((acc, p) => {
    if (p.estoque) {
      return acc + (p.estoque.quantidade * p.priceCents);
    }
    return acc;
  }, 0);

  res.json({
    totalProdutos: produtos.length,
    estoqueBaixo: estoqueBaixo.length,
    semEstoque: semEstoque.length,
    valorTotalEstoque,
    produtos: produtos.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      priceCents: p.priceCents,
      quantidade: p.estoque?.quantidade || 0,
      minQuantidade: p.estoque?.minQuantidade || 0,
      status: p.estoque ? 
        (p.estoque.quantidade === 0 ? 'SEM_ESTOQUE' : 
         p.estoque.quantidade <= p.estoque.minQuantidade ? 'ESTOQUE_BAIXO' : 'NORMAL') : 
        'SEM_CONTROLE'
    }))
  });
});

export default router;
