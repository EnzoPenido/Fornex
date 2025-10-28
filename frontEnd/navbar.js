// ===============================================
//         SCRIPT GLOBAL DA NAVBAR (v3 - Com Upload)
// ===============================================

// Helper: Pega a sessão do localStorage
function getSessaoUsuario() {
    const sessao = localStorage.getItem('sessaoUsuario');
    if (sessao) {
        try {
            return JSON.parse(sessao);
        } catch (e) {
            console.error("Erro ao parsear sessão:", e);
            localStorage.removeItem('sessaoUsuario'); // Limpa sessão inválida
            return null;
        }
    }
    return null;
}

// Helper: Faz o logout
function fazerLogout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('sessaoUsuario');
    alert('Você foi desconectado.');
    window.location.href = 'index.html';
}

// Roda quando o HTML carregar
document.addEventListener('DOMContentLoaded', () => {
    const sessao = getSessaoUsuario();

    // Referências do Desktop
    const defaultButtons = document.getElementById('navbar-default-buttons');
    const userDropdown = document.getElementById('navbar-user-dropdown');
    const profilePic = document.getElementById('navbar-profile-pic');
    const dropdownMenu = document.getElementById('navbar-dropdown-menu');

    // Referências do Mobile
    const defaultButtonsMobile = document.getElementById('navbar-default-buttons-mobile');
    const userLinksMobile = document.getElementById('navbar-user-links-mobile');

    if (sessao) {
        // --- USUÁRIO ESTÁ LOGADO ---

        // Esconde botões padrão e mostra o dropdown do usuário
        if (defaultButtons) defaultButtons.style.display = 'none';
        if (defaultButtonsMobile) defaultButtonsMobile.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'block';
        if (userLinksMobile) userLinksMobile.style.display = 'block';

        let linkSair = '<li><a class="dropdown-item" href="#" id="logout-link-desktop">Sair</a></li>';
        let linkSairMobile = '<a class="d-block btn btn-danger mb-2" href="#" id="logout-link-mobile">Sair</a>';
        let imgSource = '/img/IconeConta.png'; // Imagem padrão

        if (sessao.tipo === 'empresa') {
            // --- LÓGICA DA EMPRESA ---
            if (sessao.dados && sessao.dados.imagem) { // Verifica se dados e imagem existem
                imgSource = sessao.dados.imagem;
            }
            let linkEditar = `<li><a class="dropdown-item" href="empresa.html?id=${sessao.dados.id}">Editar Página</a></li>`;

            if (dropdownMenu) dropdownMenu.innerHTML = linkEditar + linkSair;
            if (userLinksMobile) userLinksMobile.innerHTML = `<a class="d-block nav-mobile-link mb-2" href="empresa.html?id=${sessao.dados.id}">Editar Página</a>` + linkSairMobile;

        } else if (sessao.tipo === 'cliente') {
            // --- LÓGICA DO CLIENTE (COM UPLOAD) ---
            if (sessao.dados && sessao.dados.imagemPerfil) { // Verifica se dados e imagemPerfil existem
                imgSource = sessao.dados.imagemPerfil;
            }
            let linkTrocarFoto = `<li><a class="dropdown-item" href="#" id="trocar-foto-link-desktop">Trocar Foto de Perfil</a></li>`;

            if (dropdownMenu) dropdownMenu.innerHTML = linkTrocarFoto + linkSair;
            if (userLinksMobile) userLinksMobile.innerHTML = `<a class="d-block nav-mobile-link mb-2" href="#" id="trocar-foto-link-mobile">Trocar Foto</a>` + linkSairMobile;

            // Ativa a função de upload apenas se os dados do cliente (incluindo CPF) existirem
            if (sessao.dados && sessao.dados.cpf) {
                ativarUploadCliente(sessao.dados.cpf);
            } else {
                console.error("CPF do cliente não encontrado na sessão para ativar upload.");
            }
        }

        // Define a foto de perfil na navbar
        if (profilePic) profilePic.src = imgSource;

        // Adiciona evento de clique para Sair (Desktop e Mobile)
        const logoutDesktop = document.getElementById('logout-link-desktop');
        const logoutMobile = document.getElementById('logout-link-mobile');
        if (logoutDesktop) logoutDesktop.addEventListener('click', fazerLogout);
        if (logoutMobile) logoutMobile.addEventListener('click', fazerLogout);

    } else {
        // --- USUÁRIO NÃO ESTÁ LOGADO ---
        if (defaultButtons) defaultButtons.style.display = 'flex'; // Use flex para alinhar corretamente
        if (defaultButtonsMobile) defaultButtonsMobile.style.display = 'block';
        if (userDropdown) userDropdown.style.display = 'none';
        if (userLinksMobile) userLinksMobile.style.display = 'none';
    }
});


/**
 * Cria um input de arquivo invisível e o ativa quando o usuário clica
 * nos links "Trocar Foto".
 * @param {string} cpf - O CPF do usuário logado, para a rota da API.
 */
function ativarUploadCliente(cpf) {
    // Verifica se o input já existe para evitar duplicatas
    let fileInput = document.getElementById('hidden-profile-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.id = 'hidden-profile-input'; // Adiciona um ID
        document.body.appendChild(fileInput);

        // Adiciona o listener de 'change' apenas uma vez
        fileInput.addEventListener('change', async () => {
            if (fileInput.files.length === 0) {
                return; // Usuário cancelou
            }

            const formData = new FormData();
            formData.append('imagem', fileInput.files[0]);

            // Pega o CPF novamente da sessão ATUALIZADA no momento do upload
            const sessaoAtualizada = getSessaoUsuario();
            if (!sessaoAtualizada || sessaoAtualizada.tipo !== 'cliente' || !sessaoAtualizada.dados.cpf) {
                alert('Erro: Sessão inválida. Por favor, faça login novamente.');
                return;
            }
            const cpfAtualizado = sessaoAtualizada.dados.cpf;


            try {
                // Envia o arquivo para o backend
                const resposta = await fetch(`/api/usuario/upload-perfil/${cpfAtualizado}`, {
                    method: 'POST',
                    body: formData
                });

                const resultado = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(resultado.erro || 'Falha ao enviar imagem.');
                }

                // SUCESSO! Atualiza o localStorage e a imagem na tela
                const sessaoParaSalvar = getSessaoUsuario(); // Pega a sessão novamente
                if (sessaoParaSalvar) { // Garante que ainda existe
                    sessaoParaSalvar.dados = resultado.usuario; // Atualiza com os novos dados
                    localStorage.setItem('sessaoUsuario', JSON.stringify(sessaoParaSalvar));
                }

                // Atualiza a foto na navbar IMEDIATAMENTE
                const profilePic = document.getElementById('navbar-profile-pic');
                if (profilePic) {
                    // Adiciona um timestamp para forçar o navegador a recarregar a imagem
                    profilePic.src = resultado.imagemPath + '?t=' + new Date().getTime();
                }

                alert(resultado.message);
                fileInput.value = ''; // Limpa o input para permitir selecionar o mesmo arquivo novamente

            } catch (erro) {
                console.error('Erro ao salvar:', erro);
                alert(`Erro ao salvar: ${erro.message}`);
                fileInput.value = ''; // Limpa o input em caso de erro também
            }
        });
    }


    // Adiciona o gatilho aos links (Desktop e Mobile)
    const linkDesktop = document.getElementById('trocar-foto-link-desktop');
    const linkMobile = document.getElementById('trocar-foto-link-mobile');

    // Remove listeners antigos antes de adicionar novos para evitar múltiplos cliques
    const cloneDesktop = linkDesktop ? linkDesktop.cloneNode(true) : null;
    const cloneMobile = linkMobile ? linkMobile.cloneNode(true) : null;

    if (linkDesktop && cloneDesktop) {
        linkDesktop.parentNode.replaceChild(cloneDesktop, linkDesktop);
        cloneDesktop.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }
    if (linkMobile && cloneMobile) {
        linkMobile.parentNode.replaceChild(cloneMobile, linkMobile);
        cloneMobile.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }
}