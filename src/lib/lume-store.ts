import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MOODS = [
  { id: "calma", label: "Calma" },
  { id: "clara", label: "Clara" },
  { id: "leve", label: "Leve" },
  { id: "pesada", label: "Pesada" },
] as const;

export type Mood = (typeof MOODS)[number]["id"];
export type Provider = "email" | "google" | "apple";

export type Account = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  provider: Provider;
};

export type Note = {
  id: string;
  accountId: string;
  body: string;
  mood: Mood;
  createdAt: number;
};

type Ok = { ok: true; id: string };
type Err = { ok: false; error: string };
type Result = Ok | Err;

type LumeState = {
  accounts: Account[];
  notes: Note[];
  sessionId: string | null;
  lastMood: Mood;
  lastRemoved: Note | null;
  register: (input: { name: string; email: string; password: string }) => Promise<Result>;
  authenticate: (input: { email: string; password: string }) => Promise<Result>;
  authenticateSocial: (provider: "google" | "apple") => Result;
  resetPassword: (input: { email: string; password: string }) => Promise<Result>;
  enter: (id: string) => void;
  signOut: () => void;
  rememberMood: (mood: Mood) => void;
  addNote: (body: string, mood: Mood) => string | null;
  updateNote: (id: string, body: string) => void;
  removeNote: (id: string) => void;
  undoRemove: () => void;
  dismissRemoved: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

async function digest(email: string, password: string) {
  const bytes = new TextEncoder().encode(`${email}\n${password}`);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const useLume = create<LumeState>()(
  persist(
    (set, get) => ({
      accounts: [],
      notes: [],
      sessionId: null,
      lastMood: "calma",
      lastRemoved: null,
      async register({ name, email, password }) {
        const nextEmail = cleanEmail(email);
        const nextName = name.trim();
        if (nextName.length < 2) return { ok: false, error: "Como podemos te chamar?" };
        if (!EMAIL.test(nextEmail)) return { ok: false, error: "Digite um e-mail válido." };
        if (password.length < 6) return { ok: false, error: "Use pelo menos 6 caracteres." };
        if (get().accounts.some((account) => account.email === nextEmail)) {
          return { ok: false, error: "Já existe uma conta com esse e-mail. Entre com a senha." };
        }
        const account: Account = {
          id: crypto.randomUUID(),
          email: nextEmail,
          name: nextName,
          passwordHash: await digest(nextEmail, password),
          provider: "email",
        };
        set((state) => ({ accounts: [...state.accounts, account] }));
        return { ok: true, id: account.id };
      },
      async authenticate({ email, password }) {
        const nextEmail = cleanEmail(email);
        if (!EMAIL.test(nextEmail)) return { ok: false, error: "Digite um e-mail válido." };
        if (!password) return { ok: false, error: "Digite a senha." };
        const account = get().accounts.find((item) => item.email === nextEmail);
        if (!account) {
          return { ok: false, error: "Não encontramos essa conta neste aparelho." };
        }
        if (account.provider !== "email") {
          const via = account.provider === "google" ? "Google" : "Apple";
          return { ok: false, error: `Essa entrada usa ${via}, não uma senha.` };
        }
        const passwordHash = await digest(nextEmail, password);
        if (passwordHash !== account.passwordHash) {
          return { ok: false, error: "Senha não confere." };
        }
        return { ok: true, id: account.id };
      },
      authenticateSocial(provider) {
        const id = `social:${provider}`;
        const existing = get().accounts.find((account) => account.id === id);
        if (!existing) {
          const account: Account = {
            id,
            email: "",
            name: "",
            passwordHash: "",
            provider,
          };
          set((state) => ({ accounts: [...state.accounts, account] }));
        }
        return { ok: true, id };
      },
      async resetPassword({ email, password }) {
        const nextEmail = cleanEmail(email);
        if (!EMAIL.test(nextEmail)) return { ok: false, error: "Digite um e-mail válido." };
        if (password.length < 6) return { ok: false, error: "Use pelo menos 6 caracteres." };
        const account = get().accounts.find((item) => item.email === nextEmail);
        if (!account) {
          return { ok: false, error: "Não há conta com esse e-mail neste aparelho." };
        }
        if (account.provider !== "email") {
          const via = account.provider === "google" ? "Google" : "Apple";
          return { ok: false, error: `Essa entrada usa ${via}, não uma senha.` };
        }
        const passwordHash = await digest(nextEmail, password);
        set((state) => ({
          accounts: state.accounts.map((item) =>
            item.id === account.id ? { ...item, passwordHash } : item,
          ),
        }));
        return { ok: true, id: account.id };
      },
      enter(id) {
        set({ sessionId: id });
      },
      signOut() {
        set({ sessionId: null, lastRemoved: null });
      },
      rememberMood(mood) {
        set({ lastMood: mood });
      },
      addNote(body, mood) {
        const accountId = get().sessionId;
        const text = body.trim().slice(0, 600);
        if (!accountId || !text) return null;
        const note: Note = {
          id: crypto.randomUUID(),
          accountId,
          body: text,
          mood,
          createdAt: Date.now(),
        };
        set((state) => ({ notes: [note, ...state.notes], lastMood: mood, lastRemoved: null }));
        return note.id;
      },
      updateNote(id, body) {
        const accountId = get().sessionId;
        const text = body.trim().slice(0, 600);
        if (!accountId || !text) return;
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id && note.accountId === accountId ? { ...note, body: text } : note,
          ),
        }));
      },
      removeNote(id) {
        const accountId = get().sessionId;
        if (!accountId) return;
        const note = get().notes.find((item) => item.id === id && item.accountId === accountId);
        if (!note) return;
        set((state) => ({
          lastRemoved: note,
          notes: state.notes.filter((item) => item.id !== id),
        }));
      },
      undoRemove() {
        const note = get().lastRemoved;
        const accountId = get().sessionId;
        if (!note || note.accountId !== accountId) return;
        set((state) => ({
          lastRemoved: null,
          notes: [note, ...state.notes.filter((item) => item.id !== note.id)].sort(
            (a, b) => b.createdAt - a.createdAt,
          ),
        }));
      },
      dismissRemoved() {
        set({ lastRemoved: null });
      },
    }),
    {
      name: "lume",
      skipHydration: true,
      partialize: (state) => ({
        accounts: state.accounts,
        notes: state.notes,
        sessionId: state.sessionId,
        lastMood: state.lastMood,
      }),
    },
  ),
);
