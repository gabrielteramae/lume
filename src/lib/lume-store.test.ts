import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useLume } from "./lume-store.ts";

function reset() {
  useLume.setState({
    accounts: [],
    notes: [],
    sessionId: null,
    lastMood: "calma",
    lastRemoved: null,
  });
}

afterEach(reset);

test("criar conta recusa senha curta e e-mail repetido", async () => {
  const { register, authenticate } = useLume.getState();
  const short = await register({ name: "Ana", email: "ana@lume.test", password: "123" });
  assert.equal(short.ok, false);

  const created = await register({ name: "Ana", email: "ana@lume.test", password: "segredo" });
  assert.equal(created.ok, true);
  if (!created.ok) return;

  const again = await register({ name: "Ana", email: "Ana@lume.test", password: "segredo" });
  assert.equal(again.ok, false);

  const wrong = await authenticate({ email: "ana@lume.test", password: "outra" });
  assert.equal(wrong.ok, false);
  const right = await authenticate({ email: "ana@lume.test", password: "segredo" });
  assert.deepEqual(right, { ok: true, id: created.id });
});

test("nota guarda o tom e desfazer devolve o texto", () => {
  useLume.setState({ sessionId: "conta" });
  const { addNote, removeNote, undoRemove, rememberMood } = useLume.getState();
  rememberMood("pesada");
  const id = addNote("a noite fechou", "pesada");
  assert.ok(id);
  assert.equal(useLume.getState().lastMood, "pesada");
  assert.equal(useLume.getState().notes[0]?.body, "a noite fechou");

  removeNote(id!);
  assert.equal(useLume.getState().notes.length, 0);
  assert.equal(useLume.getState().lastRemoved?.id, id);

  undoRemove();
  assert.equal(useLume.getState().notes[0]?.body, "a noite fechou");
  assert.equal(useLume.getState().lastRemoved, null);
});

test("nota vazia não entra", () => {
  useLume.setState({ sessionId: "conta" });
  const id = useLume.getState().addNote("   ", "leve");
  assert.equal(id, null);
  assert.equal(useLume.getState().notes.length, 0);
});
