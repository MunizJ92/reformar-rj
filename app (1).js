// Obra House R|J — painel de acompanhamento
// Os dados vêm de etapas.csv. Para atualizar, mude a coluna "progresso" (0 a 100).

const AREAS = { // m², da tabela de ambientes do projeto
  'Gourmet': 78.53, 'Lavabo térreo': 1.89, 'Escada e pátio': 6.16, 'Jogos 1': 7.20, 'Lavanderia': 3.50,
  'Jogos 2': 17.25, 'Hóspedes': 11.37, 'Bar/Adega': 14.45, 'Jardim': 51.05, 'Canil': 2.99,
  'Varanda de contemplação': 47.27, 'Sala de estar': 26.45, 'Lavabo superior': 2.13, 'Cozinha': 37.17,
  'Suíte casal': 12.12, 'Closet': 6.84, 'Banho casal': 2.99, 'Suíte filho': 7.50, 'Banho filho': 3.60, 'Sacada': 1.98
};

// Contornos dos cômodos sobre as plantas, em % da largura e da altura da imagem
const R = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
const PLANTAS = {
  'Térreo': { img: 'planta-terreo.jpg', w: 1324, h: 612, formas: [
    ['Jardim', [[5,8],[60,5.5],[60,20],[27.5,20],[27.5,40.5],[13.7,40.5],[13.7,90.5],[5,90.5]]],
    ['Gourmet', R(64.5,3,85.5,67)],
    ['Gourmet', R(86,21,98.8,89)],
    ['Piscina', [[70,10],[83,10],[84.5,14],[84.5,23],[83,26.5],[70,26.5],[68.6,23],[68.6,14]]],
    ['Canil', R(27.8,21,33,41)],
    ['Hóspedes', R(34,21,49.5,48)],
    ['Jogos 1', R(49.7,21,59.5,48)],
    ['Bar/Adega', R(33.5,49,45,91)],
    ['Jogos 2', R(45.3,49,59.5,91)],
    ['Escada e pátio', R(59.8,3,64.3,91)],
    ['Garagem', R(64.5,68,85.5,91)],
    ['Lavanderia', R(86,3,93.8,20)],
    ['Lavabo térreo', R(94,3,98.8,20)]
  ]},
  'Superior': { img: 'planta-superior.jpg', w: 1324, h: 609, formas: [
    ['Varanda de contemplação', [[85.5,3],[99,3],[99,91],[64.5,91],[64.5,68],[85.5,68]]],
    ['Banho casal', R(27.5,20,33,41)],
    ['Closet', R(33.2,20,42.8,47)],
    ['Suíte casal', R(43,20,59.5,46.5)],
    ['Sacada', R(59.8,23,62.5,44)],
    ['Hall da sala', R(14,41,26,54)],
    ['Lavabo superior', R(26.2,41,33,54)],
    ['Sala de estar', R(14,54.5,33,91)],
    ['Cozinha', [[33.2,47.5],[59.5,47.5],[59.5,91],[49.5,91],[49.5,63.5],[33.2,63.5]]],
    ['Banho filho', R(33.5,64,38.5,91)],
    ['Suíte filho', R(38.7,64,49.3,91)]
  ]}
};

const COR = { zero: '#A9A69E', andamentoIni: [138, 90, 54], andamentoFim: [185, 138, 78], concluido: '#2349A0' };
const statusDe = (p) => p >= 100 ? 'Concluído' : p > 0 ? 'Em andamento' : 'Não iniciado';
const clsDe = (p) => p >= 100 ? 'c' : p > 0 ? 'a' : '';
function corDe(p) {
  if (p >= 100) return COR.concluido;
  if (p <= 0) return COR.zero;
  const t = p / 100, a = COR.andamentoIni, b = COR.andamentoFim;
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
}
const m2 = (v) => v == null ? '–' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' m²';

function lerCSV(texto) {
  const linhas = []; let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some(x => x !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo); if (linha.some(x => x !== '')) linhas.push(linha);
  const cab = linhas.shift().map(s => s.trim().replace(/^﻿/, ''));
  return linhas.map(l => Object.fromEntries(cab.map((k, i) => [k, (l[i] || '').trim()])));
}

const estado = { etapas: [], comodos: [], andar: 'Térreo', filtro: 'Todos', sel: null, animou: {} };

function resumir() {
  const m = new Map();
  for (const e of estado.etapas) {
    if (!m.has(e.comodo)) m.set(e.comodo, { comodo: e.comodo, andar: e.andar, soma: 0, n: 0, ok: 0, etapas: [] });
    const g = m.get(e.comodo); g.soma += e.progresso; g.n++; if (e.progresso >= 100) g.ok++; g.etapas.push(e);
  }
  estado.comodos = [...m.values()].map(g => ({ ...g, progresso: Math.round(g.soma / g.n), area: AREAS[g.comodo] }));
}

// ---------- Resumo (carimbo)
function animarNumero(el, alvo, sufixo = '%') {
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduz || alvo === 0) { el.textContent = alvo + sufixo; return; }
  const t0 = performance.now(), dur = 1100;
  const passo = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(alvo * e) + sufixo;
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function desenharResumo() {
  const total = estado.etapas.length;
  const media = total ? Math.round(estado.etapas.reduce((s, e) => s + e.progresso, 0) / total) : 0;
  animarNumero(document.getElementById('r-prog'), media);
  requestAnimationFrame(() => { document.getElementById('r-barra').style.width = media + '%'; });
  document.getElementById('r-status').textContent = media >= 100 ? 'Concluída' : media > 0 ? 'Em andamento' : 'Não iniciada';
  const cc = estado.comodos.filter(c => c.progresso >= 100).length;
  document.getElementById('r-comodos').textContent = `${cc} de ${estado.comodos.length}`;
  document.getElementById('r-etapas').textContent = `${estado.etapas.filter(e => e.progresso >= 100).length} de ${total}`;

  const box = document.getElementById('r-andares'); box.innerHTML = '';
  for (const andar of ['Térreo', 'Superior']) {
    const es = estado.etapas.filter(e => e.andar === andar);
    const p = es.length ? Math.round(es.reduce((s, e) => s + e.progresso, 0) / es.length) : 0;
    const row = document.createElement('div'); row.className = 'and';
    row.innerHTML = '<span></span><div class="trilho"><span></span></div><b></b>';
    row.children[0].textContent = andar;
    row.children[2].textContent = p + '%';
    box.appendChild(row);
    requestAnimationFrame(() => { row.querySelector('.trilho span').style.width = p + '%'; });
  }
}

// ---------- Planta
const SVG = 'http://www.w3.org/2000/svg';
const polyArea = (p) => p.reduce((a, [x1, y1], i) => { const [x2, y2] = p[(i + 1) % p.length]; return a + x1 * y2 - x2 * y1; }, 0) / 2;
function polyCentro(p) {
  const a = polyArea(p); let cx = 0, cy = 0;
  p.forEach(([x1, y1], i) => { const [x2, y2] = p[(i + 1) % p.length]; const f = x1 * y2 - x2 * y1; cx += (x1 + x2) * f; cy += (y1 + y2) * f; });
  return [cx / (6 * a), cy / (6 * a)];
}
const el = (tag, attrs = {}) => { const n = document.createElementNS(SVG, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

function desenharPlanta() {
  const pl = PLANTAS[estado.andar], svg = document.getElementById('planta-svg');
  const W = pl.w, H = pl.h, fs = W / 36;
  svg.innerHTML = ''; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(el('image', { href: pl.img, width: W, height: H }));
  esconderBalao();

  const porNome = new Map(estado.comodos.map(c => [c.comodo, c]));
  const grupos = new Map();
  pl.formas.forEach(([n, pts]) => { if (!grupos.has(n)) grupos.set(n, []); grupos.get(n).push(pts); });
  const primeira = !estado.animou[estado.andar];
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ordem = 0;

  for (const [nome, partes] of grupos) {
    const c = porNome.get(nome); if (!c) continue;
    const g = el('g', { class: 'comodo' + (nome === estado.sel ? ' ativo' : ''), tabindex: 0, role: 'button', 'aria-label': `${nome}, ${c.progresso}%` });
    let maior = null, area = -1;
    for (const pts of partes) {
      const pp = pts.map(([x, y]) => [x / 100 * W, y / 100 * H]);
      const f = el('polygon', { class: 'forma', points: pp.map(p => p.join(',')).join(' '), fill: corDe(c.progresso), stroke: corDe(c.progresso) });
      g.appendChild(f);
      const a = Math.abs(polyArea(pp)); if (a > area) { area = a; maior = pp; }
    }
    const [cx, cy] = polyCentro(maior);
    const xs = maior.map(p => p[0]), ys = maior.map(p => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const pequeno = bw < W * .07 || bh < H * .12;
    const t = el('text', { class: 'pct', x: cx, y: cy, 'font-size': pequeno ? fs * .62 : fs });
    t.textContent = c.progresso + '%';
    g.appendChild(t);
    if (!pequeno && bh > H * .2) {
      const n = el('text', { class: 'nome', x: cx, y: cy + fs * .95, 'font-size': fs * .42 });
      n.textContent = nome; g.appendChild(n);
    }
    // entrada: os cômodos acendem em sequência e a % conta até o valor
    if (primeira && !reduz) {
      g.style.opacity = 0;
      g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 60 * ordem, fill: 'forwards', easing: 'ease-out' });
      if (c.progresso > 0) setTimeout(() => animarNumero(t, c.progresso), 60 * ordem);
      ordem++;
    }

    const mostrar = (ev) => mostrarBalao(ev, c, g);
    g.addEventListener('pointerenter', mostrar);
    g.addEventListener('pointermove', mostrar);
    g.addEventListener('pointerleave', esconderBalao);
    g.addEventListener('focus', () => mostrarBalao(null, c, g));
    g.addEventListener('blur', esconderBalao);
    g.addEventListener('click', () => selecionar(nome, true));
    g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selecionar(nome, true); } });
    svg.appendChild(g);
  }
  estado.animou[estado.andar] = true;
  const ativo = svg.querySelector('.comodo.ativo');
  const sc = document.getElementById('planta');
  if (ativo && sc.scrollWidth > sc.clientWidth) { const r = ativo.getBoundingClientRect(), b = sc.getBoundingClientRect(); sc.scrollLeft += r.left - b.left - (b.width - r.width) / 2; }
}

function mostrarBalao(ev, c, g) {
  const b = document.getElementById('balao'), box = document.getElementById('planta-in').getBoundingClientRect();
  b.innerHTML = '';
  const add = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; n.textContent = txt; b.appendChild(n); return n; };
  add('strong', '', c.comodo);
  add('div', 'b-pct', c.progresso + '%');
  const tr = document.createElement('div'); tr.className = 'trilho'; const s = document.createElement('span');
  s.style.width = c.progresso + '%'; s.style.background = corDe(c.progresso); s.style.transition = 'none'; tr.appendChild(s); b.appendChild(tr);
  add('div', 'b-sub', `${statusDe(c.progresso)}, ${c.ok} de ${c.n} etapas`);
  b.hidden = false;
  let x, y;
  if (ev) { x = ev.clientX - box.left; y = ev.clientY - box.top; }
  else { const r = g.getBoundingClientRect(); x = r.left - box.left + r.width / 2; y = r.top - box.top + r.height / 2; }
  const bw = b.offsetWidth, bh = b.offsetHeight;
  b.style.left = Math.max(6, Math.min(box.width - bw - 6, x + 14)) + 'px';
  b.style.top = Math.max(6, y - bh - 14 < 0 ? Math.min(box.height - bh - 6, y + 18) : y - bh - 14) + 'px';
}
function esconderBalao() { document.getElementById('balao').hidden = true; }

// ---------- Detalhe do cômodo
function desenharDetalhe() {
  const box = document.getElementById('detalhe');
  const c = estado.comodos.find(x => x.comodo === estado.sel);
  box.innerHTML = '';
  if (!c) { box.innerHTML = '<p class="vazio">Escolha um cômodo na planta ou no quadro abaixo.</p>'; return; }
  const add = (pai, tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; pai.appendChild(n); return n; };
  add(box, 'p', 'd-andar', c.andar + (c.area ? `, ${m2(c.area)}` : ''));
  add(box, 'h3', 'd-nome', c.comodo);
  const linha = add(box, 'div', 'd-linha');
  add(linha, 'span', 'd-pct', c.progresso + '%');
  const meta = add(linha, 'span', 'd-meta');
  add(meta, 'div', 'st ' + clsDe(c.progresso), statusDe(c.progresso));
  add(meta, 'div', '', `${c.ok} de ${c.n} etapas`);
  const tr = add(box, 'div', 'trilho'); const s = add(tr, 'span');
  s.style.background = corDe(c.progresso);
  requestAnimationFrame(() => requestAnimationFrame(() => { s.style.width = c.progresso + '%'; }));
  const ul = add(box, 'ul', 'etapas');
  for (const e of c.etapas) {
    const li = add(ul, 'li');
    const mk = add(li, 'span', 'marc ' + clsDe(e.progresso));
    mk.style.setProperty('--p', e.progresso + '%');
    const tx = add(li, 'span');
    add(tx, 'span', 'e-nome', e.etapa);
    add(tx, 'span', 'e-det', e.detalhe);
    add(li, 'span', 'e-pct', e.progresso + '%');
  }
}

// ---------- Quadro de ambientes
function desenharQuadro() {
  const tb = document.getElementById('quadro'); tb.innerHTML = '';
  const lista = estado.comodos.filter(c => estado.filtro === 'Todos' || c.andar === estado.filtro);
  for (const c of lista) {
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    if (c.comodo === estado.sel) tr.className = 'ativo';
    const td = (cls, txt) => { const n = document.createElement('td'); if (cls) n.className = cls; if (txt != null) n.textContent = txt; tr.appendChild(n); return n; };
    td('amb', c.comodo);
    td('and-col o-sm', c.andar);
    td('num o-sm', m2(c.area));
    const cel = td('');
    const mini = document.createElement('div'); mini.className = 'mini';
    const trl = document.createElement('div'); trl.className = 'trilho';
    const s = document.createElement('span'); s.style.background = corDe(c.progresso); trl.appendChild(s);
    const st = document.createElement('span'); st.className = 'st ' + clsDe(c.progresso); st.textContent = statusDe(c.progresso);
    mini.append(trl, st); cel.appendChild(mini);
    td('num', c.progresso + '%');
    requestAnimationFrame(() => { s.style.width = c.progresso + '%'; });
    tr.addEventListener('click', () => selecionar(c.comodo, false));
    tr.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') selecionar(c.comodo, false); });
    tb.appendChild(tr);
  }
}

function selecionar(nome, daPlanta) {
  estado.sel = nome;
  const c = estado.comodos.find(x => x.comodo === nome);
  if (c && c.andar !== estado.andar && PLANTAS[c.andar]) { estado.andar = c.andar; marcarAbas(); desenharPlanta(); }
  document.querySelectorAll('#planta-svg .comodo').forEach(g => g.classList.toggle('ativo', g.getAttribute('aria-label').startsWith(nome + ',')));
  desenharDetalhe();
  desenharQuadro();
  const det = document.getElementById('detalhe');
  if (matchMedia('(max-width: 1000px)').matches || !daPlanta) {
    (daPlanta ? det : document.getElementById('planta')).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function marcarAbas() {
  document.querySelectorAll('.prancha .seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.andar === estado.andar));
}

document.querySelectorAll('.prancha .seg button').forEach(b => b.addEventListener('click', () => {
  estado.andar = b.dataset.andar; marcarAbas(); desenharPlanta();
}));
document.querySelectorAll('#filtro button').forEach(b => b.addEventListener('click', () => {
  estado.filtro = b.dataset.f;
  document.querySelectorAll('#filtro button').forEach(x => x.setAttribute('aria-pressed', x === b));
  desenharQuadro();
}));

// ---------- Início
// Configuração do GitHub (fica só neste aparelho)
const GH_CHAVE = 'obra-github';
function ghPadrao() {
  const h = location.hostname, m = h.match(/^([^.]+)\.github\.io$/i);
  const seg = location.pathname.split('/').filter(Boolean)[0] || '';
  return { owner: m ? m[1] : '', repo: m ? seg : '', branch: 'main', arquivo: 'etapas.csv', token: '' };
}
function ghConfig() {
  let c = {};
  try { c = JSON.parse(localStorage.getItem(GH_CHAVE) || '{}'); } catch (e) {}
  return { ...ghPadrao(), ...c };
}
function ghSalvarConfig(c) { try { localStorage.setItem(GH_CHAVE, JSON.stringify(c)); } catch (e) {} }
const b64paraTexto = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), ch => ch.charCodeAt(0)));

// Com token salvo, lê direto do repositório (sempre a versão mais nova);
// sem token, lê a cópia publicada no site.
async function lerDados() {
  const c = ghConfig();
  if (c.token && c.owner && c.repo) {
    try {
      const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.arquivo}?ref=${encodeURIComponent(c.branch)}`,
        { headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      if (r.ok) { const j = await r.json(); estado.sha = j.sha; return b64paraTexto(j.content); }
    } catch (e) {}
  }
  const r = await fetch('etapas.csv', { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

function redesenharTudo() {
  resumir();
  desenharResumo();
  desenharPlanta();
  desenharQuadro();
  desenharDetalhe();
}

lerDados()
  .then(txt => {
    estado.etapas = lerCSV(txt).map(e => ({ ...e, progresso: Math.max(0, Math.min(100, Number(String(e.progresso).replace(',', '.')) || 0)) }));
    redesenharTudo();
    document.dispatchEvent(new Event('obra:carregada'));
  })
  .catch(err => {
    const e = document.getElementById('erro');
    e.hidden = false;
    e.textContent = location.protocol === 'file:'
      ? 'Os dados não carregam abrindo o arquivo direto do computador. Publique a pasta no GitHub Pages (ou rode um servidor local) e abra pelo endereço do site.'
      : 'Não foi possível ler etapas.csv (' + err.message + '). Confira se o arquivo está na raiz do repositório.';
  });
