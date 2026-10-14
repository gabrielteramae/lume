# Lume

Repositório em desenvolvimento. Caderno noturno no navegador: a entrada é uma animação e as notas ficam neste aparelho.

## Onde está o produto

- Animação de acesso: `src/components/login-stage.tsx`. A sequência é `BEATS` e os tempos estão em `AT`. Não mude a ordem nem os milissegundos sem um pedido explícito.
- Mesa de notas: `src/components/night-desk.tsx`.
- Conta, sessão e notas: `src/lib/lume-store.ts`. Zustand com `persist`, nome `lume`.
- Página: `src/routes/index.tsx`. Estilos: `src/styles.css`.
- `src/routeTree.gen.ts` é gerado. Não edite à mão.

`src/lib/auth`, `src/lib/app-data`, `scripts/` e `server/` são o esqueleto do app. Não refatore isso sem pedido.

## Dados

- A interface visível não usa nuvem. E-mail, hash e notas ficam no `localStorage`.
- A senha nunca é gravada em texto. O hash é SHA-256 de `email + "\n" + senha` na função `digest`.
- Os botões Google e Apple criam uma sessão local. Não ligue OAuth, Better Auth nem banco a esse fluxo sem pedido explícito.
- Textos da interface em português do Brasil.

## Como validar

```bash
npm install
npm run dev
```

O dev sobe em http://localhost:8080.

- `npm run typecheck` só checa tipos.
- `npm test` roda os testes já listados no `package.json`. Não há teste da animação.
- `npm run build` gera o build.

Antes de concluir uma mudança de código, rode `npm run typecheck`. Se mexer em `src/lib` ou `scripts`, rode `npm test`.

## Como escrever

- Mantenha o visual que já existe: tokens e keyframes em `src/styles.css`. Não troque a biblioteca de UI.
- Respeite `prefers-reduced-motion`. Não remova o atalho que pula a animação.
- README no formato do repositório: selos, tabela de escolha, Stack, Estrutura, Como rodar, Testes e a linha `© 2026 Gabriel Teramae Chan`.
- Commit em português, uma frase. Não inclua `node_modules`, `.grok`, `artifacts` nem `screenshots`.
- A frase de abertura roda uma vez por aba (`sessionStorage`, chave `lume.intro`). Quem sai e volta cai no formulário pronto.
- Apagar nota guarda `lastRemoved` e some sozinho. Não troque isso por um confirm que fica armado.
- Não invente nuvem, login real do Google ou da Apple, nem e-mail de recuperação. O app está em desenvolvimento e os dados continuam no aparelho até alguém pedir o contrário.
