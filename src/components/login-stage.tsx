import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLume } from "@/lib/lume-store";

type Mode = "enter" | "create" | "reset";

const BEATS = ["mind", "line", "wash", "hello", "back", "sheet", "mail", "pass", "go", "rest"] as const;
type Beat = (typeof BEATS)[number];

const AT: Record<Beat, number> = {
  mind: 0,
  line: 520,
  wash: 1500,
  hello: 2380,
  back: 2960,
  sheet: 3400,
  mail: 4220,
  pass: 4820,
  go: 5420,
  rest: 6020,
};

function openingBeat(): Beat {
  if (typeof window === "undefined") return "mind";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try {
    seen = sessionStorage.getItem("lume.intro") === "1";
  } catch {
    seen = false;
  }
  return reduce || seen ? "rest" : "mind";
}

function reached(current: Beat, target: Beat) {
  return BEATS.indexOf(current) >= BEATS.indexOf(target);
}

function Field({
  id,
  label,
  aside,
  children,
}: {
  id: string;
  label: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-field px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs text-mute">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

function SecretInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-1">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent pr-11 text-base text-mist outline-none placeholder:text-mute"
      />
      <button
        type="button"
        className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center text-mute"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setVisible((current) => !current)}
      >
        <span className="relative size-5">
          <Eye
            className={cn(
              "absolute inset-0 size-5 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              visible ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
            )}
          />
          <EyeOff
            className={cn(
              "size-5 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              visible ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
            )}
          />
        </span>
      </button>
    </div>
  );
}

export function LoginStage() {
  const register = useLume((state) => state.register);
  const authenticate = useLume((state) => state.authenticate);
  const authenticateSocial = useLume((state) => state.authenticateSocial);
  const resetPassword = useLume((state) => state.resetPassword);
  const enter = useLume((state) => state.enter);
  const baseId = useId();

  const [mode, setMode] = useState<Mode>("enter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [beat, setBeat] = useState<Beat>(openingBeat);
  const [returned] = useState(() => openingBeat() === "rest");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (openingBeat() === "rest") return;
    timers.current = BEATS.filter((step) => step !== "mind").map((step) =>
      window.setTimeout(() => setBeat(step), AT[step]),
    );
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (beat !== "rest") return;
    try {
      sessionStorage.setItem("lume.intro", "1");
    } catch {
      /* a aba privada pode recusar */
    }
  }, [beat]);

  function skip() {
    for (const timer of timers.current) window.clearTimeout(timer);
    setBeat("rest");
  }

  function fail(message: string) {
    setError(message);
    setErrorKey((key) => key + 1);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setPassword("");
    setConfirm("");
  }

  function arrive(id: string) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      enter(id);
      return;
    }
    setLeaving(true);
    window.setTimeout(() => enter(id), 440);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    setBusy(true);
    let passed = false;
    try {
      if (mode === "create") {
        if (password !== confirm) {
          fail("As senhas não são iguais.");
          return;
        }
        const result = await register({ name, email, password });
        if (!result.ok) fail(result.error);
        else {
          passed = true;
          arrive(result.id);
        }
        return;
      }
      if (mode === "reset") {
        if (password !== confirm) {
          fail("As senhas não são iguais.");
          return;
        }
        const result = await resetPassword({ email, password });
        if (!result.ok) fail(result.error);
        else {
          setPassword("");
          setConfirm("");
          setMode("enter");
          setNotice("Senha atualizada neste aparelho. Pode entrar.");
        }
        return;
      }
      const result = await authenticate({ email, password });
      if (!result.ok) fail(result.error);
      else {
        passed = true;
        arrive(result.id);
      }
    } finally {
      if (!passed) setBusy(false);
    }
  }

  function onSocial(provider: "google" | "apple") {
    if (busy || leaving) return;
    const result = authenticateSocial(provider);
    if (result.ok) arrive(result.id);
  }

  function onStagePointer(event: PointerEvent<HTMLDivElement>) {
    if (beat === "rest") return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("input, button, a, textarea, label")) return;
    skip();
  }

  const emailId = `${baseId}-email`;
  const nameId = `${baseId}-name`;
  const passwordId = `${baseId}-password`;
  const confirmId = `${baseId}-confirm`;
  const actionLabel = busy
    ? mode === "create"
      ? "Criando…"
      : mode === "reset"
        ? "Guardando…"
        : "Entrando…"
    : mode === "create"
      ? "Criar conta"
      : mode === "reset"
        ? "Guardar senha"
        : "Entrar";

  const headline = mode === "create" ? "Crie a sua conta" : mode === "reset" ? "Nova senha" : "Bem-vindo";
  const showBack = mode === "enter";
  const chevron = beat !== "rest" ? "skip" : mode !== "enter" ? "back" : null;

  return (
    <div
      className={cn(
        "login-root relative min-h-dvh",
        returned && "is-return",
        leaving && "is-leaving",
        reached(beat, "line") && "is-line",
        reached(beat, "wash") && "is-wash",
        reached(beat, "hello") && "is-hello",
        reached(beat, "back") && "is-back",
        reached(beat, "sheet") && "is-sheet",
        reached(beat, "mail") && "is-mail",
        reached(beat, "pass") && "is-pass",
        reached(beat, "go") && "is-go",
        reached(beat, "rest") && "is-rest",
      )}
      onPointerDown={onStagePointer}
    >
      <div className="login-mind" aria-hidden="true" />
      <div className="login-tide" aria-hidden="true" />
      <p className="login-line">Entre na sua mente</p>

      <div className="lume-safe relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {chevron ? (
          <button
            type="button"
            className="grid size-11 place-items-center self-start text-cream"
            aria-label={chevron === "skip" ? "Pular animação" : "Voltar ao acesso"}
            onClick={chevron === "skip" ? skip : () => switchMode("enter")}
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : (
          <span className="grid size-11 place-items-center self-start text-cream" aria-hidden="true">
            <ChevronLeft className="size-6" />
          </span>
        )}

        <h1
          className="mt-4 text-2xl font-semibold tracking-tight text-cream"
          aria-label={showBack ? `${headline} de volta` : headline}
        >
          <span key={headline} className="login-hello">
            {headline}
          </span>
          {showBack ? <span className="login-back">de volta</span> : null}
        </h1>

        <section className="login-sheet mt-5 flex min-h-0 flex-1 flex-col rounded-4xl px-5 pt-5 pb-5" inert={!reached(beat, "sheet")}>
          <form className="flex min-h-0 flex-1 flex-col overflow-y-auto" onSubmit={onSubmit}>
            <div className="flex flex-col gap-3">
              {mode === "reset" ? (
                <p className="text-sm text-mute">
                  Sem nuvem e sem e-mail. Se a conta nasceu neste aparelho, defina outra senha aqui.
                </p>
              ) : null}

              {error ? (
                <p key={errorKey} className="lume-shake text-sm text-cream" role="alert">
                  {error}
                </p>
              ) : null}
              {notice ? <p className="text-sm text-mint">{notice}</p> : null}

              <div className="login-piece login-piece-mail flex flex-col gap-3" inert={!reached(beat, "mail")}>
                {mode === "create" ? (
                  <Field id={nameId} label="Nome">
                    <input
                      id={nameId}
                      value={name}
                      autoComplete="name"
                      placeholder="Seu nome"
                      onChange={(event) => setName(event.target.value)}
                      className="mt-1 w-full bg-transparent text-base text-mist outline-none placeholder:text-mute"
                    />
                  </Field>
                ) : null}
                <Field id={emailId} label="E-mail">
                  <input
                    id={emailId}
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="email"
                    value={email}
                    placeholder="você@exemplo.com"
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full bg-transparent text-base text-mist outline-none placeholder:text-mute"
                  />
                </Field>
              </div>

              <div className="login-piece login-piece-pass" inert={!reached(beat, "pass")}>
                <Field
                  id={passwordId}
                  label={mode === "reset" ? "Nova senha" : "Senha"}
                  aside={
                    mode === "enter" ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-mint"
                        onClick={() => switchMode("reset")}
                      >
                        Esqueceu a senha?
                      </button>
                    ) : null
                  }
                >
                  <SecretInput
                    id={passwordId}
                    value={password}
                    autoComplete={mode === "enter" ? "current-password" : "new-password"}
                    placeholder="Digite sua senha"
                    onChange={setPassword}
                  />
                </Field>
                {mode === "reset" || mode === "create" ? (
                  <div className="mt-3">
                    <Field id={confirmId} label="Confirmar">
                      <SecretInput
                        id={confirmId}
                        value={confirm}
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        onChange={setConfirm}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 pt-8">
              <div className="login-piece login-piece-go" inert={!reached(beat, "go")}>
                <button
                  type="submit"
                  className="press h-12 w-full rounded-full bg-cream text-base font-semibold text-ink"
                  disabled={busy}
                >
                  {actionLabel}
                </button>
              </div>

              {mode === "enter" ? (
                <div className="login-piece login-piece-rest flex flex-col gap-3" inert={!reached(beat, "rest")}>
                  <p className="text-center text-sm text-mute">ou continue com</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="press flex h-11 items-center justify-center gap-2 rounded-full bg-field px-4 text-sm font-medium text-mist"
                      onClick={() => onSocial("google")}
                    >
                      <GoogleMark />
                      Google
                    </button>
                    <button
                      type="button"
                      className="press flex h-11 items-center justify-center gap-2 rounded-full bg-field px-4 text-sm font-medium text-mist"
                      onClick={() => onSocial("apple")}
                    >
                      <AppleMark />
                      Apple
                    </button>
                  </div>
                </div>
              ) : null}

              <p className="login-piece login-piece-rest text-center text-sm text-mute" inert={!reached(beat, "rest")}>
                {mode === "enter" ? (
                  <>
                    Não tem conta?{" "}
                    <button type="button" className="font-medium text-mist" onClick={() => switchMode("create")}>
                      Criar conta
                    </button>
                  </>
                ) : (
                  <button type="button" className="font-medium text-mist" onClick={() => switchMode("enter")}>
                    Voltar ao acesso
                  </button>
                )}
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.74-.06-1.28-.2-1.84H12v3.34h5.52c-.11.9-.72 2.26-2.07 3.17l-.02.12 3 2.32.21.02c1.92-1.77 3-4.38 3-7.13Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45c-.85.59-1.98 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15l-.12.01-3.12 2.41-.04.11C4.67 19.98 8.06 22 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.32 13.99A6.18 6.18 0 0 1 6 12c0-.69.12-1.36.31-1.99l-.01-.13-3.16-2.45-.1.05A9.97 9.97 0 0 0 2 12c0 1.61.39 3.13 1.07 4.47l3.25-2.48Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.88c1.87 0 3.13.81 3.85 1.48l2.81-2.74C16.95 3.05 14.7 2 12 2 8.06 2 4.67 4.02 3.04 7.48l3.28 2.53C7.12 7.62 9.36 5.88 12 5.88Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.37 12.64c.02 2.18 1.91 2.9 1.93 2.91-.02.05-.3 1.03-1 2.04-.6.88-1.23 1.76-2.21 1.78-.97.02-1.28-.57-2.39-.57-1.11 0-1.45.55-2.37.59-.95.04-1.67-.95-2.28-1.83-1.24-1.8-2.19-5.08-.91-7.3.63-1.1 1.77-1.8 3-1.82.94-.02 1.82.63 2.39.63.57 0 1.64-.78 2.76-.66.47.02 1.79.19 2.64 1.43-.07.04-1.57.92-1.56 2.8ZM14.9 6.9c.5-.61.84-1.46.75-2.3-.72.03-1.6.48-2.11 1.09-.46.53-.87 1.39-.76 2.21.81.06 1.63-.41 2.12-1Z"
      />
    </svg>
  );
}
