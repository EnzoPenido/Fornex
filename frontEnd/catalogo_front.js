// ===============================================
//         SCRIPT DA PÁGINA DO CATÁLOGO (vFinal com Filtros e Busca)
// ===============================================

let todasEmpresas = []; // Guarda a lista completa para filtrar no frontend

// Roda quando o HTML da página do catálogo carregar
document.addEventListener('DOMContentLoaded', async () => {
  // Ler termo de busca da URL (se existir)
  const params = new URLSearchParams(window.location.search);
  const termoBuscaURL = params.get('q'); // 'q' é o 'name' do input da navbar

  // Preenche a barra de busca da navbar se houver termo na URL
  const inputBuscaGeral = document.querySelector('.search-bar');
  if (inputBuscaGeral && termoBuscaURL) {
    inputBuscaGeral.value = termoBuscaURL;
  }

  // Carrega os dados (empresas e filtros)
  await carregarEmpresas(); // Carrega TODAS as empresas primeiro
  await carregarEstados();
  await carregarCategorias();
  adicionarListenersFiltros(); // Adiciona listeners DEPOIS de carregar tudo

  // Aplica os filtros iniciais (incluindo o da URL, se houver)
  aplicarFiltros();
});

/**
 * Carrega TODAS as empresas da API e guarda na variável global.
 * Chama renderizarEmpresas para exibir.
 */
async function carregarEmpresas() {
  const container = document.getElementById('catalogoEmpresas');
  if (!container) { console.error("Elemento 'catalogoEmpresas' não encontrado!"); return; }
  container.innerHTML = '<p class="col-12 text-center text-muted mt-4">Carregando fornecedores...</p>'; // Feedback inicial

  try {
    const resposta = await fetch('/api/empresas');
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    todasEmpresas = await resposta.json(); // Guarda na variável global

    // Renderiza a lista completa inicialmente (ou filtrada se houver termo na URL)
    // A chamada aplicarFiltros() no DOMContentLoaded cuidará da filtragem inicial
    // renderizarEmpresas(todasEmpresas); // Não precisa renderizar aqui, aplicarFiltros fará isso

  } catch (erro) {
    console.error('Erro ao carregar catálogo:', erro);
    if (container) container.innerHTML = `<p class="col-12 text-center text-danger mt-4">Não foi possível carregar o catálogo. Tente novamente mais tarde.</p>`;
    todasEmpresas = []; // Limpa em caso de erro
  }
}

/**
 * Renderiza a lista de empresas fornecida no container HTML.
 * @param {Array} empresasParaRenderizar - Array de objetos de empresa.
 */
function renderizarEmpresas(empresasParaRenderizar) {
  const container = document.getElementById('catalogoEmpresas');
  if (!container) return;
  container.innerHTML = ''; // Limpa

  if (!empresasParaRenderizar || empresasParaRenderizar.length === 0) {
    container.innerHTML = '<p class="col-12 text-center text-muted mt-4">Nenhum fornecedor encontrado com os filtros selecionados.</p>';
    return;
  }

  empresasParaRenderizar.forEach(empresa => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-4';
    card.innerHTML = `
          <div class="card h-100 shadow-sm">
            <img src="${empresa.imagem || '/img/IconeConta.png'}"
                 class="card-img-top" alt="Logo ${empresa.nome || 'Empresa'}"
                 style="height: 200px; object-fit: contain; padding: 1rem;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${empresa.nome || 'Nome não disponível'}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${empresa.descricao || ''}</h6>
              <p class="card-text text-truncate">${empresa.sobre || ''}</p>
              <a href="empresa.html?id=${empresa.id}" class="btn btn-primary mt-auto">Ver mais</a>
            </div>
          </div>`;
    container.appendChild(card);
  });
}


/**
 * Carrega os estados do JSON e popula os checkboxes no filtro.
 */
async function carregarEstados() {
  const listaContainer = document.getElementById('filtro-estado-lista');
  if (!listaContainer) { console.warn("Elemento 'filtro-estado-lista' não encontrado."); return; }
  listaContainer.innerHTML = '<small class="text-muted">Carregando...</small>'; // Feedback

  try {
    const response = await fetch('/data/estados.json');
    if (!response.ok) throw new Error('Falha ao carregar estados.json');
    const estados = await response.json();
    estados.sort((a, b) => a.nome.localeCompare(b.nome));
    listaContainer.innerHTML = ''; // Limpa

    estados.forEach(estado => {
      const div = document.createElement('div');
      div.className = 'form-check';
      const estadoIdSeguro = `check-estado-${estado.sigla}`;
      div.innerHTML = `
                <input class="form-check-input filtro-estado-check" type="checkbox" value="${estado.sigla}" id="${estadoIdSeguro}" data-nome="${estado.nome}">
                <label class="form-check-label" for="${estadoIdSeguro}">
                    ${estado.nome} (${estado.sigla})
                </label>`;
      listaContainer.appendChild(div);
    });
  } catch (error) {
    console.error("Erro ao carregar ou configurar estados:", error);
    if (listaContainer) listaContainer.innerHTML = '<small class="text-danger">Erro ao carregar.</small>';
  }
}

/**
 * Carrega as categorias do JSON e popula os checkboxes no filtro.
 */
async function carregarCategorias() {
  const listaContainer = document.getElementById('filtro-categoria-lista');
  if (!listaContainer) { console.warn("Elemento 'filtro-categoria-lista' não encontrado."); return; }
  listaContainer.innerHTML = '<small class="text-muted">Carregando...</small>'; // Feedback

  try {
    const response = await fetch('/data/categorias.json');
    if (!response.ok) throw new Error('Falha ao carregar categorias.json');
    const categorias = await response.json();
    categorias.sort((a, b) => a.nome.localeCompare(b.nome));
    listaContainer.innerHTML = ''; // Limpa

    categorias.forEach(categoria => {
      const div = document.createElement('div');
      div.className = 'form-check';
      const categoriaIdSeguro = `check-categoria-${categoria.id}`; // Usa o ID único da categoria
      div.innerHTML = `
                <input class="form-check-input filtro-categoria-check" type="checkbox" value="${categoria.id}" id="${categoriaIdSeguro}" data-nome="${categoria.nome}"> {/* Value agora é o ID */}
                <label class="form-check-label" for="${categoriaIdSeguro}">
                    ${categoria.nome}
                </label>`;
      listaContainer.appendChild(div);
    });
  } catch (error) {
    console.error("Erro ao carregar ou configurar categorias:", error);
    if (listaContainer) listaContainer.innerHTML = '<small class="text-danger">Erro ao carregar.</small>';
  }
}

/**
 * Adiciona listeners aos inputs/checkboxes dos filtros.
 */
function adicionarListenersFiltros() {
  // Listener para checkboxes de ESTADO
  const containerEstados = document.getElementById('filtro-estado-lista');
  if (containerEstados) {
    containerEstados.addEventListener('change', (event) => {
      if (event.target.classList.contains('filtro-estado-check')) {
        aplicarFiltros(); // Chama a função principal de filtro
      }
    });
  }

  // Listener para checkboxes de CATEGORIA
  const containerCategorias = document.getElementById('filtro-categoria-lista');
  if (containerCategorias) {
    containerCategorias.addEventListener('change', (event) => {
      if (event.target.classList.contains('filtro-categoria-check')) {
        aplicarFiltros(); // Chama a função principal de filtro
      }
    });
  }

  // Listener para input de PRODUTO
  const inputProduto = document.getElementById('filtro-produto-input');
  if (inputProduto) {
    // Usamos 'input' para filtrar a cada tecla digitada
    inputProduto.addEventListener('input', aplicarFiltros);
  }

  // Listener para input de BUSCA GERAL (na navbar)
  const inputBuscaGeral = document.querySelector('.search-bar');
  if (inputBuscaGeral) {
    // Usamos 'input' para filtrar a cada tecla digitada
    inputBuscaGeral.addEventListener('input', aplicarFiltros);
  }
}

/**
 * Pega os valores selecionados em TODOS os filtros, filtra a lista 'todasEmpresas'
 * e chama renderizarEmpresas com o resultado.
 */
function aplicarFiltros() {
  // 1. Pega os estados selecionados (array de siglas, ex: ['SP', 'RJ'])
  const estadosSelecionados = Array.from(document.querySelectorAll('.filtro-estado-check:checked')).map(chk => chk.value);

  // 2. Pega as categorias selecionadas (array de NOMES, ex: ['Tecnologia', 'Agricultura'])
  //    Usamos o nome porque é assim que está salvo no objeto empresa.
  const categoriasSelecionadas = Array.from(document.querySelectorAll('.filtro-categoria-check:checked')).map(chk => chk.dataset.nome);

  // 3. Pega o termo de busca de produto (string, lowercase)
  const termoProduto = document.getElementById('filtro-produto-input')?.value.toLowerCase().trim() || '';

  // 4. Pega o termo de busca geral da navbar (string, lowercase)
  const inputBuscaGeral = document.querySelector('.search-bar');
  const termoBuscaGeral = inputBuscaGeral ? inputBuscaGeral.value.toLowerCase().trim() : '';

  // 5. Filtra a lista 'todasEmpresas'
  const empresasFiltradas = todasEmpresas.filter(empresa => {
    // --- Filtro de Estado ---
    // A empresa passa se nenhum estado for selecionado OU se sua localização (string) contiver alguma das siglas selecionadas.
    // ATENÇÃO: Isso assume que 'localizacao' contém a sigla do estado. Se for só cidade, precisa ajustar.
    const passaEstado = estadosSelecionados.length === 0 || (
      empresa.localizacao && estadosSelecionados.some(sigla =>
        // Compara ignorando case e espaços extras
        empresa.localizacao.toUpperCase().includes(sigla.toUpperCase())
      )
    );

    // --- Filtro de Categoria ---
    // A empresa passa se nenhuma categoria for selecionada OU se seu array 'categorias' contiver algum dos nomes selecionados.
    const passaCategoria = categoriasSelecionadas.length === 0 || (
      empresa.categorias && Array.isArray(empresa.categorias) && empresa.categorias.some(catEmpresa => // Garante que é array
        categoriasSelecionadas.some(catSelecionada =>
          catEmpresa.trim().toLowerCase() === catSelecionada.trim().toLowerCase() // Compara nomes (case-insensitive)
        )
      )
    );

    // --- Filtro de Produto ---
    // A empresa passa se o termo estiver vazio OU se seu array 'produtos' contiver algum item que inclua o termo.
    const passaProduto = termoProduto === '' || (
      empresa.produtos && Array.isArray(empresa.produtos) && empresa.produtos.some(prod => // Garante que é array
        prod.toLowerCase().includes(termoProduto)
      )
    );

    // --- Filtro de Busca Geral (Nome, Descrição Curta/Ramo, Sobre) ---
    // A empresa passa se o termo estiver vazio OU se o termo estiver contido em nome, descricao ou sobre.
    const passaBuscaGeral = termoBuscaGeral === '' || (
      (empresa.nome && empresa.nome.toLowerCase().includes(termoBuscaGeral)) ||
      (empresa.descricao && empresa.descricao.toLowerCase().includes(termoBuscaGeral)) ||
      (empresa.sobre && empresa.sobre.toLowerCase().includes(termoBuscaGeral))
    );

    // Retorna true apenas se passar em TODOS os filtros
    return passaEstado && passaCategoria && passaProduto && passaBuscaGeral;
  });

  // 6. Re-renderiza o catálogo SOMENTE com as empresas filtradas
  renderizarEmpresas(empresasFiltradas);
}