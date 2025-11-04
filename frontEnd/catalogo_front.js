// ===============================================
//         SCRIPT DA PÁGINA DE CATÁLOGO
// ===============================================

// Variável global para guardar todas as empresas.
let todasEmpresas = [];

// Objeto para guardar o estado atual dos filtros
let filtrosAtivos = {
  estados: [],
  categorias: [],
  produto: "",
  termoPrincipal: ""
};

// --- PONTO DE PARTIDA: Carrega tudo quando a página abre ---
document.addEventListener('DOMContentLoaded', () => {
  corrigirLayoutFiltroProduto();
  carregarPaginaCatalogo();
  adicionarListenersDeBusca();
});


/**
 * Função principal que orquestra o carregamento da página.
 */
async function carregarPaginaCatalogo() {
  // Carrega os 3 arquivos em paralelo
  await Promise.all([
    carregarFiltrosEstados(),
    carregarFiltrosCategorias(),
    carregarEmpresas()
  ]);

  // Só aplica os filtros depois que tudo for carregado
  aplicarTodosOsFiltros();
}

// --- 1. FUNÇÕES DE CARREGAMENTO DE FILTROS ---

/**
 * Busca a lista de estados e cria os checkboxes.
 */
async function carregarFiltrosEstados() {
  const container = document.getElementById('filtro-estado-lista');
  try {
    const response = await fetch('/data/estados.json'); // Caminho OK
    if (!response.ok) throw new Error('Falha ao carregar estados');

    const estados = await response.json();
    container.innerHTML = '';

    estados.forEach(estado => {
      const div = document.createElement('div');
      div.className = 'form-check';
      // Correto: usa estado.nome
      div.innerHTML = `
        <input class="form-check-input filtro-estado" type="checkbox" value="${estado.nome}" id="estado-${estado.sigla}">
        <label class="form-check-label" for="estado-${estado.sigla}">
          ${estado.nome}
        </label>
      `;
      container.appendChild(div);
    });

    // Adiciona os listeners
    document.querySelectorAll('.filtro-estado').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        filtrosAtivos.estados = Array.from(document.querySelectorAll('.filtro-estado:checked'))
          .map(cb => cb.value);
        aplicarTodosOsFiltros();
      });
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = '<small class="text-danger">Erro ao carregar estados.</small>';
  }
}

/**
 * Busca a lista de categorias e cria os checkboxes.
 */
async function carregarFiltrosCategorias() {
  const container = document.getElementById('filtro-categoria-lista');
  try {
    const response = await fetch('/data/categorias.json');
    if (!response.ok) throw new Error('Falha ao carregar categorias');

    const categorias = await response.json();
    container.innerHTML = '';

    categorias.forEach(cat => {

      const catNome = cat.nome; // Pega o nome (ex: "Metalurgia")
      const catId = catNome.replace(/\s/g, ''); // Agora o .replace() funciona na string 'catNome'

      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
        <input class="form-check-input filtro-categoria" type="checkbox" value="${catNome}" id="cat-${catId}">
        <label class="form-check-label" for="cat-${catId}">
          ${catNome}
        </label>
      `;
      container.appendChild(div);
    });

    // Adiciona os listeners
    document.querySelectorAll('.filtro-categoria').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        filtrosAtivos.categorias = Array.from(document.querySelectorAll('.filtro-categoria:checked'))
          .map(cb => cb.value);
        aplicarTodosOsFiltros();
      });
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = '<small class="text-danger">Erro ao carregar categorias.</small>';
  }
}

// --- 2. FUNÇÃO DE CARREGAMENTO DE EMPRESAS ---

/**
 * Busca a lista de TODAS as empresas e guarda na variável global.
 */
async function carregarEmpresas() {
  const container = document.getElementById('catalogoEmpresas');
  try {
    const response = await fetch('/data/empresas.json');
    if (!response.ok) throw new Error('Falha ao carregar empresas');

    todasEmpresas = await response.json();

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="col-12 text-center text-danger mt-4">
                            Erro grave ao carregar fornecedores. Tente novamente mais tarde.
                           </p>`;
  }
}

// --- 3. FUNÇÕES DE FILTRO E RENDERIZAÇÃO ---

/**
 * Adiciona listeners nas barras de busca (a do navbar e a da sanfona)
 */
function adicionarListenersDeBusca() {
  const buscaPrincipal = document.querySelector('nav .search-bar');
  const buscaProduto = document.querySelector('#collapseProdutos .search-bar');

  if (buscaPrincipal) {
    buscaPrincipal.addEventListener('input', (e) => {
      filtrosAtivos.termoPrincipal = e.target.value.trim();
      aplicarTodosOsFiltros();
    });
  }

  if (buscaProduto) {
    buscaProduto.addEventListener('input', (e) => {
      filtrosAtivos.produto = e.target.value.trim();
      aplicarTodosOsFiltros();
    });
  }
}

/**
 * O CÉREBRO DA PÁGINA:
 * Pega a lista 'todasEmpresas' e aplica os 'filtrosAtivos'.
 */
function aplicarTodosOsFiltros() {
  let empresasFiltradas = [...todasEmpresas];

  // 1. Filtro de Estado (localizacao)
  if (filtrosAtivos.estados.length > 0) {
    empresasFiltradas = empresasFiltradas.filter(empresa =>
      empresa.localizacao && filtrosAtivos.estados.includes(empresa.localizacao)
    );
  }

  // 2. Filtro de Categoria
  if (filtrosAtivos.categorias.length > 0) {
    empresasFiltradas = empresasFiltradas.filter(empresa =>
      empresa.categorias && empresa.categorias.some(cat => filtrosAtivos.categorias.includes(cat))
    );
  }

  // 3. Filtro de Produto (input da sanfona)
  if (filtrosAtivos.produto) {
    const termo = filtrosAtivos.produto.toLowerCase();
    empresasFiltradas = empresasFiltradas.filter(empresa =>
      empresa.produtos && empresa.produtos.some(prod => prod.toLowerCase().includes(termo))
    );
  }

  // 4. Filtro Principal (input do navbar - busca por nome ou descrição)
  if (filtrosAtivos.termoPrincipal) {
    const termo = filtrosAtivos.termoPrincipal.toLowerCase();
    empresasFiltradas = empresasFiltradas.filter(empresa =>
      (empresa.nome && empresa.nome.toLowerCase().includes(termo)) ||
      (empresa.descricao && empresa.descricao.toLowerCase().includes(termo))
    );
  }

  renderizarEmpresas(empresasFiltradas);
}

/**
 * Desenha os cartões das empresas na tela.
 */
function renderizarEmpresas(empresasParaRenderizar) {
  const container = document.getElementById('catalogoEmpresas');
  container.innerHTML = '';

  if (empresasParaRenderizar.length === 0) {
    container.innerHTML = `<p class="col-12 text-center text-muted mt-4">
                            Nenhum fornecedor encontrado com os filtros selecionados.
                           </p>`;
    return;
  }

  empresasParaRenderizar.forEach(empresa => {
    const descricaoCurta = (empresa.descricao || '').substring(0, 100);

    const cartaoHTML = `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100 shadow-sm">
          <img src="${empresa.imagem || '/img/IconeConta.png'}" class="card-img-top" alt="${empresa.nome}" style="height: 200px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${empresa.nome || 'Nome não informado'}</h5>
            <p class="card-text text-muted flex-grow-1">${descricaoCurta}...</p>
            <small class="text-muted mb-2">
              <i class="bi bi-geo-alt-fill"></i> ${empresa.localizacao || 'Não informado'}
            </small>
          </div>
          <div class="card-footer bg-white border-0">
            <a href="empresa.html?id=${empresa.id}" class="btn btn-primary w-100">Ver Perfil</a>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cartaoHTML;
  });
}


/**
 * Correção de layout da sanfona (do nosso chat anterior)
 */
function corrigirLayoutFiltroProduto() {
  const accordionBody = document.querySelector('#collapseProdutos .accordion-body');
  if (accordionBody) {
    accordionBody.style.cssText = "padding: 0 !important;";
    accordionBody.innerHTML = `<div style="padding: 1rem;">${accordionBody.innerHTML}</div>`;
  }
}