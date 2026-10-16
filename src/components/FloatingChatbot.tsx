import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, Bot, Send, X } from "lucide-react";
import {
  useAccessibilityPreferences,
  useTranslations,
} from "@/lib/accessibility-preferences-context";
import type { LanguagePreference } from "@/lib/accessibility-preferences";

type ChatMessage = {
  id: number;
  sender: "bot" | "user";
  text: string;
  kind?: "error";
  language: LanguagePreference;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Solo para mostrar: unifica saltos de línea, evita huecos grandes y quita saltos en los extremos.
function formatBotText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function FloatingChatbot() {
  const { preferences } = useAccessibilityPreferences();
  const t = useTranslations().chatbot;
  const language = preferences.language;
  const [isOpen, setIsOpen] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      sender: "bot",
      text: t.initialGreeting,
      language,
    },
  ]);
  const [nextMessageId, setNextMessageId] = useState(1);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentSessionId: string;
    try {
      currentSessionId = window.localStorage.getItem("telcobras_session_id") ?? "";
      if (!currentSessionId) {
        currentSessionId = window.crypto.randomUUID();
        window.localStorage.setItem("telcobras_session_id", currentSessionId);
      }
    } catch (error) {
      console.error("No se pudo persistir la sesión del chatbot.", error);
      currentSessionId = window.crypto.randomUUID();
    }
    setSessionId(currentSessionId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, messages]);

  useEffect(() => {
    if (isOpen && !isLoading && sessionId) {
      messageInputRef.current?.focus();
    }
  }, [isOpen, isLoading, sessionId]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userText = input.trim();
    if (!userText || !sessionId || isLoading) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: nextMessageId, sender: "user", text: userText, language },
    ]);
    setNextMessageId((currentId) => currentId + 1);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, mensaje: userText }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error(t.responseParseError);
      }

      if (!response.ok) {
        const errorCode = isRecord(payload) ? payload["error"] : undefined;
        const message =
          typeof errorCode === "string" && Object.hasOwn(t.errors, errorCode)
            ? t.errors[errorCode as keyof typeof t.errors]
            : t.errors.generic;
        throw new Error(message);
      }

      if (!isRecord(payload) || typeof payload["respuesta_bot"] !== "string") {
        throw new Error(t.invalidResponse);
      }

      const botResponse = payload["respuesta_bot"];
      setMessages((currentMessages) => [
        ...currentMessages,
        { id: nextMessageId + 1, sender: "bot", text: botResponse, language },
      ]);
      setNextMessageId((currentId) => currentId + 1);
    } catch (error) {
      console.error("Falló el envío del mensaje al asistente.", error);
      const errorText = error instanceof Error ? error.message : t.errors.generic;
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextMessageId + 1,
          sender: "bot",
          text: errorText,
          kind: "error",
          language,
        },
      ]);
      setNextMessageId((currentId) => currentId + 1);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label={t.title}
          aria-modal="false"
          className="fixed inset-x-3 bottom-16 top-12 z-50 flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl shadow-slate-950/25 sm:inset-auto sm:bottom-36 sm:right-5 sm:h-[min(720px,calc(100vh-10rem))] sm:w-[380px]"
          role="dialog"
        >
          <header className="flex shrink-0 items-center justify-between bg-[#006BA4] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Bot aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-bold leading-tight">{t.title}</h2>
                <p className="text-xs text-white/85">{t.subtitle}</p>
              </div>
            </div>
            <button
              aria-label={t.close}
              className="rounded-full p-2 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-background p-4"
            role="log"
          >
            {messages.map((message) => {
              const isBotMessage = message.sender === "bot";

              return (
                <div
                  key={message.id}
                  className={`flex ${isBotMessage ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.kind === "error"
                        ? "chat-message--error rounded-bl-md border-2 border-dashed border-destructive bg-muted text-foreground"
                        : isBotMessage
                          ? "whitespace-pre-line break-words rounded-bl-md bg-muted text-foreground"
                          : "rounded-br-md bg-[#006BA4] text-white"
                    }`}
                    role={message.kind === "error" ? "alert" : undefined}
                  >
                    <span className="sr-only">
                      {isBotMessage ? `${t.assistant}: ` : `${t.user}: `}
                    </span>
                    {message.kind === "error" && (
                      <span className="mb-1 flex items-center gap-1.5 font-bold text-destructive">
                        <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
                        {t.errorTitle}
                      </span>
                    )}
                    <span lang={message.language}>
                      {isBotMessage ? formatBotText(message.text) : message.text}
                    </span>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div
                aria-label={t.responding}
                className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-muted-foreground"
                role="status"
              >
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                <span className="ml-2 text-xs">{t.responding}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3"
            onSubmit={handleSendMessage}
          >
            <label className="sr-only" htmlFor="telcobras-chat-message">
              {t.messageLabel}
            </label>
            <input
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full border border-input bg-muted px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isLoading || !sessionId}
              id="telcobras-chat-message"
              name="message"
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder={t.placeholder}
              ref={messageInputRef}
              value={input}
              type="text"
            />
            <button
              aria-label={t.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006BA4] text-white transition-colors hover:bg-[#005888] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2491CC]"
              disabled={isLoading || !sessionId || !input.trim()}
              type="submit"
            >
              <Send aria-hidden="true" className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}

      {welcomeVisible && !isOpen && (
        <div
          className="chatbot-invite-animation fixed bottom-[17rem] right-4 z-50 w-[min(12rem,calc(100vw-2rem))] rounded-2xl border border-[#2491CC]/25 bg-card p-2.5 pr-8 text-card-foreground shadow-xl shadow-slate-950/15 backdrop-blur-sm"
          role="status"
        >
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 right-10 h-3 w-3 rotate-45 border-b border-r border-[#2491CC]/25 bg-card"
          />
          <button
            className="block text-left"
            onClick={() => {
              setWelcomeVisible(false);
              setIsOpen(true);
            }}
            type="button"
          >
            <span className="block text-xs font-extrabold">{t.welcomeTitle}</span>
            <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-muted-foreground">
              {t.welcomeDescription}
            </span>
            <span className="mt-1 inline-block text-[0.6875rem] font-extrabold text-[var(--brand-link)]">
              {t.welcomeCta}
            </span>
          </button>
          <button
            aria-label={t.dismissWelcome}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1"
            onClick={() => setWelcomeVisible(false)}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? t.close : t.open}
        className={`fixed right-0 z-50 flex items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2491CC] ${
          isOpen
            ? "bottom-24 h-[60px] w-[60px] bg-[#006BA4] text-white shadow-xl shadow-[#2491CC]/40"
            : "bottom-32 h-[128px] w-[116px]"
        }`}
        onClick={() => {
          setWelcomeVisible(false);
          setIsOpen((open) => !open);
        }}
        type="button"
      >
        {isOpen ? (
          <X aria-hidden="true" className="h-7 w-7" />
        ) : (
          <span
            aria-hidden="true"
            className="relative flex h-[124px] w-[112px] scale-[1.15] flex-col items-center justify-end animate-bounce [animation-duration:3s] drop-shadow-lg"
          >
            <span className="z-10 -mb-0.5 flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-[#88BD4C] ring-2 ring-emerald-200/70 shadow-[0_0_8px_#88BD4C]" />
              <span className="h-2 w-0.5 bg-[#0087C3]" />
            </span>
            <span className="chatbot-robot-vibrate relative z-10 flex h-8 w-10 items-center justify-center rounded-xl border-2 border-white bg-gradient-to-b from-[#0087C3] to-[#1a6f9c] shadow-md">
              <span className="absolute -left-1 top-2 h-3 w-1 rounded-l-sm bg-[#88BD4C]" />
              <span className="absolute -right-1 top-2 h-3 w-1 rounded-r-sm bg-[#88BD4C]" />
              <span className="flex h-5 w-8 flex-col items-center justify-center rounded-md bg-[#0A192F]">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_5px_#7dd3fc]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_5px_#7dd3fc]" />
                </span>
                <span className="mt-0.5 h-1 w-2 rounded-b-full border-b border-sky-300" />
              </span>
            </span>
            <span className="relative z-10 -mt-0.5 flex h-5 w-7 items-center justify-center rounded-lg border border-white bg-gradient-to-b from-[#0087C3] to-[#124b6e] shadow-sm">
              <span className="flex w-4 items-center gap-0.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-[#88BD4C] shadow-[0_0_4px_#88BD4C]" />
                <span className="h-px flex-1 bg-sky-300/80" />
                <span className="h-1 w-1 shrink-0 rounded-full bg-[#F3CB35]" />
              </span>
            </span>
            <span className="absolute bottom-0 h-1 w-10 rounded-full bg-gradient-to-r from-transparent via-[#88BD4C] to-transparent opacity-90 blur-[1px]" />
          </span>
        )}
      </button>
    </>
  );
}
