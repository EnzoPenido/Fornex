// ===============================================
//         SCRIPT DA PÁGINA DA EMPRESA
// ===============================================

// Variáveis globais para armazenar o ID da empresa (vindo da URL)
// e uma cópia dos dados originais (para a função "Cancelar Edição").
let empresaId = '';
let dadosOriginaisEmpresa = {};

/**
 * Busca e parseia a sessão do usuário armazenada no localStorage.
 * @returns {object | null} O objeto da sessão do usuário ou null se não existir ou for inválido.
 */
function getSessaoUsuario() {
  const sessao = localStorage.getItem('sessaoUsuario');
  if (sessao) {
    try {
      // Tenta converter a string JSON da sessão em um objeto
      return JSON.parse(sessao);
    } catch (e) {
      // Se o JSON for inválido, loga o erro e remove o item corrompido
      console.error("Erro ao parsear sessão:", e);
      localStorage.removeItem('sessaoUsuario');
      return null;
    }
  }
  // Retorna null se 'sessaoUsuario' não existir no localStorage
  return null;
}

// Adiciona um listener que será executado quando o HTML da página estiver completamente carregado.
document.addEventListener('DOMContentLoaded', async () => {
  // Pega os parâmetros da URL (ex: ?id=123)
  const params = new URLSearchParams(window.location.search);
  // Extrai o parâmetro 'id'
  empresaId = params.get('id');

  // Se nenhum ID de empresa for encontrado na URL, exibe um erro e para a execução.
  if (!empresaId) {
    document.body.innerHTML = '<div class="container text-center mt-5"><h2>Erro: Empresa não especificada.</h2></div>';
    return;
  }

  // Se um ID foi encontrado, carrega os dados da empresa (função assíncrona)
  await carregarDadosEmpresa();
  // Configura os listeners dos botões (Editar, Salvar, Cancelar)
  adicionarListenersBotoes();
  // Decide quais botões exibir (Editar vs. Fazer Orçamento) com base na sessão
  atualizarVisibilidadeBotoes();
  // Configura o listener para o formulário dentro do modal de orçamento
  adicionarListenerModalOrcamento();
});

/**
 * Busca os dados da empresa na API usando o 'empresaId' global.
 */
async function carregarDadosEmpresa() {
  try {
    // Faz a requisição (fetch) para a API
    const resposta = await fetch(`/api/empresa/${empresaId}`);

    // Se a resposta não for OK (ex: 404, 500), trata como um erro
    if (!resposta.ok) {
      if (resposta.status === 404) throw new Error('Empresa não encontrada.');
      else throw new Error(`Erro do servidor: ${resposta.status}`);
    }

    // Converte a resposta da API para JSON
    const empresa = await resposta.json();
    if (!empresa) throw new Error('Dados da empresa inválidos recebidos.');

    // Armazena os dados recebidos na variável global para backup (função "Cancelar")
    dadosOriginaisEmpresa = empresa;
    // Chama a função para preencher a página com os dados
    popularPagina(empresa);

  } catch (erro) {
    // Em caso de qualquer erro no processo, exibe a mensagem de erro na página
    console.error('Erro ao carregar dados da empresa:', erro);
    document.body.innerHTML = `<div class="container text-center mt-5"><h2>Erro ao carregar empresa: ${erro.message}</h2></div>`;
  }
}

/**
 * Preenche os elementos HTML da página com os dados da empresa.
 * @param {object} empresa - O objeto com os dados da empresa.
 */
function popularPagina(empresa) {
  // Garante que 'empresa' seja um objeto vazio caso seja nulo/undefined, para evitar erros
  empresa = empresa || {};

  // --- Popula os campos de VISUALIZAÇÃO (view-mode) ---
  const elImagem = document.getElementById('empresaImagem');
  const elNome = document.getElementById('empresaNome');
  const elDescricao = document.getElementById('empresaDescricao');
  const elSobre = document.getElementById('empresaSobre');
  const elTelefone = document.getElementById('empresaTelefone');
  const elLocalizacao = document.getElementById('empresaLocalizacao');
  const categoriasContainer = document.getElementById('empresaCategorias');
  const produtosContainer = document.getElementById('empresaProdutos');

  // Define os valores, usando um valor padrão (fallback) caso o dado não exista
  if (elImagem) elImagem.src = empresa.imagem || '/img/IconeConta.png';
  if (elNome) elNome.textContent = empresa.nome || 'Nome não informado';
  if (elDescricao) elDescricao.textContent = empresa.descricao || '';
  if (elSobre) elSobre.textContent = empresa.sobre || '';
  if (elTelefone) elTelefone.textContent = empresa.telefone || 'Não informado';
  if (elLocalizacao) elLocalizacao.textContent = empresa.localizacao || 'Não informada';

  // --- Popula os campos de EDIÇÃO (edit-mode) ---
  // Estes são os <input> e <textarea> que aparecem no modo de edição
  const inputNome = document.getElementById('input-nome');
  const inputSobre = document.getElementById('input-sobre');
  const inputDescricao = document.getElementById('input-descricao');
  const inputTelefone = document.getElementById('input-telefone');
  const inputLocalizacao = document.getElementById('input-localizacao');
  const inputCategorias = document.getElementById('input-categorias');
  const inputProdutos = document.getElementById('input-produtos');

  // Define o 'value' dos inputs
  if (inputNome) inputNome.value = empresa.nome || '';
  if (inputSobre) inputSobre.value = empresa.sobre || '';
  if (inputDescricao) inputDescricao.value = empresa.descricao || '';
  if (inputTelefone) inputTelefone.value = empresa.telefone || '';
  if (inputLocalizacao) inputLocalizacao.value = empresa.localizacao || '';

  // --- Processamento de Arrays (Categorias) ---
  const categoriasArray = empresa.categorias || [];
  if (categoriasContainer) {
    categoriasContainer.innerHTML = ''; // Limpa o container
    if (categoriasArray.length > 0) {
      // Cria um "badge" (div estilizada) para cada categoria
      categoriasArray.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'col-auto bg-secondary m-1 text-light p-2 rounded';
        div.textContent = cat;
        categoriasContainer.appendChild(div);
      });
    } else {
      categoriasContainer.innerHTML = '<p class="text-dark">Nenhuma categoria definida</p>';
    }
  }
  // No campo de edição, junta o array com ", "
  if (inputCategorias) inputCategorias.value = categoriasArray.join(', ');

  // --- Processamento de Arrays (Produtos) ---
  const produtosArray = empresa.produtos || [];
  if (produtosContainer) {
    produtosContainer.innerHTML = ''; // Limpa o container
    if (produtosArray.length > 0) {
      // Cria um "badge" para cada produto
      produtosArray.forEach(produto => {
        const div = document.createElement('div');
        div.className = 'col-auto bg-secondary m-1 text-light p-2 rounded';
        div.textContent = produto;
        produtosContainer.appendChild(div);
      });
    } else {
      produtosContainer.innerHTML = '<p class="text-dark">Nenhum produto cadastrado.</p>';
    }
  }
  // No campo de edição, junta o array com ", "
  if (inputProdutos) inputProdutos.value = produtosArray.join(', ');
}

/**
 * Verifica a sessão do usuário e decide quais botões deve exibir.
 */
function atualizarVisibilidadeBotoes() {
  const sessao = getSessaoUsuario();
  const controlesEdicao = document.getElementById('controles-edicao');
  const btnOrcamento = document.getElementById('btn-fazer-orcamento');

  // Esconde todos os controles por padrão
  if (controlesEdicao) controlesEdicao.style.display = 'none';
  if (btnOrcamento) btnOrcamento.style.display = 'none';

  // Se existe uma sessão e dados do usuário
  if (sessao && sessao.dados) {
    // Se o usuário é uma 'empresa' E seu ID é o mesmo ID da página
    if (sessao.tipo === 'empresa' && String(sessao.dados.id) === String(empresaId)) {
      // Mostra os controles de edição
      if (controlesEdicao) controlesEdicao.style.display = 'block';
    }
    // Se o usuário é um 'cliente'
    else if (sessao.tipo === 'cliente') {
      // Mostra o botão de fazer orçamento
      if (btnOrcamento) btnOrcamento.style.display = 'inline-block';
    }
  }
  // Se não houver sessão, ou for outro tipo de usuário, nada será mostrado.
}

/**
 * Adiciona os listeners de clique aos botões de controle de edição.
 */
function adicionarListenersBotoes() {
  const btnEditar = document.getElementById('btn-editar');
  const btnCancelar = document.getElementById('btn-cancelar');
  const btnSalvar = document.getElementById('btn-salvar');

  // Ao clicar em Editar: ativa o modo de edição
  if (btnEditar) btnEditar.addEventListener('click', () => toggleEditMode(true));
  // Ao clicar em Cancelar: desativa o modo de edição e repopula com os dados originais
  if (btnCancelar) btnCancelar.addEventListener('click', () => {
    toggleEditMode(false);
    popularPagina(dadosOriginaisEmpresa); // Restaura os dados de backup
  });
  // Ao clicar em Salvar: chama a função de salvar
  if (btnSalvar) btnSalvar.addEventListener('click', salvarAlteracoes);
}

/**
 * Alterna a interface entre o modo de visualização e o modo de edição.
 * @param {boolean} isEditing - True para entrar no modo de edição, false para sair.
 */
function toggleEditMode(isEditing) {
  // Encontra todos os elementos de visualização e os esconde/mostra
  document.querySelectorAll('.view-mode').forEach(el => el.style.display = isEditing ? 'none' : '');
  // Encontra todos os elementos de edição (inputs) e os mostra/esconde
  document.querySelectorAll('.edit-mode').forEach(el => el.style.display = isEditing ? 'block' : 'none');

  // Gerencia a visibilidade dos próprios botões
  const btnEditar = document.getElementById('btn-editar');
  const btnSalvar = document.getElementById('btn-salvar');
  const btnCancelar = document.getElementById('btn-cancelar');

  if (btnEditar) btnEditar.style.display = isEditing ? 'none' : 'block';
  if (btnSalvar) btnSalvar.style.display = isEditing ? 'block' : 'none';
  if (btnCancelar) btnCancelar.style.display = isEditing ? 'block' : 'none';
}

/**
 * Coleta os dados dos inputs de edição e os envia para a API (PUT).
 */
async function salvarAlteracoes() {
  // FormData é usado para enviar dados de formulário, especialmente útil para arquivos (upload de imagem)
  const formData = new FormData();
  formData.append('nome', document.getElementById('input-nome')?.value || '');
  formData.append('sobre', document.getElementById('input-sobre')?.value || '');
  formData.append('produtos', document.getElementById('input-produtos')?.value || '');
  formData.append('descricao', document.getElementById('input-descricao')?.value || '');
  formData.append('telefone', document.getElementById('input-telefone')?.value || '');
  formData.append('localizacao', document.getElementById('input-localizacao')?.value || '');
  formData.append('categorias', document.getElementById('input-categorias')?.value || '');

  // Pega o input da imagem
  const inputImagem = document.getElementById('input-imagem');
  // Se um arquivo foi selecionado, adiciona ao FormData
  if (inputImagem && inputImagem.files.length > 0) {
    formData.append('imagem', inputImagem.files[0]);
  }

  try {
    // Envia a requisição PUT para a API com os dados do FormData
    const resposta = await fetch(`/api/empresa/${empresaId}`, {
      method: 'PUT',
      body: formData // Não é necessário 'Content-Type', o FormData cuida disso
    });

    // Se a API retornar um erro
    if (!resposta.ok) {
      let errorMsg = 'Falha ao salvar.';
      try {
        // Tenta pegar uma mensagem de erro específica do JSON da resposta
        const erroJson = await resposta.json();
        errorMsg = erroJson.erro || errorMsg;
      } catch (e) {
        // Ignora se a resposta de erro não for JSON
      }
      throw new Error(errorMsg);
    }

    // Se a API retornar sucesso, ela devolve os dados atualizados
    dadosOriginaisEmpresa = await resposta.json();

    // --- Atualização da Sessão Local ---
    // Atualiza os dados da empresa na sessão do localStorage, se o usuário logado for esta empresa
    const sessao = getSessaoUsuario();
    if (sessao && sessao.tipo === 'empresa' && sessao.dados) {
      sessao.dados = dadosOriginaisEmpresa; // Atualiza o objeto da sessão
      localStorage.setItem('sessaoUsuario', JSON.stringify(sessao)); // Salva de volta
    }

    // --- Atualização da UI Imediata ---
    // Força a atualização da foto de perfil na barra de navegação (navbar)
    const profilePic = document.getElementById('navbar-profile-pic');
    if (profilePic && dadosOriginaisEmpresa.imagem) {
      // Adiciona um timestamp (?t=...) para quebrar o cache do navegador e forçar o reload da imagem
      profilePic.src = dadosOriginaisEmpresa.imagem + '?t=' + new Date().getTime();
    }

    // Repopula a página com os novos dados
    popularPagina(dadosOriginaisEmpresa);
    // Sai do modo de edição
    toggleEditMode(false);
    alert('Empresa atualizada com sucesso!');

  } catch (erro) {
    console.error('Erro ao salvar alterações da empresa:', erro);
    alert(`Erro ao salvar: ${erro.message}`);
  }
}

/**
 * Adiciona o listener de 'submit' ao formulário de orçamento no modal.
 */
function adicionarListenerModalOrcamento() {
  const formOrcamento = document.getElementById('form-orcamento');
  const modalElement = document.getElementById('modalOrcamento');

  // Garante que ambos os elementos (formulário e modal) existem
  if (formOrcamento && modalElement) {
    // Pega a instância do Modal Bootstrap (se já iniciada) ou cria uma nova
    const bootstrapModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

    // Adiciona o listener ao evento 'submit' do formulário
    formOrcamento.addEventListener('submit', (event) => {
      // Impede o comportamento padrão do formulário (que recarregaria a página)
      event.preventDefault();

      // Pega a sessão do cliente
      const sessaoCliente = getSessaoUsuario();

      // Validação: Garante que é um cliente logado
      if (!sessaoCliente || sessaoCliente.tipo !== 'cliente' || !sessaoCliente.dados) {
        alert('Erro: Você precisa estar logado como cliente para enviar um orçamento.');
        return;
      }

      // Coleta todos os dados necessários
      const nomeClienteLogado = sessaoCliente.dados.nome || 'Nome não encontrado';
      const emailClienteLogado = sessaoCliente.dados.email || 'Email não encontrado';
      const cpfClienteLogado = sessaoCliente.dados.cpf || 'CPF não encontrado';
      const mensagem = document.getElementById('orcamento-mensagem')?.value || '';

      const nomeEmpresa = dadosOriginaisEmpresa?.nome || 'Empresa Desconhecida';
      const idEmpresa = dadosOriginaisEmpresa?.id || 'ID Desconhecido';

      // --- Simulação de Envio ---
      // No momento, apenas exibe os dados no console
      console.log("--- Pedido de Orçamento ---");
      console.log("Para Empresa:", nomeEmpresa, `(ID: ${idEmpresa})`);
      console.log("Cliente Logado:", nomeClienteLogado, `(${emailClienteLogado})`, `(CPF: ${cpfClienteLogado})`);
      console.log("Mensagem:", mensagem);
      console.log("----------------------------");

      alert(`Pedido de orçamento para "${nomeEmpresa}" enviado (ver console para detalhes).\nCliente: ${nomeClienteLogado}`);

      // Limpa o formulário
      formOrcamento.reset();
      // Fecha o modal
      bootstrapModal.hide();

      // O comentário abaixo indica o próximo passo, que seria enviar os dados para uma API
      // Próximo Passo: fetch('/api/orcamento', { method: 'POST', body: JSON.stringify({...}) });
    });
  } else {
    // Aviso caso os elementos do modal não sejam encontrados no HTML
    console.warn("Elemento 'form-orcamento' ou 'modalOrcamento' não encontrado no HTML.");
  }
}