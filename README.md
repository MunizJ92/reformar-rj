# Obra House R|J

Painel de acompanhamento da reforma, cômodo a cômodo, com a planta interativa do projeto executivo (Karina Silva Arquitetura).

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (por exemplo `obra-house-rj`).
2. Envie todos os arquivos desta pasta, mantendo as pastas `assets` e `dados`.
3. No repositório, abra **Settings → Pages**.
4. Em **Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
5. Em um ou dois minutos o site fica no ar em `https://SEU-USUARIO.github.io/obra-house-rj/`.

## Atualizar o andamento

Tudo vem do arquivo `dados/etapas.csv`. Cada linha é uma etapa de um cômodo.

- Para atualizar, mude só a coluna `progresso`: `0` = não iniciado, `50` = pela metade, `100` = concluído.
- O status, a porcentagem de cada cômodo, de cada andar e da obra inteira são calculados sozinhos.
- Pelo celular: abra o arquivo no site do GitHub, toque no lápis (Edit), altere o número e toque em **Commit changes**.

Para incluir uma etapa nova, copie uma linha do mesmo cômodo e troque o `id`, a `etapa` e o `detalhe`.

## Arquivos

- `index.html`, `style.css`, `app.js`: a página.
- `assets/`: plantas humanizadas do térreo e do superior.
- `dados/etapas.csv`: as etapas e o progresso.

A página precisa ser aberta pelo endereço do site. Abrindo o `index.html` direto do computador, os dados não carregam.
