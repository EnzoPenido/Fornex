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
  await carregarFiltrosEstados();
  await carregarEmpresas();
  await carregarFiltrosCategorias();
  aplicarTodosOsFiltros();
}

// --- 1. FUNÇÕES DE CARREGAMENTO DE FILTROS ---

/**
 * Busca a lista de estados e cria os checkboxes.
 */
async function carregarFiltrosEstados() {
  const container = document.getElementById('filtro-estado-lista');
  try {
    const response = await fetch('/data/estados.json');
    if (!response.ok) throw new Error('Falha ao carregar estados');

    const estados = await response.json();
    container.innerHTML = '';

    estados.forEach(estado => {
      const div = document.createElement('div');
      div.className = 'form-check';
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
 * GERA a lista de categorias dinamicamente a partir das empresas carregadas.
 */
async function carregarFiltrosCategorias() {
  const container = document.getElementById('filtro-categoria-lista');
  try {
    const todasAsCategoriasComDuplicatas = [];
    todasEmpresas.forEach(empresa => {
      if (empresa.categorias && Array.isArray(empresa.categorias)) {
        todasAsCategoriasComDuplicatas.push(...empresa.categorias);
      }
    });

    const categoriasUnicas = [...new Set(todasAsCategoriasComDuplicatas)];
    categoriasUnicas.sort();
    container.innerHTML = '';

    if (categoriasUnicas.length === 0) {
      container.innerHTML = '<small class="text-muted">Nenhuma categoria cadastrada.</small>';
      return;
    }

    categoriasUnicas.forEach(catNome => {
      const catId = catNome.replace(/\s/g, '');
      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
        <input class="form-check-input filtro-categoria" type="checkbox" value="${catNome}" id="cat-${catId}">
        <label class="form-label" for="cat-${catId}">
          ${catNome}
        </label>
      `;
      container.appendChild(div);
    });

    document.querySelectorAll('.filtro-categoria').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        filtrosAtivos.categorias = Array.from(document.querySelectorAll('.filtro-categoria:checked'))
          .map(cb => cb.value);
        aplicarTodosOsFiltros();
      });
    });

  } catch (error) {
    console.error("Erro ao processar categorias:", error);
    container.innerHTML = '<small class="text-danger">Erro ao processar categorias.</small>';
  }
}

// --- 2. FUNÇÃO DE CARREGAMENTO DE EMPRESAS ---

/**
 * Busca a lista de TODAS as empresas e guarda na variável global.
 */
async function carregarEmpresas() {
  const container = document.getElementById('catalogoEmpresas');
  try {
    const response = await fetch('/data/empresas.json'); // Usando o novo empresas.json
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
 * Pega a lista 'todasEmpresas' e aplica os 'filtrosAtivos'.
 */
function aplicarTodosOsFiltros() {
  let empresasFiltradas = [...todasEmpresas];

  // 1. Filtro de Estado
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

  // 3. Filtro de Produto
  if (filtrosAtivos.produto) {
    const termo = filtrosAtivos.produto.toLowerCase();
    empresasFiltradas = empresasFiltradas.filter(empresa =>
      empresa.produtos && empresa.produtos.some(prod => prod.toLowerCase().includes(termo))
    );
  }

  // 4. Filtro Principal
  if (filtrosAtivos.termoPrincipal) {
    const termo = filtrosAtivos.termoPrincipal.toLowerCase();
    empresasFiltradas = empresasFiltradas.filter(empresa =>
      (empresa.nome && empresa.nome.toLowerCase().includes(termo)) ||
      (empresa.descricao && empresa.descricao.toLowerCase().includes(termo))
    );
  }

  // 5. Renderiza o resultado
  renderizarEmpresas(empresasFiltradas);
}

/**
 * Cria o HTML para as tags de categoria.
 */
function gerarTagsHtml(categorias) {
  if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
    return '';
  }
  const tags = categorias.map(cat =>
    `<span class="card-category-tag">${cat}</span>`
  ).join('');
  return `<div class="card-category-container">${tags}</div>`;
}


/**
 * Desenha os cartões das empresas na tela.
 */
function renderizarEmpresas(empresasParaRenderizar) {
  const container = document.getElementById('catalogoEmpresas');

  // ======================================================
  //           NOVA LÓGICA DE ORDENAÇÃO (SORTEIO)
  // ======================================================
  // Coloca Premium no topo
  empresasParaRenderizar.sort((a, b) => {
    // Se 'a' é Premium e 'b' não é, 'a' vem antes (retorna -1).
    if (a.plano === 'Premium' && b.plano !== 'Premium') {
      return -1;
    }
    // Se 'b' é Premium e 'a' não é, 'b' vem antes (retorna 1).
    if (a.plano !== 'Premium' && b.plano === 'Premium') {
      return 1;
    }
    // Se ambos são iguais (ambos Premium ou ambos Comum), mantém a ordem.
    return 0;
  });
  // ======================================================
  //               FIM DA LÓGICA DE ORDENAÇÃO
  // ======================================================


  container.innerHTML = ''; // Limpa o container *depois* de ordenar

  if (empresasParaRenderizar.length === 0) {
    container.innerHTML = `<p class="col-12 text-center text-muted mt-4">Nenhum fornecedor encontrado com os filtros selecionados.</p>`;
    return;
  }

  empresasParaRenderizar.forEach(empresa => {
    const descricaoCurta = (empresa.descricao || '').substring(0, 100);
    const tagsHtml = gerarTagsHtml(empresa.categorias);
    // Verifica se a empresa é Premium
    const isPremium = empresa.plano === 'Premium';

    // Define a classe base e adiciona 'card-premium' se for o caso
    const cardClasses = `card h-100 shadow-sm ${isPremium ? 'card-premium' : ''}`;

    const cartaoHTML = `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="${cardClasses}">
          <img src="${empresa.imagem || '/img/IconeConta.png'}" class="card-img-top" alt="${empresa.nome}" style="height: 200px; object-fit: fill;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${empresa.nome || 'Nome não informado'}</h5>
            
            ${tagsHtml}
            
            <p class="card-text text-muted flex-grow-1">${descricaoCurta}...</p>
            
            <small class="text-muted mb-2">
              <i class="bi bi-geo-alt-fill"></i> ${empresa.localizacao || 'Não informado'}
            </small>
            <small class="text-muted mb-2">
              <i class="bi bi-telephone-fill"></i> ${empresa.telefone || 'Não informado'}
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

function corrigirLayoutFiltroProduto() {
  const accordionBody = document.querySelector('#collapseProdutos .accordion-body');
  if (accordionBody) {
    accordionBody.style.cssText = "padding: 0 !important;";
    accordionBody.innerHTML = `<div style="padding: 1rem;">${accordionBody.innerHTML}</div>`;
  }
}