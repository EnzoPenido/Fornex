const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

/**
 * Deleta fotos de perfil antigas em um diretório, mantendo apenas o arquivo novo.
 * @param {string} directoryPath - O caminho completo para a pasta (ex: /path/to/uploads/1)
 * @param {string} newFileName - O nome do arquivo que NÃO deve ser deletado (ex: perfil.jpg)
 */
function limparFotosAntigas(directoryPath, newFileName) {
  try {
    // Verifica se o diretório existe (se não, não há nada para limpar)
    if (!fs.existsSync(directoryPath)) {
      return;
    }

    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
      // Se o arquivo começar com "perfil" E NÃO for o arquivo novo...
      if (file.startsWith('perfil') && file !== newFileName) {
        // Deleta o arquivo antigo
        fs.unlinkSync(path.join(directoryPath, file));
        console.log(`Arquivo antigo deletado: ${file}`);
      }
    });
  } catch (err) {
    console.error('Erro ao limpar fotos antigas:', err);
    // Não quebra a aplicação, apenas loga o erro
  }
}

// --- Configuração da API de Edição e Uploads ---
const dataPath = path.join(__dirname, 'data');
const empresasJsonPath = path.join(dataPath, 'empresas.json');
const usuariosJsonPath = path.join(dataPath, 'usuarios.json'); // Caminho para usuarios.json
const uploadPathUsuario = path.join(__dirname, '/uploads/usuarios');
const uploadPathEmpresa = path.join(__dirname, '/uploads/empresas');

// Garante que as pastas de dados e uploads existam
if (!fs.existsSync(uploadPathUsuario)) fs.mkdirSync(uploadPathUsuario);
if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);

// Configura o Multer para salvar uploads de EMPRESAS (por ID)
const storageEmpresa = multer.diskStorage({
  destination: function (req, file, cb) {
    const empresaId = req.params.id;
    const empresaFolder = path.join(uploadPathEmpresa, String(empresaId));
    if (!fs.existsSync(empresaFolder)) fs.mkdirSync(empresaFolder, { recursive: true });
    cb(null, empresaFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `perfil${ext}`);
  }
});
const uploadEmpresa = multer({ storage: storageEmpresa });

// Configura o Multer para salvar uploads de CLIENTES (por CPF)
const storageUsuario = multer.diskStorage({
  destination: function (req, file, cb) {
    const cpf = req.params.cpf; // Assume CPF na URL
    const userFolder = path.join(uploadPathUsuario, cpf);
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });
    cb(null, userFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `perfil${ext}`);
  }
});
const uploadUsuario = multer({ storage: storageUsuario });
// --- Fim da Configuração ---

// Middlewares Essenciais
app.use(cors());
app.use(express.urlencoded({ extended: true })); // Para ler dados de formulários simples
app.use(express.json()); // Para ler JSON do corpo das requisições (ex: login)
app.use('/uploads/usuarios', express.static(path.join(__dirname, 'uploads'))); // Servir imagens da pasta uploads
app.use(express.static(__dirname)); // Servir arquivos estáticos (HTML, CSS, JS do frontend, Imagens da pasta /img)

// Importar e Usar Rotas de Cadastro/Login
const rotaCadastro = require('./rotas/cadastro');
const rotaLogin = require('./rotas/login');
const cadastroEmpresaRouter = require('./rotas/cadastroEmpresa');

app.use('/cadastro', rotaCadastro); // Rota para cadastro de CLIENTE
app.use('/login', rotaLogin); // Rota para login (cliente OU empresa)
app.use('/cadastroEmpresa', cadastroEmpresaRouter); // Rota para cadastro de EMPRESA

// Rota para a página inicial (caso alguém acesse /)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =======================================================
//                    ROTAS DA API
// =======================================================

// Rota GET para o Catálogo (lê empresas.json)
app.get('/api/empresas', (req, res) => {
  fs.readFile(empresasJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Erro ao ler empresas.json:", err);
      return res.status(500).json({ erro: 'Erro interno ao ler dados.' });
    }
    let empresas = [];
    try {
      if (data && data.trim() !== '') {
        empresas = JSON.parse(data);
      }
    } catch (parseErr) {
      console.error("Erro de parse no empresas.json (GET /api/empresas):", parseErr);
      return res.status(500).json({ erro: 'O arquivo de dados (empresas.json) está corrompido.' });
    }
    res.json(empresas);
  });
});

// Rota GET para UMA Empresa (lê empresas.json e acha por ID)
app.get('/api/empresa/:id', (req, res) => {
  const empresaId = req.params.id;
  fs.readFile(empresasJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Erro ao ler empresas.json:", err);
      return res.status(500).json({ erro: 'Erro interno ao ler dados.' });
    }
    let empresas = [];
    try {
      if (data && data.trim() !== '') {
        empresas = JSON.parse(data);
      }
    } catch (parseErr) {
      console.error("Erro de parse no empresas.json (GET /api/empresa/:id):", parseErr);
      return res.status(500).json({ erro: 'O arquivo de dados (empresas.json) está corrompido.' });
    }

    const empresa = empresas.find(e => String(e.id) === String(empresaId)); // Comparação segura
    if (empresa) {
      res.json(empresa);
    } else {
      res.status(404).json({ erro: 'Empresa não encontrada.' });
    }
  });
});

// Rota PUT para ATUALIZAR a Empresa (texto, produtos, categorias e imagem)
app.put('/api/empresa/:id', uploadEmpresa.single('imagem'), (req, res) => {
  const empresaId = req.params.id;
  const dadosAtualizados = req.body;

  fs.readFile(empresasJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Erro ao ler empresas.json (PUT):", err);
      return res.status(500).json({ erro: 'Erro interno ao ler dados.' });
    }
    let empresas = [];
    try {
      if (data && data.trim() !== '') {
        empresas = JSON.parse(data);
      }
    } catch (parseErr) {
      console.error("Erro de parse no empresas.json (PUT):", parseErr);
      return res.status(500).json({ erro: 'O arquivo de dados (empresas.json) está corrompido.' });
    }

    const index = empresas.findIndex(e => String(e.id) === String(empresaId)); // Comparação segura

    if (index === -1) {
      return res.status(404).json({ erro: 'Empresa não encontrada para atualizar.' });
    }

    // Atualiza os dados
    let empresa = empresas[index];
    empresa.nome = dadosAtualizados.nome !== undefined ? dadosAtualizados.nome : empresa.nome;
    empresa.descricao = dadosAtualizados.descricao !== undefined ? dadosAtualizados.descricao : empresa.descricao;
    empresa.sobre = dadosAtualizados.sobre !== undefined ? dadosAtualizados.sobre : empresa.sobre;
    empresa.telefone = dadosAtualizados.telefone !== undefined ? dadosAtualizados.telefone : empresa.telefone;
    empresa.localizacao = dadosAtualizados.localizacao !== undefined ? dadosAtualizados.localizacao : empresa.localizacao;

    // Atualiza produtos
    if (dadosAtualizados.produtos !== undefined) {
      empresa.produtos = dadosAtualizados.produtos.split(',').map(p => p.trim()).filter(p => p);
    }

    // Atualiza categorias
    if (dadosAtualizados.categorias !== undefined) {
      empresa.categorias = dadosAtualizados.categorias.split(',').map(cat => cat.trim()).filter(cat => cat);
    } else {
      empresa.categorias = []; // Garante que seja um array vazio se nada for enviado
    }

    // Se uma NOVA IMAGEM foi enviada
    if (req.file) {
      limparFotosAntigas(req.file.destination, req.file.filename);
      empresa.imagem = `/uploads/empresas/${empresaId}/${req.file.filename}`; // Atualiza o caminho da imagem
    }

    empresas[index] = empresa;

    // Salva o JSON atualizado
    fs.writeFile(empresasJsonPath, JSON.stringify(empresas, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Erro ao salvar empresas.json (PUT):", writeErr);
        return res.status(500).json({ erro: 'Erro interno ao salvar dados.' });
      }
      res.json(empresa); // Retorna a empresa atualizada
    });
  });
});

// Rota POST para ATUALIZAR a Foto do Cliente
app.post('/api/usuario/upload-perfil/:cpf', uploadUsuario.single('imagem'), (req, res) => {
  const cpf = req.params.cpf;
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
  }

  limparFotosAntigas(req.file.destination, req.file.filename);
  const imagemPath = `/uploads/usuarios/${cpf}/${req.file.filename}`;

  // Atualiza o usuarios.json
  fs.readFile(usuariosJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Erro ao ler usuarios.json:", err);
      return res.status(500).json({ erro: 'Erro interno ao ler dados de usuários.' });
    }
    let usuarios = [];
    try {
      if (data && data.trim() !== '') {
        usuarios = JSON.parse(data);
      }
    } catch (parseErr) {
      console.error("Erro de parse no usuarios.json:", parseErr);
      return res.status(500).json({ erro: 'O arquivo de dados (usuarios.json) está corrompido.' });
    }

    const index = usuarios.findIndex(u => u.cpf === cpf);

    if (index === -1) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    usuarios[index].imagemPerfil = imagemPath;

    // Salva o usuarios.json atualizado
    fs.writeFile(usuariosJsonPath, JSON.stringify(usuarios, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Erro ao salvar usuarios.json:", writeErr);
        return res.status(500).json({ erro: 'Erro interno ao salvar dados do usuário.' });
      }
      res.json({
        message: 'Imagem de perfil atualizada com sucesso!',
        imagemPath: imagemPath,
        usuario: usuarios[index] // Retorna o usuário atualizado
      });
    });
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando em: http://localhost:${port}`);
});