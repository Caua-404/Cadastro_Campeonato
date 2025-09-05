/* =========================================================
   Formulário de Inscrição — Karatê Shotokan
   - Todos os campos obrigatórios
   - Máscaras (telefone, data)
   - Calendário nativo + máscara BR
   - Graduação com seletor custom (esfera colorida)
   - Coletor unificado (para o PDF)
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => r.querySelectorAll(s);

  const form = $('#enrollForm');
  const msg  = $('#formMsg');

  const onlyDigits = (s) => (s || '').replace(/\D+/g, '');
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');

  const parseBRDate = (s) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || '');
    if (!m) return null;
    const [_, dd, mm, yyyy] = m;
    const d = new Date(+yyyy, (+mm)-1, +dd);
    return (d && d.getFullYear() === +yyyy && (d.getMonth()+1) === +mm && d.getDate() === +dd) ? d : null;
  };
  const ageOn = (birth, on = new Date()) => {
    if (!birth) return null;
    let a = on.getFullYear() - birth.getFullYear();
    const m = on.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && on.getDate() < birth.getDate())) a--;
    return a;
  };

  // telefone
  const tel = $('#telefone');
  tel?.addEventListener('input', () => {
    let d = onlyDigits(tel.value).slice(0, 11);
    if (d.length > 6) tel.value = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    else if (d.length > 2) tel.value = `(${d.slice(0,2)}) ${d.slice(2)}`;
    else tel.value = d;
  });

  // UF uppercase
  const uf = $('#uf');
  uf?.addEventListener('input', () => { uf.value = uf.value.toUpperCase().slice(0,2); });

  // data: máscara + calendário
  const dobText   = $('#data_nascimento');
  const dobNative = $('#data_nascimento_picker');
  const dobBtn    = $('.calendar-ico');

  dobText?.addEventListener('input', () => {
    let d = onlyDigits(dobText.value).slice(0,8);
    if (d.length > 4) dobText.value = `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
    else if (d.length > 2) dobText.value = `${d.slice(0,2)}/${d.slice(2)}`;
    else dobText.value = d;
  });
  dobBtn?.addEventListener('click', () => { dobNative?.showPicker?.() || dobNative?.click(); });
  dobNative?.addEventListener('change', () => {
    if (!dobNative.value) return;
    const [yyyy, mm, dd] = dobNative.value.split('-');
    dobText.value = `${dd}/${mm}/${yyyy}`;
    dobText.dispatchEvent(new Event('blur', { bubbles:true }));
  });
  dobText?.addEventListener('blur', () => {
    const d = parseBRDate(dobText.value);
    const idade = ageOn(d);
    $('#idade_atual').value = (idade ?? '').toString();
    if (d && dobNative) {
      const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
      dobNative.value = `${yyyy}-${mm}-${dd}`;
      dobText.classList.remove('is-invalid');
    } else dobText.classList.add('is-invalid');
  });

  // Graduação custom (esfera + lista)
  const beltField = $('.belt-field');
  const beltInput = $('#graduacao_input');
  const beltHidden= $('#graduacao');
  const beltToggle= $('.belt-toggle');
  const beltList  = $('.belt-list');

  const closeBelt = () => { beltField?.classList.remove('open'); beltInput?.setAttribute('aria-expanded','false'); };
  const openBelt  = () => { beltField?.classList.add('open');    beltInput?.setAttribute('aria-expanded','true');  };

  beltToggle?.addEventListener('click', (e) => { e.stopPropagation(); beltField.classList.contains('open') ? closeBelt() : openBelt(); });
  beltInput?.addEventListener('click', (e) =>  { e.stopPropagation(); beltField.classList.contains('open') ? closeBelt() : openBelt(); });
  document.addEventListener('click', (e) => { if (!beltField.contains(e.target)) closeBelt(); });

  beltList?.addEventListener('mouseover', (e) => {
    const li = e.target.closest('li[role="option"]'); if (!li) return;
    beltField.style.setProperty('--belt-color', li.dataset.color || '#e5e7eb');
  });
  beltList?.addEventListener('click', (e) => {
    const li = e.target.closest('li[role="option"]'); if (!li) return;
    const val = li.dataset.value || '', c = li.dataset.color || '#e5e7eb';
    beltHidden.value = val; beltInput.value = val; beltField.dataset.belt = val;
    beltField.style.setProperty('--belt-color', c);
    beltInput.classList.remove('is-invalid'); closeBelt();
  });
  beltField?.style.setProperty('--belt-color', '#e5e7eb');

  // validação e coleta
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.textContent = '';
    let ok = true;
    const invalid = (el) => { el?.classList.add('is-invalid'); ok = false; };
    const valid   = (el) => el?.classList.remove('is-invalid');

    const nome = $('#nome'), sexo = $('#sexo'), data = $('#data_nascimento'),
          grad = $('#graduacao'), gradVis = $('#graduacao_input'),
          cidade = $('#cidade'), uf = $('#uf'), telefone = $('#telefone'),
          email = $('#email'), camp = $('#campeonato'), fed = $('#federacao');

    (!nome.value || nome.value.trim().length < 3) ? invalid(nome) : valid(nome);
    (!sexo.value) ? invalid(sexo) : valid(sexo);

    const d = parseBRDate(data.value);
    (!d) ? invalid(data) : valid(data);

    (!grad.value) ? invalid(gradVis) : valid(gradVis);
    (!cidade.value) ? invalid(cidade) : valid(cidade);
    (!uf.value || uf.value.length !== 2) ? invalid(uf) : valid(uf);

    const telDigits = onlyDigits(telefone.value);
    (!telefone.value || telDigits.length < 10) ? invalid(telefone) : valid(telefone);

    (!email.value || !isEmail(email.value)) ? invalid(email) : valid(email);
    (!camp.value) ? invalid(camp) : valid(camp);
    (!fed.value)  ? invalid(fed)  : valid(fed);

    if (!ok) { msg.textContent = 'Por favor, preencha todos os campos corretamente.'; return; }

    const idadeCalc = ageOn(d);
    $('#idade_atual').value = (idadeCalc ?? '').toString();

    const payload = collectFormData();
    console.log('Dados prontos:', payload);
    msg.textContent = 'Dados validados e salvos localmente.';
    form.dataset.lastSaved = new Date().toISOString();
  });

  function collectFormData(){
    const d = parseBRDate($('#data_nascimento').value);
    const idade = ageOn(d);
    $('#idade_atual').value = (idade ?? '').toString();
    return {
      campeonato: $('#campeonato').value || '',
      federacao:  $('#federacao').value || '',
      nome:       $('#nome').value || '',
      sexo:       $('#sexo').value || '',
      data_nascimento: $('#data_nascimento').value || '',
      idade_atual: $('#idade_atual').value || '',
      graduacao:  $('#graduacao').value || '',
      cidade:     $('#cidade').value || '',
      uf:         $('#uf').value || '',
      telefone:   $('#telefone').value || '',
      email:      $('#email').value || ''
    };
  }

  window.SHOTOKAN_COLLECT = collectFormData;

  document.getElementById('btnPdf')?.addEventListener('click', () => {
    const data = window.SHOTOKAN_COLLECT?.() || {};
    window.generateAthletePDF?.(data);
  });

})();
