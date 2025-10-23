document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.querySelector('#form-login');

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = formLogin.email.value;
    const senha = formLogin.senha.value;


    // Salva login local
    localStorage.setItem('usuarioLogado', email);
    window.location.href = 'index.html';
  });
});
