# Obra House R|J

Painel de acompanhamento da reforma, cômodo a cômodo, com a planta interativa do projeto executivo (Karina Silva Arquitetura).

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (por exemplo `obra-house-rj`).
2. Envie todos os arquivos na raiz do repositório.
3. No repositório, abra **Settings → Pages**.
4. Em **Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
5. Em um ou dois minutos o site fica no ar em `https://SEU-USUARIO.github.io/obra-house-rj/`.

## Atualizar o andamento

Pelo próprio site, na aba **Atualizar andamento**:

1. Toque em **Configurar** e cole um token do GitHub (o passo a passo para criar está na própria aba). Isso é feito uma vez por aparelho.
2. Escolha o cômodo, marque cada etapa (0%, 25%, 50%, 75% ou Pronto, ou ajuste fino na barra) e toque em **Salvar**.

O site grava o `etapas.csv` no repositório. O painel mostra os valores na hora; o endereço público atualiza em 1 a 2 minutos.

Sem token, dá para editar, tocar em **Baixar CSV** e enviar o arquivo pelo GitHub (Add file, Upload files).

O token fica guardado só no navegador do aparelho e é enviado apenas ao GitHub. Nunca coloque o token em nenhum arquivo do repositório.

## Arquivos

- `index.html`, `style.css`, `app.js`: a página e o painel.
- `atualizar.js`: a aba de atualização.
- `planta-terreo.jpg`, `planta-superior.jpg`: plantas humanizadas.
- `etapas.csv`: as etapas e o progresso.

A página precisa ser aberta pelo endereço do site. Abrindo o `index.html` direto do computador, os dados não carregam.
