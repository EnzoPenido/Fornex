const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// Importar rotas
const rotaCadastro = require('./rotas/cadastro');
const rotaLogin = require('./rotas/login');

// Usar rotas
app.use('/cadastro', rotaCadastro);
app.use('/login', rotaLogin);

// Página inicial (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando em: http://localhost:${port}`);
});
