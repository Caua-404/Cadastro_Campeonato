/* ============================================
   PDF do Atleta — Karatê Shotokan + WhatsApp Share
   - Watermark central
   - Seções fortes (vermelho institucional + bold)
   - Rodapé: bandeira/logos
   - Recalcula idade via DD/MM/AAAA
   - Nome do arquivo baseado no atleta
   - Envio para WhatsApp:
       * Mobile (Web Share API): anexa o PDF + texto
       * Desktop (fallback): abre WhatsApp com texto e baixa o PDF
   ============================================ */
(() => {
  'use strict';

  // ================== CONFIG WHATSAPP ==================
  // Coloque aqui o número de destino COM DDI e DDD, só dígitos (ex.: 5591987654321).
  // Deixe vazio ('') para abrir o WhatsApp pedindo que o usuário escolha o contato (mobile).
  // ================== CONFIG WHATSAPP ==================
  const WHATSAPP_NUMBER = '559492647476'; // +55 94 9264-7476 (somente dígitos p/ wa.me)


  // Texto da mensagem enviada
  function buildWhatsAppMessage(formData, tituloEvento) {
    const nome = (formData?.nome || '').trim();
    const evento = (tituloEvento || formData?.campeonato || '').trim();
    return `Olá, meu nome é ${nome} e aqui está o meu PDF de inscrição para o ${evento}.`;
  }

  // =====================================================

  try {
    if (window.pdfMake && window.pdfFonts && window.pdfFonts.pdfMake && !window.pdfMake.vfs) {
      window.pdfMake.vfs = window.pdfFonts.pdfMake.vfs;
    }
  } catch(_) {}

  // utils
  const toDataURL = async (src) => {
    if (!src) return null;
    try {
      const res = await fetch(src, { cache: 'no-store' });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(blob);
      });
    } catch { return null; }
  };
  const beltColorHex = (fx) => {
    const map = {
      'Branca':  '#f1f5f9',
      'Amarela': '#ffe66a',
      'Vermelha':'#ff2a2a',
      'Laranja': '#ff9d1a',
      'Verde':   '#18c97a',
      'Roxa':    '#9b7bff',
      'Marrom':  '#a16207',
      'Preta':   '#111111'
    };
    return map[fx] || '#e5e7eb';
  };
  const normalize = (s) => (s || '').trim();
  const toUpperNoAcc = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const toFileSlug = (s='atleta') =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
     .replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();

  // datas
  function parseBRDate(s) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || '');
    if (!m) return null;
    const [_, dd, mm, yyyy] = m;
    const d = new Date(+yyyy, (+mm)-1, +dd);
    return (d && d.getFullYear() === +yyyy && (d.getMonth()+1) === +mm && d.getDate() === +dd) ? d : null;
  }
  function ageOn(birth, on = new Date()) {
    if (!birth) return null;
    let a = on.getFullYear() - birth.getFullYear();
    const m = on.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && on.getDate() < birth.getDate())) a--;
    return a;
  }

  // título de seção
  function sectionTitle(text, colorPrim){
    return {
      table: {
        widths: ['*'],
        body: [[{
          text,
          bold: true,
          fontSize: 13,
          color: '#111111',
          fillColor: colorPrim,
          margin: [10,7,10,7]
        }]]
      },
      layout: 'noBorders',
      margin: [0, 14, 0, 8]
    };
  }

  // dados fixos do campeonato
  const EVENTO_FIXO = {
    datas:  '27 e 28 de setembro',
    local:  'Ginásio Poliesportivo',
    cidade: 'Itupiranga',
    uf:     'PA'
  };

  async function buildDocDef(data) {
    const COR = { prim: '#D50000', texto: '#111', bgClaro: '#EEECEC' };

    // imagens
    const logoShotokan = await toDataURL('assets/shotokan-logo.png');
    const flagCanaa    = await toDataURL('assets/bandeira-canaa.png');
    const logoAgape    = await toDataURL('assets/logo-agape.png');
    const logoFed      = await toDataURL('assets/logo-federacao.png');

    // idade
    const birthPdf    = parseBRDate(data.data_nascimento);
    const ageComputed = ageOn(birthPdf);
    const idadeShow   = (ageComputed != null) ? ageComputed
                     : (isFinite(+data.idade_atual) ? +data.idade_atual : '—');
    const isMinor     = (ageComputed != null) ? (ageComputed < 18) : (+data.idade_atual < 18);

    const beltHex = beltColorHex(data.graduacao);
    const tituloEvento = normalize(data.campeonato) || 'CAMPEONATO DE KARATÊ';
    const federacao    = normalize(data.federacao)  || '—';

    // watermark
    const PAGE_W = 595.28, PAGE_H = 841.89;
    const WATER_W = 560;
    const WATER_Y = (PAGE_H - WATER_W) / 2 - 40;
    const centerX = (PAGE_W - WATER_W) / 2;

    return {
      pageSize: 'A4',
      pageMargins: [40, 88, 40, 90],
      defaultStyle: { fontSize: 10, color: COR.texto },

      background: () => {
        const bg = [
          { canvas: [{ type: 'rect', x:0, y:0, w:PAGE_W, h:8, color: COR.prim }] },
          { canvas: [{ type: 'rect', x:0, y:8, w:PAGE_W, h:PAGE_H-8, color: COR.bgClaro }] }
        ];
        if (logoShotokan) {
          bg.push({
            image: logoShotokan,
            width: WATER_W,
            opacity: 0.16,
            absolutePosition: { x: centerX, y: Math.max(140, WATER_Y) }
          });
        }
        return bg;
      },

      header: () => ({
        margin: [40, 18, 40, 10],
        columns: [
          { width: 'auto', stack: [
            logoShotokan ? { image: logoShotokan, width: 44, height: 44 }
                         : { text: 'SHOTOKAN', bold: true, fontSize: 16, color: COR.prim }
          ]},
          {
            width: '*',
            stack: [
              { text: 'Karatê Shotokan', bold: true, fontSize: 14 },
              { text: `Federação: ${federacao}`, color: '#666' }
            ],
            margin: [8, 4, 0, 0]
          },
          {
            width: 'auto',
            stack: [
              { text: 'Ficha de Inscrição', alignment: 'right', bold: true, fontSize: 12, color: COR.prim },
              { text: tituloEvento, alignment: 'right', fontSize: 10 }
            ]
          }
        ],
        columnGap: 8
      }),

      footer: (currentPage, pageCount) => ({
        margin: [40, 8, 40, 16],
        stack: [
          {
            columns: [
              (flagCanaa ? { image: flagCanaa, width: 48, alignment: 'left' }   : { text:'', width:'auto' }),
              { text: '', width: '*' },
              (logoAgape ? { image: logoAgape, width: 54, alignment: 'center' } : { text:'', width:'auto' }),
              { text: '', width: '*' },
              (logoFed ? { image: logoFed, width: 54, alignment: 'right' }      : { text:'', width:'auto' })
            ],
            margin: [0, 0, 0, 6]
          },
          {
            columns: [
              { text: `Emitido em ${new Date().toLocaleString('pt-BR')}`, color: '#666' },
              { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', color: '#666' }
            ]
          }
        ]
      }),

      content: [
        { text: toUpperNoAcc(tituloEvento), alignment: 'center', fontSize: 16, bold: true, margin: [0,4,0,8], color: COR.prim },

        {
          margin: [0, 0, 0, 8],
          columns: [
            { text: `ATLETA: ${data.nome}`, style: 'h1' },
            {
              width: 'auto',
              table: { body: [[{
                text: `GRADUAÇÃO: ${data.graduacao || '—'}`,
                color: (data.graduacao === 'Preta' ? '#fff' : '#111'),
                fillColor: beltHex,
                margin: [8,4,8,4]
              }]]},
              layout: 'noBorders'
            }
          ],
          columnGap: 8
        },

        { canvas: [{ type:'line', x1:0, y1:0, x2:515, y2:0, lineWidth: 1.2, lineColor: '#c7c7c7' }], margin: [0, 0, 0, 6] },

        // ===== Informações do Atleta =====
        sectionTitle('Informações do Atleta', COR.prim),
        {
          columns: [
            [
              { text: `Sexo: ${data.sexo}` },
              { text: `Data de Nascimento: ${data.data_nascimento}` },
              { text: `Idade: ${idadeShow} anos` }
            ],
            [
              { text: `Cidade: ${data.cidade}` },
              { text: `UF: ${data.uf}` },
              { text: `Telefone: ${data.telefone}` },
              { text: `Email: ${data.email}` }
            ]
          ],
          columnGap: 18, margin: [0,2,0,10]
        },

        // ===== Informações do Campeonato =====
        sectionTitle('Informações do Campeonato', COR.prim),
        {
          columns: [
            [
              { text: `Campeonato: ${tituloEvento}` },
              { text: `Federação: ${federacao}` }
            ],
            [
              { text: `Data: ${EVENTO_FIXO.datas}` },
              { text: `Local: ${EVENTO_FIXO.local}` },
              { text: `Cidade/UF: ${EVENTO_FIXO.cidade} - ${EVENTO_FIXO.uf}` }
            ]
          ],
          columnGap: 18, margin: [0,2,0,4]
        },

        // ===== Autorização =====
        sectionTitle('Autorização', COR.prim),
        ...(isMinor ? [{
          table: {
            widths: ['*'],
            body: [[{ text:
              'AUTORIZAÇÃO DO RESPONSÁVEL LEGAL\n' +
              'Declaro estar ciente e autorizo a participação do(a) atleta no evento acima referido, ' +
              'assumindo responsabilidade pelas informações prestadas.',
              alignment: 'center' }]]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 6, 0, 0]
        }] : [{
          text: 'Declaro estar ciente e de acordo com a participação no evento acima referido.',
          alignment: 'center', margin: [0, 6, 0, 0]
        }]),

        { text: ' ', margin: [0, 46, 0, 0] },

        {
          columns: [
            (isMinor
              ? { width: '*', stack: [
                  { text: '____________________________________________', alignment: 'center' },
                  { text: 'Responsável Legal', alignment: 'center' }
                ]}
              : { width: '*', stack: [
                  { text: '____________________________________________', alignment: 'center' },
                  { text: 'Atleta', alignment: 'center' }
                ]}),
            { width: '*', stack: [
                { text: '____________________________________________', alignment: 'center' },
                { text: 'Mestre Responsável', alignment: 'center' }
              ]}
          ],
          columnGap: 24
        }
      ],

      styles: { h1: { fontSize: 12, bold: true } }
    };
  }

  // Geração + envio WhatsApp
  window.generateAthletePDF = async function generateAthletePDF(formData){
    try {
      if (window.pdfMake && window.pdfFonts && window.pdfFonts.pdfMake && !window.pdfMake.vfs) {
        window.pdfMake.vfs = window.pdfFonts.pdfMake.vfs;
      }
      if (!window.pdfMake || !window.pdfMake.createPdf) throw new Error('Biblioteca do PDF (pdfMake) não carregada.');

      const docDef = await buildDocDef(formData || {});
      const pdfDoc = window.pdfMake.createPdf(docDef);

      const tituloEvento = normalize(formData?.campeonato) || 'CAMPEONATO DE KARATÊ';
      const fname = 'ficha-' + toFileSlug(formData?.nome || 'atleta') + '.pdf';
      const message = buildWhatsAppMessage(formData, tituloEvento);

      // Tenta compartilhar com arquivo (mobile)
      pdfDoc.getBlob(async (blob) => {
        const file = new File([blob], fname, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              text: message,
              title: fname
            });
            // Compartilhado com sucesso; nada mais a fazer.
            return;
          } catch (err) {
            console.warn('Share cancelado/negado, aplicando fallback…', err);
          }
        }

        // Fallback (desktop): baixar PDF e abrir WhatsApp com mensagem
        try { pdfDoc.download(fname); } catch {}
        const msg = encodeURIComponent(message);
        const waUrl = WHATSAPP_NUMBER
          ? `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`
          : `https://wa.me/?text=${msg}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });

    } catch (err) {
      console.error('[PDF] Erro ao gerar/compartilhar:', err);
      alert('Erro ao gerar/compartilhar PDF: ' + (err?.message || err));
      try {
        const minimal = { content: [{ text: 'Teste de PDF — Karatê Shotokan', fontSize: 16 }] };
        window.pdfMake.createPdf(minimal).download('teste-minimo.pdf');
      } catch(e2) {}
    }
  };

})();
