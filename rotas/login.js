const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const dataPath = path.join(__dirname, '../data/usuarios.json');

//Exibe pagina de login
router.get('/', (req, res) =>{
  res.sendFile(path.join(__dirname, '../Fornex/login.html'));
});

//Valida login
router.post('/', (req, res) =>{
  const {email, senha} = req.body;

  if(!email || !senha) {
    return res.status(400).send('Preencha todos os campos!');
  }

  const usuarios = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    return res.status(400).send('E-mail ou senha incorretos!');
  }


  //Redireciona para home
  res.redirect('/index.html');

});

module.exports = router;