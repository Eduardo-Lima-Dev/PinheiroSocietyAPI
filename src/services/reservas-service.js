import { prisma } from '../lib/prisma.js';

/**
 * Serviço para processar reservas vencidas automaticamente
 */

export async function processarReservasVencidas() {
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
        mensagem: 'Nenhuma reserva vencida encontrada'
      };
    }

    console.log(`📋 Encontradas ${reservasVencidas.length} reservas vencidas:`);
    
    // Listar reservas que serão processadas
    reservasVencidas.forEach(reserva => {
      const dataFormatada = reserva.data.toLocaleDateString('pt-BR');
      console.log(`  - ID ${reserva.id}: ${reserva.cliente.nomeCompleto} - ${reserva.quadra.nome} - ${dataFormatada} às ${reserva.hora}h`);
    });

    // Atualizar status para CONCLUÍDA
    const resultado = await prisma.reserva.updateMany({
      where: {
        id: { in: reservasVencidas.map(r => r.id) }
      },
      data: { 
        status: 'CONCLUIDA',
        observacoes: reservasVencidas.map(r => 
          r.observacoes ? 
          `${r.observacoes} | Marcada automaticamente como concluída após vencimento` :
          'Marcada automaticamente como concluída após vencimento'
        )[0] || 'Marcada automaticamente como concluída após vencimento'
      }
    });

    console.log(`✅ ${resultado.count} reservas marcadas como CONCLUÍDA automaticamente.`);
    
    // Log detalhado
    console.log('\n📊 Resumo do processamento:');
    console.log(`  - Total de reservas processadas: ${resultado.count}`);
    console.log(`  - Data de referência: ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`  - Status aplicado: CONCLUÍDA`);
    
    return {
      processadas: resultado.count,
      reservas: reservasVencidas.map(r => ({
        id: r.id,
        cliente: r.cliente.nomeCompleto,
        quadra: r.quadra.nome,
        data: r.data.toLocaleDateString('pt-BR'),
        hora: r.hora
      })),
      mensagem: `${resultado.count} reservas processadas com sucesso`
    };
    
  } catch (error) {
    console.error('❌ Erro ao processar reservas vencidas:', error);
    throw error;
  }
}

/**
 * Verifica quantas reservas estão vencidas (sem processar)
 */
export async function verificarReservasVencidas() {
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
