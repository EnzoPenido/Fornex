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
        // Pega todos os campos, com fallback
        const {
            nome = '',
            email = '',
            senha = '',
            ConfSenha = '',
            cnpj = '',
            endereco = '',
            telefone = '',
            descricao = '',
            sobre = '',
            produtos = [],
            plano = ''
        } = req.body || {};

        if (!nome || !email || !senha || !ConfSenha || !cnpj) {
            return res.status(400).send('Preencha os campos obrigatórios: Nome, Email, Senha, Confirmar Senha e CNPJ.');
        }

        if (senha !== ConfSenha) {
            return res.status(400).send('As senhas não coincidem!');
        }

        fs.readFile(dataPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erro ao ler empresas.json:', err);
                return res.status(500).send('Erro interno ao processar cadastro.');
            }

            let empresas = [];
            try {
                if (data.trim() !== '') empresas = JSON.parse(data);
            } catch (parseErr) {
                console.error('Erro de parse no empresas.json:', parseErr);
                return res.status(500).send('Erro interno (arquivo de dados corrompido).');
            }

            if (empresas.find(e => e.email === email)) {
                return res.status(400).send('Este e-mail já está sendo usado por outra empresa.');
            }

            if (empresas.find(e => e.cnpj === cnpj)) {
                return res.status(400).send('Este CNPJ já está cadastrado.');
            }

            const novoId = empresas.length > 0
                ? (parseInt(empresas[empresas.length - 1].id) + 1).toString()
                : '1';

            const novaEmpresa = {
                id: novoId,
                nome,
                email,
                cnpj,
                senha,
                descricao,
                endereco,
                telefone,
                sobre,
                produtos: Array.isArray(produtos) ? produtos : produtos.split(',').map(p => p.trim()),
                imagem: null,
                plano,
                categorias: []
            };

            empresas.push(novaEmpresa);

            fs.writeFile(dataPath, JSON.stringify(empresas, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Erro ao salvar empresas.json:', writeErr);
                    return res.status(500).send('Erro interno ao salvar cadastro.');
                }

                console.log(`✅ Empresa cadastrada: ${novaEmpresa.nome}`);
                res.status(200).json({ message: 'Cadastro realizado com sucesso!' });
            });
        });
    });


    module.exports = router;