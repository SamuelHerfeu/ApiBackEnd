import express, { request, response } from 'express';
const app = express();

const desiredPort = 3000;

const startServer = (port) => {
  app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠ Porta ${port} ocupada, tentando ${port + 1}...`);
      startServer(port + 1);
    }
  });
};

startServer(desiredPort);

const users = []

app.post('/users', (req, res) => {

    console.log (req)
    res.send ("ok deu certo")

})


app.get('/users', (request, response) => {
    res.send('OK, DEU BOM')
})

app.listen(3000)



/*
    1) tipo de rota / methods HTTP
    2) Endereço
    app.post('/usuarios')
    app.put('/usuarios')
    app.delete('/usuarios')
    3) criar nossa API de usuarios

        - criar um usuario
        -Listar todos os usuarios
        editar um usuario
        deletar um usuario
*/