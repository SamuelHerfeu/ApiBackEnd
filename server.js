import express from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuração inicial
dotenv.config();
const app = express();
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Função melhorada para matar processos na porta
const killPortProcess = async (port) => {
  try {
    const kill = await import('kill-port');
    await kill.default(port);
    console.log(`✅ Porta ${port} liberada`);
  } catch (error) {
    console.log('ℹ️ Nenhum processo para encerrar');
  }
};

// Conexão com banco de dados robusta
async function setupDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');
    
    // Verifica se a collection existe (apenas para MongoDB)
    if (process.env.DATABASE_URL?.includes('mongodb')) {
      await prisma.$runCommandRaw({ listCollections: 1 });
    }
  } catch (error) {
    console.error('❌ Falha na conexão com o banco:', {
      message: error.message,
      meta: error.meta
    });
    process.exit(1);
  }
}

// Rotas
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'online',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Rota POST /users com validação reforçada
app.post('/users', async (req, res) => {
  try {
    const { name, age, email } = req.body;
    
    // Validação avançada
    if (!name || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    if (age && (isNaN(age) || age < 0)) {
      return res.status(400).json({ error: "Idade deve ser um número positivo" });
    }

    const userData = {
      name,
      email,
      ...(age && { age: String(age) })
    };

    const newUser = await prisma.user.create({
      data: userData
    });

    console.log('Usuário criado:', newUser);
    return res.status(201).json(newUser);
    
  } catch (error) {
    console.error('Erro:', error);
    
    // Tratamento específico para erros do MongoDB
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    
    return res.status(500).json({ 
      error: "Erro interno",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Inicialização otimizada
async function startServer() {
  try {
    console.log('⚡ Iniciando servidor...');
    
    await killPortProcess(PORT);
    await setupDatabase();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
      🚀 Servidor pronto!
      URL: http://localhost:${PORT}
      Endpoints:
      - POST /users
      - GET /users
      - GET /health
      `);
    });

    server.on('error', (err) => {
      console.error('💥 Erro no servidor:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Falha crítica:', error);
    process.exit(1);
  }
}

// Gerenciamento de encerramento
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando...');
  await prisma.$disconnect();
  process.exit(0);
});

// Inicie o servidor
startServer();