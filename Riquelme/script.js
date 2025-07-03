document.addEventListener('DOMContentLoaded', function () {
  const radios = document.querySelectorAll('input[name="presenca"]');
  const campoOculto = document.getElementById('confirmacaoOculta');
  const campoEmail = document.getElementById('emailOculto');
  const inputNome = document.getElementById('nome');
  const formulario = document.getElementById('mc-embedded-subscribe-form'); // ID correto do formulário

  // Atualiza o campo de presença oculto ao mudar
  radios.forEach(radio => {
    radio.addEventListener('change', function () {
      campoOculto.value = this.value;
      console.log('Valor oculto atualizado:', campoOculto.value);
    });
  });

  // Ao submeter o formulário, preenche os campos e redireciona
  formulario.addEventListener('submit', function () {
    const nome = inputNome.value.trim();
    const presenca = campoOculto.value;

    const email = nome.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '.') + '@gmail.com';

    campoEmail.value = email;
    console.log('E-mail gerado automaticamente:', email);

    // WhatsApp
    const telefoneNoivo = '559492647476';
    const mensagem = `Olá! Aqui é ${nome}. ${presenca}.`;
    const urlWhatsapp = `https://wa.me/${telefoneNoivo}?text=${encodeURIComponent(mensagem)}`;

    // Delay para envio do formulário e redirecionamento
    setTimeout(() => {
      window.location.href = urlWhatsapp;
    }, 1000);
  });

  // 🌸 Efeito das pétalas
  const container = document.getElementById('petalas-container');
  const totalPetalas = 25;

  for (let i = 0; i < totalPetalas; i++) {
    const petala = document.createElement('img');
    petala.src = '/Riquelme/IMG/Petalas.png';
    petala.classList.add('petala');

    const size = Math.random() * 20 + 20;
    petala.style.width = `${size}px`;
    petala.style.left = `${Math.random() * 100}%`;
    petala.style.animationDuration = `${5 + Math.random() * 5}s`;
    petala.style.animationDelay = `${Math.random() * 5}s`;

    container.appendChild(petala);
  }
});