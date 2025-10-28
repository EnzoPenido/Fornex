document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.querySelector('#form-login');

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = formLogin.email.value;
    const senha = formLogin.senha.value;

    if (!email || !senha) {
      return alert('Por favor, preencha o e-mail e a senha.');
    }

    try {
      const resposta = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        // Se a resposta não for OK (ex: 401 Não Autorizado)
        alert(resultado.message || 'Erro ao fazer login.');
      } else {
        // Salva a sessão completa (tipo: 'cliente'/'empresa' e os dados)
        localStorage.setItem('sessaoUsuario', JSON.stringify(resultado));

        alert(resultado.message);

        // Redireciona para o catálogo
        window.location.href = 'catalogo.html';
      }

    } catch (erro) {
      console.error('Erro de rede:', erro);
      alert('Falha ao conectar com o servidor.');
    }
  });
});