const verificationEmailTemplate = (code) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Email - TerraUrb</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4287f5;
            color: white;
            text-align: center;
            padding: 30px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #e1e1e1;
            border-radius: 0 0 8px 8px;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #4287f5;
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background-color: #f8fafc;
            border-radius: 8px;
            letter-spacing: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        .logo {
            width: 80px;
            height: auto;
            margin-bottom: 15px;
        }
        .warning {
            font-size: 13px;
            color: #666;
            text-align: center;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://terraurb.com/logo.svg" alt="TerraUrb Logo" class="logo">
            <h1>Verificação de Email</h1>
        </div>
        <div class="content">
            <h2>Olá!</h2>
            <p>Obrigado por se cadastrar no TerraUrb. Para completar seu registro, use o código de verificação abaixo:</p>
            
            <div class="code">${code}</div>
            
            <p>Este código expira em 10 minutos por motivos de segurança.</p>
            
            <div class="warning">
                <p>Se você não solicitou este código, por favor ignore este email.</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 TerraUrb. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = { verificationEmailTemplate }; 