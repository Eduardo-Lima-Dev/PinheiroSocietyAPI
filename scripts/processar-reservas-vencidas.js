#!/usr/bin/env node

/**
 * Script para processar reservas vencidas automaticamente
 * Marca reservas ativas que passaram da data como CONCLUÍDA
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function processarReservasVencidas() {
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
      return;
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
        observacoes: 'Marcada automaticamente como concluída após vencimento'
      }
    });

    console.log(`✅ ${resultado.count} reservas marcadas como CONCLUÍDA automaticamente.`);
    
    // Log detalhado
    console.log('\n📊 Resumo do processamento:');
    console.log(`  - Total de reservas processadas: ${resultado.count}`);
    console.log(`  - Data de referência: ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`  - Status aplicado: CONCLUÍDA`);
    
  } catch (error) {
    console.error('❌ Erro ao processar reservas vencidas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
processarReservasVencidas()
  .then(() => {
    console.log('🎉 Processamento concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
