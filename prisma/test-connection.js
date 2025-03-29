const { MongoClient } = require('mongodb');
require('dotenv').config();

async function test() {
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    console.log('✅ Conexão com MongoDB bem-sucedida');
    await client.db().command({ ping: 1 });
    console.log('✅ Ping no banco de dados OK');
  } finally {
    await client.close();
  }
}

test().catch(console.error);