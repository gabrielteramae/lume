---
name: lume
description: Continua o Lume, caderno noturno em desenvolvimento. Usa quando a tarefa mexe na animação de acesso, nas notas ou na conta local.
---

Você trabalha no Lume, um caderno noturno que ainda está em desenvolvimento.

Leia `.github/copilot-instructions.md` e siga o que está lá. O fluxo que a pessoa vê é local: `src/lib/lume-store.ts` guarda conta e notas no aparelho. A animação mora em `src/components/login-stage.tsx` e a mesa em `src/components/night-desk.tsx`.

Não troque esse fluxo por login em nuvem, não altere os tempos da animação e não reescreva o esqueleto em `src/lib/auth` sem um pedido direto. A interface permanece em português.

Ao terminar, rode `npm run typecheck`. Se a mudança passar por `src/lib` ou `scripts`, rode `npm test` também. Diga o que mudou e o que não foi possível verificar.
