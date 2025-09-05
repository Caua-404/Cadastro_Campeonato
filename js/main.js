(() => {
  'use strict';

  // ===== Helpers =====
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);

  // ===== MENU MOBILE =====
  const toggle    = $('.menu-toggle');
  const mobileNav = $('#mobileNav') || $('.nav-mobile');
  const desktopMQ = window.matchMedia('(min-width: 1024px)');

  const closeMobileNav = () => {
    if (!mobileNav) return;
    if (!mobileNav.hasAttribute('hidden')) {
      mobileNav.setAttribute('hidden', '');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      // opcional: evitar foco em links quando oculto
      mobileNav.setAttribute('inert', '');
    }
  };

  const openMobileNav = () => {
    if (!mobileNav) return;
    mobileNav.removeAttribute('hidden');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    mobileNav.removeAttribute('inert');
  };

  // Fechar ao mudar para desktop
  if (desktopMQ && desktopMQ.addEventListener) {
    desktopMQ.addEventListener('change', (e) => {
      if (e.matches) closeMobileNav();
    });
  } else {
    // fallback via resize (antigos)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) closeMobileNav();
    });
  }

  // Toggle do menu
  if (toggle && mobileNav) {
    // garantir estado inicial coerente
    mobileNav.setAttribute('hidden', '');
    mobileNav.setAttribute('inert', '');

    toggle.addEventListener('click', () => {
      const isHidden = mobileNav.hasAttribute('hidden');
      if (isHidden) openMobileNav();
      else closeMobileNav();
    });

    // Fecha após clique em qualquer link dentro do menu
    mobileNav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link) closeMobileNav();
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // ===== ROLAGEM SUAVE (fallback simples) =====
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // atualiza hash (opcional, sem jump)
        history.pushState(null, '', id);
      }
    });
  });

  // ===== MÚSICA AMBIENTE =====
  // Começa pausado; botão alterna tocar/pausar.
  const audio    = $('#bgAudio');
  const musicBtn = $('#musicBtn');

    // Auto-play ao carregar (sujeito às políticas do navegador)
  if (audio) {
    audio.volume = 0.45;
    const start = () => { audio.play().catch(() => {}); };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    }

    // Fallback: primeira interação do usuário
    const onFirstGesture = async () => {
      if (audio.paused) {
        try { await audio.play(); } catch (_) {}
      }
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
  }

  function setMusicState(playing) {
    if (!musicBtn) return;
    musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicBtn.textContent = playing ? '❚❚ Pausar música' : '♪ Música';
    musicBtn.setAttribute('aria-label', playing ? 'Pausar música' : 'Tocar música');
  }

  if (musicBtn && audio) {
    audio.volume = 0.45;

    musicBtn.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          await audio.play();
          setMusicState(true);
        } else {
          audio.pause();
          setMusicState(false);
        }
      } catch (err) {
        console.warn('Não foi possível iniciar o áudio:', err);
      }
    });

    // Inicia ao primeiro gesto do usuário (alguns navegadores permitem)
    let firstInteractionBound = false;
    const bindFirstInteractionPlay = () => {
      if (firstInteractionBound) return;
      firstInteractionBound = true;
      const handler = async () => {
        if (audio.paused) {
          try {
            await audio.play();
            setMusicState(true);
          } catch (_) { /* ignorado */ }
        }
        window.removeEventListener('pointerdown', handler);
        window.removeEventListener('keydown', handler);
      };
      window.addEventListener('pointerdown', handler, { once: true, passive: true });
      window.addEventListener('keydown', handler, { once: true });
    };
    bindFirstInteractionPlay();
  }
})();
