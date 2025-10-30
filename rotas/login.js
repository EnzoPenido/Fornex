const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const usuariosPath = path.join(__dirname, '../data/usuarios.json');
const empresasPath = path.join(__dirname, '../data/empresas.json');

router.post('/', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Preencha todos os campos!' });
  }

  try {
    // Tenta encontrar como Usuário (Cliente)
    const usuariosData = fs.readFileSync(usuariosPath, 'utf8');
    const usuarios = JSON.parse(usuariosData);
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
      return res.json({
        message: 'Login de cliente bem-sucedido!',
        tipo: 'cliente',
        dados: usuario
      });
    }

    // Se não for cliente, tenta encontrar como Empresa
    const empresasData = fs.readFileSync(empresasPath, 'utf8');
    const empresas = JSON.parse(empresasData);
    const empresa = empresas.find(e => e.email === email && e.senha === senha);

    if (empresa) {
      // Encontrou uma empresa
      return res.json({
        message: 'Login de empresa bem-sucedido!',
        tipo: 'empresa',
        dados: empresa // Envia os dados da empresa
      });
    }

    // Se não encontrou nenhum
    return res.status(401).json({ message: 'E-mail ou senha incorretos!' });

  } catch (err) {
    console.error("Erro ao ler arquivos de dados:", err);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

module.exports = router;