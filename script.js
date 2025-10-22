const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

//Middlewares
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Fornex')));

// Rotas separadas
const rotaCadastro = require('./rotas/cadastro');
const rotaLogin = require('./rotas/login');

// Página inicial
app.get('/', (req,res) => {
    res.redirect('/login.html');
});

app.listen(port, () =>{
    console.log(`Server rodando em http://localhost${port}`)
})