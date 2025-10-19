import { prisma } from '../lib/prisma.js';

interface ReservaProcessada {
  id: number;
  cliente: string;
  quadra: string;
  data: string;
  hora: number;
  precoCents?: number;
}

interface ResultadoProcessamento {
  processadas: number;
  reservas: ReservaProcessada[];
  mensagem: string;
}

interface ResultadoVerificacao {
  quantidade: number;
  reservas: ReservaProcessada[];
}

/**
 * Serviço para processar reservas vencidas automaticamente
 */

export async function processarReservasVencidas(): Promise<ResultadoProcessamento> {
  try {
    console.log('🔄 Iniciando processamento de reservas vencidas...');
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Buscar reservas ativas que passaram da data
    const reservasVencidas = await prisma.reserva.findMany({
      where: {
        status: 'ATIVA',
        data: { lt: hoje }
      },
      include: {
        cliente: { select: { nomeCompleto: true } },
        quadra: { select: { nome: true } }
      }
    });

    if (reservasVencidas.length === 0) {
      console.log('✅ Nenhuma reserva vencida encontrada.');
      return {
        processadas: 0,
        reservas: [],
        mensagem: 'Nenhuma reserva vencida encontrada'
      };
    }

    console.log(`📋 Encontradas ${reservasVencidas.length} reservas vencidas:`);
    
    // Listar reservas que serão processadas
    reservasVencidas.forEach(reserva => {
      const dataFormatada = reserva.data.toLocaleDateString('pt-BR');
      console.log(`  - ID ${reserva.id}: ${reserva.cliente.nomeCompleto} - ${reserva.quadra.nome} - ${dataFormatada} às ${reserva.hora}h`);
    });

    // Atualizar cada reserva individualmente para manter observações
    const reservasProcessadas: ReservaProcessada[] = [];
    
    for (const reserva of reservasVencidas) {
      const observacaoAtualizada = reserva.observacoes 
        ? `${reserva.observacoes} | Marcada automaticamente como concluída após vencimento`
        : 'Marcada automaticamente como concluída após vencimento';

      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { 
          status: 'CONCLUIDA',
          observacoes: observacaoAtualizada
        }
      });

      reservasProcessadas.push({
        id: reserva.id,
        cliente: reserva.cliente.nomeCompleto,
        quadra: reserva.quadra.nome,
        data: reserva.data.toLocaleDateString('pt-BR'),
        hora: reserva.hora
      });
    }

    console.log(`✅ ${reservasProcessadas.length} reservas marcadas como CONCLUÍDA automaticamente.`);
    
    // Log detalhado
    console.log('\n📊 Resumo do processamento:');
    console.log(`  - Total de reservas processadas: ${reservasProcessadas.length}`);
    console.log(`  - Data de referência: ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`  - Status aplicado: CONCLUÍDA`);
    
    return {
      processadas: reservasProcessadas.length,
      reservas: reservasProcessadas,
      mensagem: `${reservasProcessadas.length} reservas processadas com sucesso`
    };
    
  } catch (error) {
    console.error('❌ Erro ao processar reservas vencidas:', error);
    throw error;
  }
}

/**
 * Verifica quantas reservas estão vencidas (sem processar)
 */
export async function verificarReservasVencidas(): Promise<ResultadoVerificacao> {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const reservasVencidas = await prisma.reserva.findMany({
      where: {
        status: 'ATIVA',
        data: { lt: hoje }
      },
      include: {
        cliente: { select: { nomeCompleto: true } },
        quadra: { select: { nome: true } }
      }
    });

    return {
      quantidade: reservasVencidas.length,
      reservas: reservasVencidas.map(r => ({
        id: r.id,
        cliente: r.cliente.nomeCompleto,
        quadra: r.quadra.nome,
        data: r.data.toLocaleDateString('pt-BR'),
        hora: r.hora,
        precoCents: r.precoCents
      }))
    };
    
  } catch (error) {
    console.error('❌ Erro ao verificar reservas vencidas:', error);
    throw error;
  }
}
