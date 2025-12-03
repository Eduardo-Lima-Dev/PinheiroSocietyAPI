import 'dotenv/config';

console.log('🔍 Verificando variáveis de ambiente SMTP...\n');

const requiredVars = {
  'SMTP_USER': process.env.SMTP_USER,
  'SMTP_PASS': process.env.SMTP_PASS,
  'SMTP_HOST': process.env.SMTP_HOST || 'smtp.gmail.com (padrão)',
  'SMTP_PORT': process.env.SMTP_PORT || '587 (padrão)',
};

let allOk = true;

for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    if (key === 'SMTP_PASS') {
      console.log(`✅ ${key}: ${'*'.repeat(value.length)} (${value.length} caracteres)`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NÃO DEFINIDO`);
    allOk = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allOk) {
  console.log('✅ Todas as variáveis SMTP estão configuradas!');
} else {
  console.log('❌ Algumas variáveis estão faltando!');
  console.log('\n📝 Adicione ao seu arquivo .env:');
  console.log('   SMTP_USER="autenticacaoc@gmail.com"');
  console.log('   SMTP_PASS="sua-senha-de-app-do-gmail"');
  console.log('   SMTP_HOST="smtp.gmail.com" (opcional)');
  console.log('   SMTP_PORT="587" (opcional)');
  console.log('\n💡 Para obter a senha de app do Gmail:');
  console.log('   https://myaccount.google.com/apppasswords');
}

