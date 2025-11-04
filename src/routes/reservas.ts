import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gestão de reservas de quadras
 */

/**
 * @swagger
 * /reservas:
 *   get:
 *     tags: [Reservas]
 *     summary: Lista reservas
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ATIVA, CANCELADA, CONCLUIDA]
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
 *       - in: query
 *         name: recorrente
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filtrar por reservas recorrentes
 *       - in: query
 *         name: apenasPais
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Retornar apenas reservas pai (sem reservas filhas de recorrência)
 *     responses:
 *       200:
 *         description: Lista de reservas
 */
router.get('/', async (req, res) => {
  const { status, dataInicio, dataFim, recorrente, apenasPais } = req.query;

  const where: any = {};

  if (status) {
    const statusStr = Array.isArray(status) ? String(status[0]) : String(status);
    where.status = statusStr;
  }

  if (dataInicio || dataFim) {
    where.data = {};
    if (dataInicio) {
      const dataInicioStr = Array.isArray(dataInicio) ? String(dataInicio[0]) : String(dataInicio);
      const dataInicioLimpa = dataInicioStr.trim();
      
      // Validar formato YYYY-MM-DD
      const formatoData = /^\d{4}-\d{2}-\d{2}$/;
      if (!formatoData.test(dataInicioLimpa)) {
        return res.status(400).json({ message: 'Formato de dataInicio inválido. Use YYYY-MM-DD' });
      }
      
      const inicio = new Date(dataInicioLimpa + 'T00:00:00');
      if (isNaN(inicio.getTime())) {
        return res.status(400).json({ message: 'Formato de dataInicio inválido. Use YYYY-MM-DD' });
      }
      
      where.data.gte = inicio;
    }
    if (dataFim) {
      const dataFimStr = Array.isArray(dataFim) ? String(dataFim[0]) : String(dataFim);
      const dataFimLimpa = dataFimStr.trim();
      
      // Validar formato YYYY-MM-DD
      const formatoData = /^\d{4}-\d{2}-\d{2}$/;
      if (!formatoData.test(dataFimLimpa)) {
        return res.status(400).json({ message: 'Formato de dataFim inválido. Use YYYY-MM-DD' });
      }
      
      const fim = new Date(dataFimLimpa + 'T23:59:59');
      if (isNaN(fim.getTime())) {
        return res.status(400).json({ message: 'Formato de dataFim inválido. Use YYYY-MM-DD' });
      }
      
      where.data.lte = fim;
    }
  }

  // Filtros para recorrência
  if (recorrente !== undefined) {
    const recorrenteBool = recorrente === 'true';
    where.recorrente = recorrenteBool;
  }

  if (apenasPais === 'true') {
    where.reservaPaiId = null;
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      },
      reservaPai: {
        select: { id: true, data: true, hora: true }
      },
      reservasFilhas: {
        select: { id: true, data: true, hora: true, status: true }
      }
    },
    orderBy: [{ data: 'asc' }, { hora: 'asc' }]
  });

  res.json(reservas);
});

/**
 * @swagger
 * /reservas/{id}:
 *   get:
 *     tags: [Reservas]
 *     summary: Obtém uma reserva por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *       404:
 *         description: Reserva não encontrada
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true,
          nomeCompleto: true,
          cpf: true,
          email: true,
          telefone: true,
          tipo: true,
          createdAt: true,
          updatedAt: true
        }
      },
      quadra: true
    }
  });

  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  res.json(reserva);
});

/**
 * @swagger
 * /reservas:
 *   post:
 *     tags: [Reservas]
 *     summary: Cria uma nova reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clienteId, quadraId, data, hora]
 *             properties:
 *               clienteId:
 *                 type: integer
 *               quadraId:
 *                 type: integer
 *               data:
 *                 type: string
 *                 format: date
 *               hora:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 23
 *               duracaoMinutos:
 *                 type: integer
 *                 enum: [60, 90, 120]
 *                 default: 60
 *                 description: Duração da reserva em minutos
 *               observacoes:
 *                 type: string
 *               recorrente:
 *                 type: boolean
 *                 default: false
 *                 description: Se true, cria reservas recorrentes
 *               diaSemana:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *                 description: Dia da semana para recorrência (0=domingo, 1=segunda, ..., 6=sábado)
 *               dataFimRecorrencia:
 *                 type: string
 *                 format: date
 *                 description: Data limite para a recorrência (máximo 12 meses)
 *               payment:
 *                 type: string
 *                 enum: [CASH, PIX, CARD]
 *                 description: Método de pagamento
 *               percentualPago:
 *                 type: integer
 *                 enum: [0, 50, 100]
 *                 default: 0
 *                 description: Percentual pago (0, 50 ou 100)
 *     responses:
 *       201:
 *         description: Reserva(s) criada(s)
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Conflito de horário
 */
router.post('/', async (req, res) => {
  const { clienteId, quadraId, data, hora, duracaoMinutos, observacoes, recorrente, diaSemana, dataFimRecorrencia, payment, percentualPago } = req.body as {
    clienteId: number;
    quadraId: number;
    data: string;
    hora: number;
    duracaoMinutos?: number;
    observacoes?: string;
    recorrente?: boolean;
    diaSemana?: number;
    dataFimRecorrencia?: string;
    payment?: 'CASH' | 'PIX' | 'CARD';
    percentualPago?: number;
  };

  // Validações
  if (hora < 8 || hora > 23) {
    return res.status(400).json({ message: 'Hora deve estar entre 8 e 23' });
  }

  // Validações para recorrência
  if (recorrente) {
    if (diaSemana === undefined || diaSemana < 0 || diaSemana > 6) {
      return res.status(400).json({ message: 'diaSemana é obrigatório para reservas recorrentes (0=domingo, 1=segunda, ..., 6=sábado)' });
    }
    if (!dataFimRecorrencia) {
      return res.status(400).json({ message: 'dataFimRecorrencia é obrigatória para reservas recorrentes' });
    }
  }

  const dataReserva = new Date(data + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (dataReserva < hoje) {
    return res.status(400).json({ message: 'Não é possível agendar para datas passadas' });
  }

  // Validar data fim de recorrência (máximo 12 meses)
  if (recorrente && dataFimRecorrencia) {
    const dataFim = new Date(dataFimRecorrencia + 'T23:59:59');
    const dataMaxima = new Date(dataReserva);
    dataMaxima.setMonth(dataMaxima.getMonth() + 12);

    if (dataFim > dataMaxima) {
      return res.status(400).json({ message: 'A data fim da recorrência não pode ser superior a 12 meses da data inicial' });
    }

    if (dataFim <= dataReserva) {
      return res.status(400).json({ message: 'A data fim da recorrência deve ser posterior à data inicial' });
    }
  }

  // Verificar se cliente e quadra existem
  const [cliente, quadra] = await Promise.all([
    prisma.cliente.findUnique({ where: { id: clienteId } }),
    prisma.quadra.findUnique({ where: { id: quadraId } })
  ]);

  if (!cliente) {
    return res.status(400).json({ message: 'Cliente não encontrado' });
  }

  if (!quadra || !quadra.ativa) {
    return res.status(400).json({ message: 'Quadra não encontrada ou inativa' });
  }

  // Duração: permitir 60, 90, 120 (padrão 60)
  const duracao = [60, 90, 120].includes(duracaoMinutos ?? 60) ? (duracaoMinutos ?? 60) : 60;

  // Calcular preço baseado no horário e multiplicador pela duração
  const precoBaseCents = hora < 17 ? 10000 : 11000; // 100 reais até 17h, 110 após
  const multiplicador = duracao === 60 ? 1 : duracao === 90 ? 1.5 : 2;
  const precoCents = Math.round(precoBaseCents * multiplicador);

  // Validar e processar pagamento
  let valorPagoCents = 0;
  let statusPagamento: 'PENDENTE' | 'PARCIAL' | 'TOTAL' = 'PENDENTE';
  
  if (payment && percentualPago !== undefined) {
    if (!['CASH', 'PIX', 'CARD'].includes(payment)) {
      return res.status(400).json({ message: 'Método de pagamento inválido. Use CASH, PIX ou CARD' });
    }
    
    if (![0, 50, 100].includes(percentualPago)) {
      return res.status(400).json({ message: 'Percentual pago deve ser 0, 50 ou 100' });
    }
    
    valorPagoCents = Math.round((precoCents * percentualPago) / 100);
    
    if (percentualPago === 100) {
      statusPagamento = 'TOTAL';
    } else if (percentualPago === 50) {
      statusPagamento = 'PARCIAL';
    }
  }

  // Verificação de conflito considerando duração (bloqueia horas seguintes)
  const horasOcupadas = Array.from({ length: Math.ceil(duracao / 60) }, (_, i) => hora + i);
  const conflitoExistente = await prisma.reserva.findFirst({
    where: {
      quadraId,
      data: dataReserva,
      hora: { in: horasOcupadas },
      status: 'ATIVA'
    }
  });

  if (conflitoExistente) {
    return res.status(409).json({ message: 'Horário já está ocupado em parte do período solicitado' });
  }

  // Função para gerar datas de recorrência
  const gerarDatasRecorrencia = (dataInicio: Date, diaSemana: number, dataFim: Date): Date[] => {
    const datas: Date[] = [];
    const dataAtual = new Date(dataInicio);
    
    // Encontrar o primeiro dia da semana correspondente
    while (dataAtual.getDay() !== diaSemana && dataAtual <= dataFim) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Adicionar todas as datas da recorrência
    while (dataAtual <= dataFim) {
      datas.push(new Date(dataAtual));
      dataAtual.setDate(dataAtual.getDate() + 7); // Próxima semana
    }
    
    return datas;
  };

  if (recorrente && diaSemana !== undefined && dataFimRecorrencia) {
    // Criar reservas recorrentes
    const dataFim = new Date(dataFimRecorrencia + 'T23:59:59');
    const datasRecorrencia = gerarDatasRecorrencia(dataReserva, diaSemana, dataFim);
    
    if (datasRecorrencia.length === 0) {
      return res.status(400).json({ message: 'Nenhuma data de recorrência encontrada para o período especificado' });
    }

    // Verificar conflitos para todas as datas
    const conflitos = await prisma.reserva.findMany({
      where: {
        quadraId,
        data: { in: datasRecorrencia },
        hora: { in: horasOcupadas },
        status: 'ATIVA'
      },
      select: { data: true }
    });

    if (conflitos.length > 0) {
      const datasConflito = conflitos.map(c => c.data.toISOString().split('T')[0]);
      return res.status(409).json({ 
        message: `Conflito de horário nas seguintes datas: ${datasConflito.join(', ')}` 
      });
    }

    // Criar reserva pai (primeira reserva)
    const reservaPai = await prisma.reserva.create({
      data: {
        clienteId,
        quadraId,
        data: dataReserva,
        hora,
        precoCents,
        duracaoMinutos: duracao,
        observacoes: observacoes || null,
        recorrente: true,
        diaSemana,
        dataFimRecorrencia: dataFim,
        payment: payment || null,
        valorPagoCents,
        percentualPago: percentualPago || 0,
        statusPagamento
      },
      include: {
        cliente: {
          select: { id: true, nomeCompleto: true, telefone: true }
        },
        quadra: {
          select: { id: true, nome: true }
        }
      }
    });

    // Criar reservas filhas (demais datas)
    const reservasFilhas = await Promise.all(
      datasRecorrencia.slice(1).map(data => 
        prisma.reserva.create({
          data: {
            clienteId,
            quadraId,
            data,
            hora,
            precoCents,
            duracaoMinutos: duracao,
            observacoes: observacoes || null,
            recorrente: false,
            reservaPaiId: reservaPai.id,
            payment: payment || null,
            valorPagoCents,
            percentualPago: percentualPago || 0,
            statusPagamento
          }
        })
      )
    );

    res.status(201).json({
      reservaPai,
      reservasCriadas: reservasFilhas.length + 1,
      totalReservas: reservasFilhas.length + 1,
      message: `Reserva recorrente criada com sucesso. ${reservasFilhas.length + 1} reservas criadas.`
    });

  } else {
    // Criar reserva única (lógica original)
    // Conflito único (não recorrente) já verificado acima com horasOcupadas

    const reserva = await prisma.reserva.create({
      data: {
        clienteId,
        quadraId,
        data: dataReserva,
        hora,
        precoCents,
        duracaoMinutos: duracao,
        observacoes: observacoes || null,
        recorrente: false,
        payment: payment || null,
        valorPagoCents,
        percentualPago: percentualPago || 0,
        statusPagamento
      },
      include: {
        cliente: {
          select: { id: true, nomeCompleto: true, telefone: true }
        },
        quadra: {
          select: { id: true, nome: true }
        }
      }
    });

    res.status(201).json(reserva);
  }
});

/**
 * @swagger
 * /reservas/{id}/reagendar:
 *   put:
 *     tags: [Reservas]
 *     summary: Reagenda uma reserva
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [novaData, novaHora]
 *             properties:
 *               novaData:
 *                 type: string
 *                 format: date
 *               novaHora:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 23
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva reagendada
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Reserva não encontrada
 *       409:
 *         description: Conflito de horário
 */
router.put('/:id/reagendar', async (req, res) => {
  const id = Number(req.params.id);
  const { novaData, novaHora, observacoes } = req.body as {
    novaData: string;
    novaHora: number;
    observacoes?: string;
  };

  // Validações
  if (novaHora < 8 || novaHora > 23) {
    return res.status(400).json({ message: 'Hora deve estar entre 8 e 23' });
  }

  const novaDataReserva = new Date(novaData + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (novaDataReserva < hoje) {
    return res.status(400).json({ message: 'Não é possível reagendar para datas passadas' });
  }

  // Verificar se reserva existe e está ativa
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { quadra: true }
  });

  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (reserva.status !== 'ATIVA') {
    return res.status(400).json({ message: 'Apenas reservas ativas podem ser reagendadas' });
  }

  // Verificar conflito de horário (excluindo a própria reserva)
  const conflito = await prisma.reserva.findFirst({
    where: {
      quadraId: reserva.quadraId,
      data: novaDataReserva,
      hora: novaHora,
      status: 'ATIVA',
      id: { not: id }
    }
  });

  if (conflito) {
    return res.status(409).json({ message: 'Novo horário já está ocupado' });
  }

  // Calcular novo preço baseado no horário
  const novoPrecoCents = novaHora < 17 ? 10000 : 11000;

  const reservaAtualizada = await prisma.reserva.update({
    where: { id },
    data: {
      data: novaDataReserva,
      hora: novaHora,
      precoCents: novoPrecoCents,
      observacoes: observacoes || reserva.observacoes
    },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.json(reservaAtualizada);
});

/**
 * @swagger
 * /reservas/{id}/cancelar:
 *   put:
 *     tags: [Reservas]
 *     summary: Cancela uma reserva
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       404:
 *         description: Reserva não encontrada
 *       400:
 *         description: Reserva já cancelada ou concluída
 */
router.put('/:id/cancelar', async (req, res) => {
  const id = Number(req.params.id);

  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (reserva.status !== 'ATIVA') {
    return res.status(400).json({ message: 'Apenas reservas ativas podem ser canceladas' });
  }

  const reservaCancelada = await prisma.reserva.update({
    where: { id },
    data: { status: 'CANCELADA' },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.json(reservaCancelada);
});

/**
 * @swagger
 * /reservas/{id}/concluir:
 *   put:
 *     tags: [Reservas]
 *     summary: Marca uma reserva como concluída
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva concluída
 *       404:
 *         description: Reserva não encontrada
 *       400:
 *         description: Reserva não está ativa
 */
router.put('/:id/concluir', async (req, res) => {
  const id = Number(req.params.id);

  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (reserva.status !== 'ATIVA') {
    return res.status(400).json({ message: 'Apenas reservas ativas podem ser concluídas' });
  }

  const reservaConcluida = await prisma.reserva.update({
    where: { id },
    data: { status: 'CONCLUIDA' },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.json(reservaConcluida);
});

/**
 * @swagger
 * /reservas/{id}/cancelar-recorencia:
 *   put:
 *     tags: [Reservas]
 *     summary: Cancela todas as reservas de uma recorrência
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da reserva pai da recorrência
 *     responses:
 *       200:
 *         description: Recorrência cancelada com sucesso
 *       404:
 *         description: Reserva não encontrada
 *       400:
 *         description: Reserva não é uma recorrência
 */
router.put('/:id/cancelar-recorencia', async (req, res) => {
  const id = Number(req.params.id);

  // Verificar se a reserva existe e é uma recorrência
  const reservaPai = await prisma.reserva.findUnique({
    where: { id },
    include: {
      reservasFilhas: true
    }
  });

  if (!reservaPai) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (!reservaPai.recorrente) {
    return res.status(400).json({ message: 'Esta reserva não é uma recorrência' });
  }

  // Cancelar reserva pai
  await prisma.reserva.update({
    where: { id },
    data: { status: 'CANCELADA' }
  });

  // Cancelar todas as reservas filhas ativas
  const reservasFilhasIds = reservaPai.reservasFilhas
    .filter(filha => filha.status === 'ATIVA')
    .map(filha => filha.id);

  if (reservasFilhasIds.length > 0) {
    await prisma.reserva.updateMany({
      where: {
        id: { in: reservasFilhasIds }
      },
      data: { status: 'CANCELADA' }
    });
  }

  res.json({
    message: `Recorrência cancelada com sucesso. ${reservasFilhasIds.length + 1} reservas canceladas.`,
    reservasCanceladas: reservasFilhasIds.length + 1
  });
});

export default router;
