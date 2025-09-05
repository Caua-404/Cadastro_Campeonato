/* ============================================
   PDF do Atleta — Karatê Shotokan
   - Watermark ao centro
   - Seções fortes (vermelho institucional + bold)
   - Rodapé: esquerda/centro/direita
   - Sem QR e sem ID
   - Assinaturas mais abaixo
   - ✅ Recalcula idade via DD/MM/AAAA (garante menor/maior)
   ============================================ */
(() => {
  'use strict';

  try {
    if (window.pdfMake && window.pdfFonts && window.pdfFonts.pdfMake && !window.pdfMake.vfs) {
      window.pdfMake.vfs = window.pdfFonts.pdfMake.vfs;
    }
  } catch(_) {}

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
      'Amarela': '#fef08a',
      'Vermelha':'#E10000',
      'Laranja': '#f59e0b',
      'Verde':   '#34d399',
      'Roxa':    '#a78bfa',
      'Marrom':  '#a16207',
      'Preta':   '#111111'
    };
    return map[fx] || '#e5e7eb';
  };

  const normalize = (s) => (s || '').trim();
  const toUpperNoAcc = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  // --- Helpers de data (PDF independente do formulário)
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

  function sectionTitle(text, colorPrim){
    return {
      table: {
        widths: ['*'],
        body: [[{
          text,
          bold: true,
          fontSize: 12,
          color: '#111111',
          fillColor: colorPrim,
          margin: [10,7,10,7]
        }]]
      },
      layout: 'noBorders',
      margin: [0, 12, 0, 8]
    };
  }

  async function buildDocDef(data) {
    const COR = { prim: '#E10000', texto: '#111', bgClaro: '#EEECEC' };

    // imagens
    const logoShotokan = await toDataURL('assets/shotokan-logo.png');
    const flagCanaa    = await toDataURL('assets/bandeira-canaa.png');
    const logoAgape    = await toDataURL('assets/logo-agape.png');
    const logoFed      = await toDataURL('assets/logo-federacao.png');

    // calcular idade a partir da data de nascimento (fallback para idade_atual)
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
              { text: `Idade: ${idadeShow} anos` }   // <-- usa idade recalculada
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
            [ { text: '' }, { text: '' } ]
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

  function openPdfRobust(pdfDoc, filename='ficha-atleta.pdf'){
    const popup = window.open('', 'Ficha_Atleta', 'noopener,noreferrer');
    if (!popup) { pdfDoc.download(filename); return; }
    try {
      popup.document.open();
      popup.document.write(`
        <!doctype html><html lang="pt-br"><head>
          <meta charset="utf-8" />
          <title>Gerando PDF…</title>
          <style>
            html,body{height:100%;margin:0}
            body{display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#333;font-family:system-ui,Segoe UI,Roboto,Arial}
            .wrap{text-align:center}
            .spinner{width:48px;height:48px;border:4px solid #e5e7eb;border-top-color:#e10000;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
            @keyframes spin{to{transform:rotate(360deg)}}
            iframe{border:0;width:100%;height:100%;display:none}
          </style>
        </head><body>
          <div class="wrap">
            <div class="spinner"></div>
            <div>Gerando a Ficha do Atleta…</div>
          </div>
          <iframe id="pdfFrame" title="Ficha do Atleta"></iframe>
        </body></html>
      `);
      popup.document.close();
    } catch (_) {}

    pdfDoc.getDataUrl((dataUrl) => {
      try {
        const iframe = popup.document.getElementById('pdfFrame');
        if (iframe) {
          iframe.src = dataUrl;
          const wrap = popup.document.querySelector('.wrap');
          if (wrap) wrap.style.display = 'none';
          iframe.style.display = 'block';
        } else {
          popup.location.href = dataUrl;
        }
      } catch (err) {
        console.warn('Falha ao exibir no popup. Baixando…', err);
        pdfDoc.download(filename);
        try { popup.close(); } catch {}
      }
    });
  }

  window.generateAthletePDF = async function generateAthletePDF(formData){
    try {
      if (window.pdfMake && window.pdfFonts && window.pdfFonts.pdfMake && !window.pdfMake.vfs) {
        window.pdfMake.vfs = window.pdfFonts.pdfMake.vfs;
      }
      if (!window.pdfMake || !window.pdfMake.createPdf) throw new Error('Biblioteca do PDF (pdfMake) não carregada.');
      const docDef = await buildDocDef(formData || {});
      const pdfDoc = window.pdfMake.createPdf(docDef);
      openPdfRobust(pdfDoc, 'ficha-atleta.pdf');
    } catch (err) {
      console.error('[PDF] Erro ao gerar:', err);
      alert('Erro ao gerar PDF: ' + (err?.message || err));
      try {
        const minimal = { content: [{ text: 'Teste de PDF — Karatê Shotokan', fontSize: 16 }] };
        window.pdfMake.createPdf(minimal).download('teste-minimo.pdf');
      } catch(e2) {}
    }
  };

})();
