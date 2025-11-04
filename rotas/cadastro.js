const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const dataPath = path.join(__dirname, '../data/usuarios.json');

// Garante que o arquivo existe
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, '[]');
}

// GET → retorna o HTML (opcional se você serve via pasta /public)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cadastro.html'));
});

// POST → salva o cadastro
router.post('/', (req, res) => {
  const { nome, email, senha, confsenha, cpf, telefone } = req.body;

  if (!nome || !email || !senha || !confsenha) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios!' });
  }

  if (senha !== confsenha) {
    return res.status(400).json({ message: 'As senhas não coincidem!' });
  }

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Erro ao ler arquivo.' });

    let usuarios = [];
    try {
      usuarios = JSON.parse(data || '[]');
    } catch {
      usuarios = [];
    }

    if (usuarios.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado!' });
    }

    usuarios.push({ nome, email, senha, cpf, telefone });

    fs.writeFile(dataPath, JSON.stringify(usuarios, null, 2), (err) => {
      if (err) return res.status(500).json({ message: 'Erro ao salvar usuário.' });
      res.json({ message: 'Usuário cadastrado com sucesso!' });
    });
  });
});

module.exports = router;
