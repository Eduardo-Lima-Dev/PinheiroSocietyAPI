import cron from 'node-cron';
import { processarReservasVencidas } from '../services/reservas-service.js';

/**
 * Job automático para processar reservas vencidas
 * Executa diariamente às 02:00 da manhã
 */

class ReservasJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Inicia o job automático
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Job de reservas já está em execução');
      return;
    }

    // Executa todos os dias às 02:00 da manhã
    this.job = cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Executando job automático de reservas vencidas...');
      try {
        await processarReservasVencidas();
        console.log('✅ Job de reservas concluído com sucesso');
      } catch (error) {
        console.error('❌ Erro no job de reservas:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.job.start();
    this.isRunning = true;
    
    console.log('🚀 Job automático de reservas iniciado (execução diária às 02:00)');
  }

  /**
   * Para o job automático
   */
  stop() {
    if (this.job && this.isRunning) {
      this.job.stop();
      this.isRunning = false;
      console.log('⏹️ Job automático de reservas parado');
    }
  }

  /**
   * Executa o processamento manualmente (para testes)
   */
  async runManual() {
    console.log('🔧 Executando processamento manual de reservas vencidas...');
    try {
      await processarReservasVencidas();
      console.log('✅ Processamento manual concluído');
    } catch (error) {
      console.error('❌ Erro no processamento manual:', error);
      throw error;
    }
  }

  /**
   * Verifica se o job está rodando
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: '0 2 * * *',
      timezone: 'America/Sao_Paulo',
      description: 'Processamento diário de reservas vencidas às 02:00'
    };
  }
}

// Instância única do job
const reservasJob = new ReservasJob();

export default reservasJob;
