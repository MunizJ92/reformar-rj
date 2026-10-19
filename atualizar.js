// Aba "Atualizar andamento": muda o progresso das etapas e salva o etapas.csv no GitHub.
// O token fica só no aparelho (localStorage) e é enviado apenas para api.github.com.

const ed = { comodo: null, originais: new Map() }; // id -> progresso salvo
estado.pendentes = ed.originais;
const VALORES = [0, 25, 50, 75, 100];
const $ = (id) => document.getElementById(id);

// ---------- Navegação entre abas
function mostrarAba() {
  const atualizar = location.hash === '#atualizar';
  $('v-painel').hidden = atualizar;
  $('v-atualizar').hidden = !atualizar;
  $('aba-painel').toggleAttribute('aria-current', !atualizar);
  $('aba-atualizar').toggleAttribute('aria-current', atualizar);
  if (atualizar) { $('aba-atualizar').setAttribute('aria-current', 'page'); desenharEditor(); }
  else { $('aba-painel').setAttribute('aria-current', 'page'); if (estado.etapas.length) redesenharTudo(); }
  window.scrollTo(0, 0);
  atualizarBarra();
}
window.addEventListener('hashchange', mostrarAba);

// ---------- Conexão
async function ghApi(caminho, opcoes = {}) {
  const c = ghConfig();
  const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${caminho}`, {
    ...opcoes,
    cache: 'no-store',
    headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opcoes.headers || {}) }
  });
  let corpo = null; try { corpo = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, corpo };
}

async function verificarConexao() {
  const c = ghConfig(), st = $('con-status');
  st.className = 'nota';
  if (!c.token) { st.textContent = 'Sem token: você pode editar e baixar o CSV, mas não salvar direto no site.'; return false; }
  st.textContent = 'Verificando…';
  try {
    const r = await ghApi('');
    if (r.ok && r.corpo && r.corpo.permissions && r.corpo.permissions.push) {
      st.textContent = `Conectado a ${c.owner}/${c.repo}. As alterações são salvas direto no repositório.`; st.classList.add('ok'); return true;
    }
    if (r.ok) { st.textContent = 'O token entra no repositório, mas não tem permissão de escrita. Deixe Contents como Read and write.'; st.classList.add('ruim'); return false; }
    st.textContent = r.status === 401 ? 'Token inválido ou vencido. Gere um novo e conecte de novo.'
      : r.status === 404 ? `Não achei ${c.owner}/${c.repo} com esse token. Confira o usuário, o repositório e se o token tem acesso a ele.`
      : `O GitHub respondeu com erro ${r.status}.`;
    st.classList.add('ruim'); return false;
  } catch (e) { st.textContent = 'Sem conexão com o GitHub agora. Confira a internet.'; st.classList.add('ruim'); return false; }
}

function preencherForm() {
  const c = ghConfig();
  $('con-token').value = c.token ? '••••••••' + c.token.slice(-4) : '';
  $('con-token').dataset.mascara = c.token ? '1' : '';
  $('con-owner').value = c.owner; $('con-repo').value = c.repo; $('con-branch').value = c.branch;
}
$('con-abrir').addEventListener('click', () => {
  const f = $('con-form'), abrir = f.hidden;
  f.hidden = !abrir; $('con-abrir').setAttribute('aria-expanded', abrir);
  if (abrir) preencherForm();
});
$('con-token').addEventListener('focus', (e) => { if (e.target.dataset.mascara) { e.target.value = ''; e.target.dataset.mascara = ''; } });
$('con-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const c = ghConfig(), tk = $('con-token');
  const token = tk.dataset.mascara ? c.token : tk.value.trim();
  ghSalvarConfig({ token, owner: $('con-owner').value.trim(), repo: $('con-repo').value.trim(), branch: $('con-branch').value.trim() || 'main' });
  if (await verificarConexao()) { $('con-form').hidden = true; $('con-abrir').setAttribute('aria-expanded', false); }
});
$('con-esquecer').addEventListener('click', () => {
  const c = ghConfig(); ghSalvarConfig({ owner: c.owner, repo: c.repo, branch: c.branch, token: '' });
  preencherForm(); verificarConexao();
});

// ---------- Editor
function nomesComodos() { return [...new Set(estado.etapas.map(e => e.comodo))]; }

function preencherSelect() {
  const sel = $('c-sel'); sel.innerHTML = '';
  for (const andar of ['Térreo', 'Superior']) {
    const g = document.createElement('optgroup'); g.label = andar;
    for (const n of nomesComodos()) {
      const e = estado.etapas.find(x => x.comodo === n);
      if (e.andar !== andar) continue;
      const o = document.createElement('option'); o.value = n; o.textContent = n; g.appendChild(o);
    }
    sel.appendChild(g);
  }
  sel.value = ed.comodo;
}
$('c-sel').addEventListener('change', (e) => { ed.comodo = e.target.value; desenharEditor(); });
function pular(d) {
  const ns = nomesComodos(); const i = ns.indexOf(ed.comodo);
  ed.comodo = ns[(i + d + ns.length) % ns.length]; desenharEditor();
}
$('c-ant').addEventListener('click', () => pular(-1));
$('c-prox').addEventListener('click', () => pular(1));

function desenharEditor() {
  if (!estado.etapas.length) return;
  if (!ed.comodo) ed.comodo = estado.sel || nomesComodos()[0];
  preencherSelect();
  const etapas = estado.etapas.filter(e => e.comodo === ed.comodo);
  const media = Math.round(etapas.reduce((s, e) => s + e.progresso, 0) / etapas.length);
  const res = $('c-res'); res.innerHTML = '';
  const pct = document.createElement('span'); pct.className = 'er-pct'; pct.textContent = media + '%';
  const tx = document.createElement('span'); tx.className = 'er-tx';
  tx.textContent = `${statusDe(media)}, ${etapas.filter(e => e.progresso >= 100).length} de ${etapas.length} etapas`;
  const tr = document.createElement('div'); tr.className = 'trilho'; const sp = document.createElement('span');
  sp.style.width = media + '%'; sp.style.background = corDe(media); tr.appendChild(sp);
  res.append(pct, tx, tr);

  const ul = $('ed-lista'); ul.innerHTML = '';
  for (const e of etapas) {
    const li = document.createElement('li'); li.className = 'ed-item';
    if (ed.originais.has(e.id)) li.classList.add('mudou');
    const topo = document.createElement('div'); topo.className = 'ed-topo';
    const nome = document.createElement('div');
    const n1 = document.createElement('span'); n1.className = 'ed-nome'; n1.textContent = e.etapa;
    const n2 = document.createElement('span'); n2.className = 'ed-det'; n2.textContent = e.detalhe;
    nome.append(n1, n2);
    const val = document.createElement('span'); val.className = 'ed-val ' + clsDe(e.progresso); val.textContent = e.progresso + '%';
    topo.append(nome, val);

    const chips = document.createElement('div'); chips.className = 'ed-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Progresso de ' + e.etapa);
    for (const v of VALORES) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = v === 100 ? 'Pronto' : v + '%';
      b.setAttribute('aria-pressed', e.progresso === v);
      b.addEventListener('click', () => mudar(e, v));
      chips.appendChild(b);
    }
    const rg = document.createElement('input'); rg.type = 'range'; rg.min = 0; rg.max = 100; rg.step = 5; rg.value = e.progresso;
    rg.className = 'ed-range'; rg.setAttribute('aria-label', 'Ajuste fino de ' + e.etapa);
    rg.style.setProperty('--v', e.progresso + '%');
    rg.addEventListener('input', () => { val.textContent = rg.value + '%'; rg.style.setProperty('--v', rg.value + '%'); });
    rg.addEventListener('change', () => mudar(e, Number(rg.value)));

    li.append(topo, chips, rg);
    if (ed.originais.has(e.id)) {
      const ant = document.createElement('span'); ant.className = 'ed-antes'; ant.textContent = `Antes: ${ed.originais.get(e.id)}%`;
      li.appendChild(ant);
    }
    ul.appendChild(li);
  }
  atualizarBarra();
}

function registrar(e, v) {
  if (!ed.originais.has(e.id)) ed.originais.set(e.id, e.progresso);
  e.progresso = v;
  if (ed.originais.get(e.id) === v) ed.originais.delete(e.id);
}
function redesenharVista() {
  if (location.hash === '#atualizar') { desenharEditor(); return; }
  estado.semAnim = true;
  resumir(); desenharResumo(); desenharPlanta(); desenharQuadro(); desenharDetalhe();
  estado.semAnim = false;
  atualizarBarra();
}
function mudar(e, v) { registrar(e, v); desenharEditor(); }

// Bolinha do painel: concluída <-> não iniciada
window.alternarEtapa = (id) => {
  const e = estado.etapas.find(x => x.id === id); if (!e) return;
  const v = e.progresso >= 100 ? (ed.originais.has(id) && ed.originais.get(id) < 100 ? ed.originais.get(id) : 0) : 100;
  registrar(e, v);
  if (v === 100) estado.ultimaMarcada = id;
  avisar('');
  redesenharVista();
};

function atualizarBarra() {
  const n = ed.originais.size;
  $('barra-salvar').hidden = n === 0 && !$('aviso').textContent;
  document.body.classList.toggle('com-barra', !$('barra-salvar').hidden);
  $('bs-texto').textContent = n === 0 ? 'Tudo salvo' : n === 1 ? '1 alteração não salva' : `${n} alterações não salvas`;
  $('bs-salvar').disabled = n === 0; $('bs-desfazer').disabled = n === 0;
}

$('bs-desfazer').addEventListener('click', () => {
  for (const [id, v] of ed.originais) { const e = estado.etapas.find(x => x.id === id); if (e) e.progresso = v; }
  ed.originais.clear(); redesenharVista();
});

// ---------- CSV
function csvCampo(v) { v = String(v ?? ''); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function gerarCSV() {
  const cols = ['id', 'andar', 'comodo', 'etapa', 'detalhe', 'progresso'];
  return [cols.join(','), ...estado.etapas.map(e => cols.map(k => csvCampo(e[k])).join(','))].join('\n') + '\n';
}
const textoParaB64 = (t) => { const b = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(s); };

$('bs-baixar').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([gerarCSV()], { type: 'text/csv;charset=utf-8' }));
  a.download = 'etapas.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

function avisar(txt, tipo) {
  const a = $('aviso'); a.textContent = txt; a.className = 'aviso ' + (tipo || ''); a.hidden = !txt;
}

function mensagemCommit() {
  const porComodo = new Map();
  for (const id of ed.originais.keys()) {
    const e = estado.etapas.find(x => x.id === id); if (!e) continue;
    if (!porComodo.has(e.comodo)) porComodo.set(e.comodo, []);
    porComodo.get(e.comodo).push(`${e.etapa} ${e.progresso}%`);
  }
  const partes = [...porComodo].map(([c, l]) => `${c}: ${l.join(', ')}`);
  const titulo = 'Andamento: ' + [...porComodo.keys()].join(', ');
  return (titulo.length > 70 ? titulo.slice(0, 67) + '…' : titulo) + '\n\n' + partes.join('\n');
}

$('bs-salvar').addEventListener('click', async () => {
  const c = ghConfig();
  if (!c.token) {
    avisar('Para salvar direto no site, toque em Configurar e cole o token do GitHub. Sem token, use Baixar CSV e envie o arquivo pelo GitHub.', 'ruim');
    $('con-form').hidden = false; $('con-abrir').setAttribute('aria-expanded', true); preencherForm();
    $('conexao').scrollIntoView({ behavior: 'smooth' }); return;
  }
  const btn = $('bs-salvar'); btn.disabled = true; btn.textContent = 'Salvando…'; avisar('');
  try {
    const atual = await ghApi(`/contents/${c.arquivo}?ref=${encodeURIComponent(c.branch)}`);
    if (!atual.ok) throw new Error(atual.status === 401 ? 'token inválido ou vencido' : atual.status === 404 ? 'arquivo ou repositório não encontrado' : 'erro ' + atual.status);
    const r = await ghApi(`/contents/${c.arquivo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: mensagemCommit(), content: textoParaB64(gerarCSV()), sha: atual.corpo.sha, branch: c.branch })
    });
    if (!r.ok) throw new Error(r.status === 409 ? 'o arquivo mudou enquanto você editava; recarregue a página' : r.status === 403 ? 'o token não tem permissão de escrita' : 'erro ' + r.status);
    estado.sha = r.corpo && r.corpo.content && r.corpo.content.sha;
    const n = ed.originais.size; ed.originais.clear();
    avisar(`${n === 1 ? '1 alteração salva' : n + ' alterações salvas'}. O site público atualiza em 1 a 2 minutos.`, 'ok');
    redesenharVista();
  } catch (err) {
    avisar('Não salvou: ' + err.message + '. Suas alterações continuam aqui.', 'ruim');
  } finally {
    btn.textContent = 'Salvar'; atualizarBarra();
  }
});

window.addEventListener('beforeunload', (e) => { if (ed.originais.size) { e.preventDefault(); e.returnValue = ''; } });

// ---------- Início
document.addEventListener('obra:carregada', () => { if (location.hash === '#atualizar') desenharEditor(); });
verificarConexao();
mostrarAba();
