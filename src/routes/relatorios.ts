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
  const { dataInicio, dataFim } = req.query as { dataInicio: string; dataFim: string };
  
  if (!dataInicio || !dataFim) {
    return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios' });
  }

  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');

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
      user: { select: { name: true } }
    }
  });

  const totalComandas = comandas.reduce((acc, c) => acc + c.totalCents, 0);
  const totalComandasCount = comandas.length;

  // Faturamento por forma de pagamento
  const faturamentoPorPagamento = comandas.reduce((acc, c) => {
    const payment = c.payment || 'SEM_PAGAMENTO';
    acc[payment] = (acc[payment] || 0) + c.totalCents;
    return acc;
  }, {} as Record<string, number>);

  // Produtos mais vendidos
  const produtosVendidos = comandas.flatMap(c => c.items);
  const produtosAgrupados = produtosVendidos.reduce((acc, item) => {
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

  res.json({
    periodo: { dataInicio, dataFim },
    comandas: {
      totalCents: totalComandas,
      totalCount: totalComandasCount,
      faturamentoPorPagamento
    },
    produtosMaisVendidos
  });
});

/**
 * @swagger
 * /relatorios/rachas:
 *   get:
 *     tags: [Relatórios]
 *     summary: Relatório de rachas por período
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
 *         description: Relatório de rachas
 */
router.get('/rachas', async (req, res) => {
  const { dataInicio, dataFim } = req.query as { dataInicio: string; dataFim: string };
  
  if (!dataInicio || !dataFim) {
    return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios' });
  }

  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');

  const rachas = await prisma.racha.findMany({
    where: {
      date: {
        gte: inicio,
        lte: fim
      },
      scheduled: true
    },
    orderBy: [{ date: 'asc' }, { hour: 'asc' }]
  });

  // Estatísticas por campo
  const rachasPorCampo = rachas.reduce((acc, r) => {
    acc[r.field] = (acc[r.field] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Estatísticas por horário
  const rachasPorHorario = rachas.reduce((acc, r) => {
    acc[r.hour] = (acc[r.hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Rachas recorrentes vs únicos
  const recorrentes = rachas.filter(r => r.recorrente).length;
  const unicos = rachas.filter(r => !r.recorrente).length;

  res.json({
    periodo: { dataInicio, dataFim },
    total: rachas.length,
    porCampo: rachasPorCampo,
    porHorario: rachasPorHorario,
    recorrentes,
    unicos,
    rachas: rachas.map(r => ({
      id: r.id,
      field: r.field,
      date: r.date,
      hour: r.hour,
      userName: r.userName,
      recorrente: r.recorrente
    }))
  });
});

/**
 * @swagger
 * /relatorios/dashboard:
 *   get:
 *     tags: [Relatórios]
 *     summary: Dashboard com resumo geral
 *     responses:
 *       200:
 *         description: Dashboard com resumo
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

  const faturamentoMes = comandasMes.reduce((acc, c) => acc + c.totalCents, 0);

  // Rachas do mês
  const rachasMes = await prisma.racha.count({
    where: {
      date: {
        gte: inicioMes,
        lte: fimMes
      },
      scheduled: true
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

  // Rachas de hoje
  const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const hojeFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  const rachasHoje = await prisma.racha.findMany({
    where: {
      date: {
        gte: hojeInicio,
        lte: hojeFim
      },
      scheduled: true
    },
    orderBy: { hour: 'asc' }
  });

  res.json({
    mes: {
      faturamentoCents: faturamentoMes,
      comandasCount: comandasMes.length,
      rachasCount: rachasMes
    },
    hoje: {
      rachas: rachasHoje.map(r => ({
        id: r.id,
        field: r.field,
        hour: r.hour,
        userName: r.userName
      }))
    },
    alertas: {
      estoqueBaixo: estoqueBaixo.length,
      produtos: estoqueBaixo.map(p => ({
        id: p.id,
        name: p.name,
        quantidade: p.estoque?.quantidade || 0,
        minQuantidade: p.estoque?.minQuantidade || 0
      }))
    }
  });
});

export default router;
