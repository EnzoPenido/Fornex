const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const dataPath = path.join(__dirname, '../data/usuarios.json');

// Garante que o arquivo existe
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, '[]');
}

// Exibe página de cadastro
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../cadastro.html'));
});

// Recebe dados do formulário
router.post('/', (req, res) => {
  const { nome, email, senha, ConfSenha, cpf, telefone } = req.body;

  if (!nome || !email || !senha || !ConfSenha) {
    return res.status(400).send('Preencha todos os campos obrigatórios!');
  }

  if (senha !== ConfSenha) {
    return res.status(400).send('As senhas não coincidem!');
  }

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Erro ao ler arquivo.');
    }

    let usuarios = [];
    if (data.trim() !== '') {
      try {
        usuarios = JSON.parse(data);
      } catch {
        usuarios = [];
      }
    }
    if (usuarios.find(u => u.email === email)) {
      return res.status(400).send('Este e-mail já está cadastrado!');
    }

    usuarios.push({ nome, email, senha, cpf, telefone });

    fs.writeFile(dataPath, JSON.stringify(usuarios, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Erro ao salvar usuário.');
      }
      res.redirect('/login.html');
    });
  });
});

module.exports = router;
