import nodemailer from 'nodemailer';

const isDevelopment = process.env.NODE_ENV !== 'production';
const DEV_EMAIL_REDIRECT = 'limaduduh34@gmail.com';

const createTransporter = () => {
  const smtpUser = process.env.SMTP_USER?.trim();
  // Remove espaços da senha (Gmail gera senhas de app com espaços que precisam ser removidos)
  const smtpPass = process.env.SMTP_PASS?.trim().replace(/\s/g, '');

  if (!smtpUser || !smtpPass) {
    const missing = [];
    if (!smtpUser) missing.push('SMTP_USER');
    if (!smtpPass) missing.push('SMTP_PASS');
    
    console.error('❌ Variáveis de ambiente faltando:', missing.join(', '));
    console.error('📝 Verifique se o arquivo .env contém:');
    console.error('   SMTP_USER="autenticacaoc@gmail.com"');
    console.error('   SMTP_PASS="sua-senha-de-app"');
    
    throw new Error(
      `Credenciais SMTP não configuradas. Variáveis faltando: ${missing.join(', ')}. Verifique o arquivo .env`
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const getEmailDestination = (originalEmail: string): string => {
  // Em desenvolvimento, redireciona todos os emails para o email de teste
  if (isDevelopment) {
    return DEV_EMAIL_REDIRECT;
  }
  return originalEmail;
};

export const sendPasswordResetEmail = async (email: string, resetCode: string) => {
  // Validar credenciais antes de criar o transporter
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Credenciais SMTP não configuradas. Verifique SMTP_USER e SMTP_PASS no arquivo .env');
  }

  const transporter = createTransporter();
  
  const destinationEmail = getEmailDestination(email);
  const isRedirected = isDevelopment && destinationEmail !== email;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destinationEmail,
    subject: 'Recuperação de Senha - Pinheiro Society',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .code-container {
              background-color: #ffffff;
              border: 2px solid #4CAF50;
              border-radius: 10px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #4CAF50;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperação de Senha</h1>
            </div>
            <div class="content">
              ${isRedirected ? `
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ MODO DESENVOLVIMENTO:</strong></p>
                <p style="margin: 5px 0 0 0; color: #856404;">Este email foi redirecionado para teste. Email original: <strong>${email}</strong></p>
              </div>
              ` : ''}
              <p>Olá,</p>
              <p>Você solicitou a recuperação de senha para sua conta no Pinheiro Society.</p>
              <p>Use o código abaixo para redefinir sua senha:</p>
              
              <div class="code-container">
                <div class="code">${resetCode}</div>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">
                Digite este código no sistema para continuar com a recuperação de senha.
              </p>
              <p><strong>Este código expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta recuperação de senha, ignore este email.</p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} Pinheiro Society. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      ${isRedirected ? `⚠️ MODO DESENVOLVIMENTO: Este email foi redirecionado para teste. Email original: ${email}\n\n` : ''}
      Recuperação de Senha - Pinheiro Society
      
      Você solicitou a recuperação de senha para sua conta.
      
      Seu código de verificação é: ${resetCode}
      
      Digite este código no sistema para continuar com a recuperação de senha.
      
      Este código expira em 1 hora.
      
      Se você não solicitou esta recuperação de senha, ignore este email.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    if (isRedirected) {
      console.log(`📧 Email redirecionado em desenvolvimento: ${email} → ${destinationEmail}`);
    }
    return true;
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    
    // Mensagens de erro mais amigáveis
    if (error.code === 'EAUTH') {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Credenciais SMTP não configuradas. Verifique SMTP_USER e SMTP_PASS no arquivo .env');
      } else {
        const errorMessage = `
❌ Erro de autenticação SMTP (EAUTH)

Possíveis causas:
1. Senha de aplicativo do Gmail incorreta ou expirada
2. Verificação em duas etapas não está ativada
3. "Acesso a apps menos seguros" precisa estar ativado (não recomendado)
4. A senha de app tem espaços que não foram removidos

Soluções:
1. Gere uma nova senha de app em: https://myaccount.google.com/apppasswords
2. Certifique-se de que a verificação em duas etapas está ativada
3. Remova todos os espaços da senha de app no arquivo .env
4. Reinicie o servidor após alterar o .env

Email configurado: ${process.env.SMTP_USER}
        `.trim();
        throw new Error(errorMessage);
      }
    }
    
    throw error;
  }
};

