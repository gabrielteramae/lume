---
applyTo: "src/components/**,src/lib/lume-store.ts,src/routes/index.tsx,src/styles.css"
---

# Interface do Lume

A tela de acesso é o produto. `LoginStage` avança por `mind`, `line`, `wash`, `hello`, `back`, `sheet`, `mail`, `pass`, `go` e `rest`. Quem já passou de um beat não volta, a menos que o modo mude.

- Pular a animação aplica o estado final de uma vez. Quem prefere menos movimento também cai nesse estado.
- Campos invisíveis no começo continuam ocupando lugar. Não use `display: none` no meio da sequência se isso deslocar o cartão.
- `NightDesk` só aparece com sessão. Saudação, filtro de humor e a nota usam o que `useLume` já expõe.
- Humor válido: `calma`, `clara`, `leve`, `pesada`.
- Erros de formulário vêm do store (`ok: false` e `error`). Não duplique a validação com outra mensagem.
- Copy curta, em português, no tom que já está na tela. Sem emoji.
