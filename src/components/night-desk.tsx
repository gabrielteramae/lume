import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { MOODS, useLume, type Mood } from "@/lib/lume-store";

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function cap(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function NightDesk() {
  const sessionId = useLume((state) => state.sessionId);
  const account = useLume((state) => state.accounts.find((item) => item.id === state.sessionId) ?? null);
  const notes = useLume((state) => state.notes);
  const signOut = useLume((state) => state.signOut);
  const addNote = useLume((state) => state.addNote);
  const updateNote = useLume((state) => state.updateNote);
  const removeNote = useLume((state) => state.removeNote);

  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState<Mood>("calma");
  const [filter, setFilter] = useState<Mood | "todas">("todas");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [armedDelete, setArmedDelete] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const mine = notes.filter((note) => note.accountId === sessionId);
  const visible = filter === "todas" ? mine : mine.filter((note) => note.mood === filter);
  const firstName = account?.name.split(" ")[0] ?? "";
  const hello = firstName ? `${greeting(now)}, ${firstName}` : greeting(now);
  const hint =
    account?.provider === "google"
      ? "Entrou com Google · só neste aparelho"
      : account?.provider === "apple"
        ? "Entrou com Apple · só neste aparelho"
        : account?.email
          ? `${account.email} · só neste aparelho`
          : "Só neste aparelho";

  function onSave(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    addNote(draft, mood);
    setDraft("");
    setFilter("todas");
  }

  return (
    <div className="lume-desk min-h-dvh">
      <div className="lume-safe mx-auto flex w-full max-w-md flex-col">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-medium tracking-tight text-mist">Lume</p>
            <p className="mt-1 text-sm text-mute">{cap(format(now, "EEEE, d 'de' MMMM", { locale: ptBR }))}</p>
          </div>
          <button type="button" className="press mt-2 text-sm font-medium text-mute" onClick={signOut}>
            Sair
          </button>
        </header>

        <h1 className="mt-10 font-display text-4xl leading-none font-medium tracking-tight text-mist">{hello}</h1>
        <p className="mt-3 text-sm text-mute">{hint}</p>

        <form className="mt-8 rounded-3xl bg-card p-4" onSubmit={onSave}>
          <label htmlFor="tonight" className="text-xs text-mute">
            Esta noite
          </label>
          <textarea
            id="tonight"
            value={draft}
            rows={3}
            maxLength={600}
            placeholder="O que ficou do dia?"
            onChange={(event) => setDraft(event.target.value)}
            className="mt-2 w-full resize-none bg-transparent text-base text-mist outline-none placeholder:text-mute"
          />
          <div role="radiogroup" aria-label="Tom da nota" className="mt-3 grid grid-cols-4 gap-2">
            {MOODS.map((item) => {
              const selected = mood === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={cn(
                    "press h-11 rounded-full text-sm font-medium",
                    selected ? "bg-mint text-ink" : "bg-field text-mute",
                  )}
                  onClick={() => setMood(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            className={cn(
              "press mt-4 h-12 w-full rounded-full text-base font-semibold",
              draft.trim() ? "bg-cream text-ink" : "bg-field text-mute",
            )}
            disabled={!draft.trim()}
          >
            Guardar
          </button>
        </form>

        <section className="mt-10 pb-8" aria-label="Notas guardadas">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-medium text-mist">Guardadas</h2>
            <p className="text-sm text-mute tabular-nums">{mine.length}</p>
          </div>

          {mine.length === 0 ? (
            <p className="mt-4 text-sm text-mute">A noite ainda está em branco. Uma linha já acende.</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-5 gap-2" aria-label="Filtrar por tom">
                <FilterChip active={filter === "todas"} onClick={() => setFilter("todas")}>
                  Todas
                </FilterChip>
                {MOODS.map((item) => (
                  <FilterChip
                    key={item.id}
                    active={filter === item.id}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </FilterChip>
                ))}
              </div>
              {visible.length === 0 ? (
                <p className="mt-4 text-sm text-mute">Nada com esse tom.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {visible.map((note) => {
                    const moodLabel = MOODS.find((item) => item.id === note.mood)?.label ?? note.mood;
                    const isEditing = editing === note.id;
                    const armed = armedDelete === note.id;
                    return (
                      <li key={note.id} className="rounded-3xl bg-card px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-mint">{moodLabel}</p>
                          <p className="text-xs text-mute">
                            {formatDistanceToNow(note.createdAt, { locale: ptBR, addSuffix: true })}
                          </p>
                        </div>
                        {isEditing ? (
                          <textarea
                            value={editDraft}
                            rows={3}
                            maxLength={600}
                            aria-label="Editar nota"
                            onChange={(event) => setEditDraft(event.target.value)}
                            className="mt-3 w-full resize-none bg-transparent text-base text-mist outline-none"
                          />
                        ) : (
                          <p className="mt-3 text-base text-mist">{note.body}</p>
                        )}
                        <div className="mt-3 flex justify-end gap-2">
                          {isEditing ? (
                            <button
                              type="button"
                              className="press grid size-11 place-items-center rounded-full bg-mint text-ink"
                              aria-label="Guardar edição"
                              onClick={() => {
                                updateNote(note.id, editDraft);
                                setEditing(null);
                              }}
                            >
                              <Check className="size-5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="press grid size-11 place-items-center rounded-full bg-field text-mute"
                              aria-label="Editar nota"
                              onClick={() => {
                                setEditing(note.id);
                                setEditDraft(note.body);
                                setArmedDelete(null);
                              }}
                            >
                              <Pencil className="size-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className={cn(
                              "press grid h-11 place-items-center rounded-full bg-field px-3 text-sm text-mute",
                              armed ? "min-w-24" : "size-11",
                            )}
                            aria-label={armed ? "Confirmar apagar" : "Apagar nota"}
                            onClick={() => {
                              if (!armed) {
                                setArmedDelete(note.id);
                                return;
                              }
                              removeNote(note.id);
                              setArmedDelete(null);
                              if (editing === note.id) setEditing(null);
                            }}
                          >
                            {armed ? "Apagar" : <Trash2 className="size-5" />}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "press h-10 w-full rounded-full px-1 text-sm font-medium",
        active ? "bg-mint text-ink" : "bg-field text-mute",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
