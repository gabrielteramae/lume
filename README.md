# Lume — caderno da noite

![Em desenvolvimento](https://img.shields.io/badge/em%20desenvolvimento-e3a15a?style=flat)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=flat&logo=tailwindcss&logoColor=white)

Em desenvolvimento. Caderno noturno no navegador. O acesso abre em roxo, a tela vira ciano e o cartão sobe com o formulário. O que você escreve fica neste aparelho.

| Escolha | Motivo |
| --- | --- |
| Conta só no aparelho | E-mail, senha e notas ficam no `localStorage`. Não há nuvem nem e-mail de recuperação |
| Animação em etapas | A entrada segue um roteiro: frase, troca de cor, título e o cartão com os campos |

## Stack

- React 19, TypeScript, Vite, TanStack Start, TanStack Router e Tailwind CSS 4
- Zustand com persistência. A senha é guardada como hash SHA-256, nunca em texto
- Fontes Outfit e Fraunces
- Google e Apple neste app criam uma entrada local. Não abrem a conta real desses serviços

## Estrutura

```
package.json
vite.config.ts
public/
src/routes/
src/components/login-stage.tsx
src/components/night-desk.tsx
src/lib/lume-store.ts
src/styles.css
```

## Como rodar

```bash
git clone https://github.com/gabrielteramae/lume.git
cd lume
npm install
npm run dev
```

Abra http://localhost:8080.

A seta no canto, ou um toque na área vazia, pula a animação de entrada. Criar conta, entrar e sair usam só este navegador. `npm run build` gera o build.

## Testes

```bash
npm test
```

O script `test` do `package.json` executa `scripts/**/*.test.mjs` e os `*.test.ts` de `src/lib` listados ali. `npm run typecheck` só checa tipos. Não há teste da animação de acesso.

---

© 2026 Gabriel Teramae Chan
