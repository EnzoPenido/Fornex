const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const dataPath = path.join(__dirname, '../data/empresas.json');

// Garante que o arquivo exista
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf8');
}

router.post('/', (req, res) => {
    // Pega todos os campos esperados do formulário simplificado
    const { nome, email, senha, ConfSenha, cnpj, endereco, telefone, sobre, descricao } = req.body;

    // Valida campos obrigatórios
    if (!nome || !email || !senha || !ConfSenha || !cnpj) {
        return res.status(400).send('Preencha os campos obrigatórios: Nome, Email, Senha, Confirmar Senha e CNPJ.');
    }

    if (senha !== ConfSenha) {
        return res.status(400).send('As senhas não coincidem!');
    }

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler empresas.json (Cadastro Empresa):", err);
            return res.status(500).send('Erro interno ao processar cadastro.');
        }

        let empresas = [];
        try {
            if (data && data.trim() !== '') {
                empresas = JSON.parse(data);
            }
        } catch (parseErr) {
            console.error("Erro de parse no empresas.json (Cadastro Empresa):", parseErr);
            return res.status(500).send('Erro interno (arquivo de dados corrompido).');
        }

        // Verifica se email ou CNPJ já existem
        if (empresas.find(e => e.email === email)) {
            return res.status(400).send('Este e-mail já está sendo usado por outra empresa.');
        }
        if (empresas.find(e => e.cnpj === cnpj)) {
            return res.status(400).send('Este CNPJ já está cadastrado.');
        }

        // Cria ID simples (garantir que seja string se necessário)
        const novoId = empresas.length > 0 ? (parseInt(empresas[empresas.length - 1].id) + 1).toString() : "1";

        // Cria o objeto da nova empresa (sem imagem, produtos; com categorias vazias)
        const novaEmpresa = {
            id: novoId,
            nome,
            email,
            cnpj,
            senha, // Hash em produção!
            descricao: descricao || '', // Descrição curta/Ramo
            endereco: endereco || '',
            telefone: telefone || '',
            sobre: sobre || '', // Descrição longa
            produtos: [],
            imagem: null,
            categorias: []
        };

        empresas.push(novaEmpresa);

        fs.writeFile(dataPath, JSON.stringify(empresas, null, 2), (writeErr) => {
            if (writeErr) {
                console.error("Erro ao salvar empresas.json (Cadastro Empresa):", writeErr);
                return res.status(500).send('Erro interno ao salvar cadastro.');
            }
            // Redireciona para o login após o cadastro bem-sucedido
            res.redirect('/login.html');
        });
    });
});

module.exports = router;