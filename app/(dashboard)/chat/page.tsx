"use client";

import { useChat } from "@ai-sdk/react";
import { useTranslations } from "@/components/i18n/i18n-provider";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Brain, Loader2, MessageSquare, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "poyraz-ui/atoms";
import { useEffect, useRef, useState } from "react";
import { toast } from "poyraz-ui/molecules";
import {
  createChatSessionAction,
  deleteChatSessionAction,
  listChatMessagesAction,
  listChatSessionsAction,
} from "./actions";

function formatMessageContent(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={j}>{part.slice(1, -1)}</em>;
        }
        return <span key={j}>{part}</span>;
      })}
      {i !== lines.length - 1 && <br />}
    </span>
  ));
}

type ChatSession = {
  id: string;
  title: string;
  created_at: string;
};

export default function AIChatPage() {
  const t = useTranslations();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isMobileSessionsOpen, setIsMobileSessionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) => {
      console.error(error);
      toast.error(error.message || "Yapay zeka ile iletişim kurulurken bir hata oluştu.");
    },
  });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const data = await listChatSessionsAction();
        setSessions(data);
        setActiveSessionId(data[0]?.id || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sohbetler yüklenemedi.");
      }
    }

    void fetchSessions();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }

      try {
        const data = await listChatMessagesAction(activeSessionId);
        const formattedMessages: UIMessage[] = data.map((message) => ({
          id: message.id,
          role: message.role as UIMessage["role"],
          parts: [{ type: "text", text: message.content }],
        }));
        setMessages(formattedMessages);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Mesajlar yüklenemedi.");
      }
    }

    void fetchMessages();
  }, [activeSessionId, setMessages]);

  async function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
  }

  async function handleDeleteSession(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await deleteChatSessionAction(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sohbet silinemedi.");
      return;
    }

    const nextSessions = sessions.filter((session) => session.id !== id);
    setSessions(nextSessions);

    if (activeSessionId === id) {
      setActiveSessionId(nextSessions[0]?.id || null);
      if (nextSessions.length === 0) setMessages([]);
    }
  }

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();

    const currentInput = input.trim();
    if (!currentInput || isLoading) return;

    let sessionId = activeSessionId;
    setInput("");

    if (!sessionId) {
      let newSession: ChatSession;
      try {
        newSession = await createChatSessionAction(
          currentInput.length > 32 ? `${currentInput.slice(0, 32)}...` : currentInput,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sohbet oluşturulamadı.");
        setInput(currentInput);
        return;
      }

      sessionId = newSession.id;
      setActiveSessionId(sessionId);
      setSessions((currentSessions) => [newSession, ...currentSessions]);
    }

    await sendMessage({ text: currentInput }, { body: { sessionId } });
  }

  const SessionsSidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <MessageSquare className="h-4 w-4" />
          Sohbetler
        </h2>
        <Button effect="shine" variant="secondary" size="icon-sm"  onClick={() => {
          handleNewChat();
          setIsMobileSessionsOpen(false);
        }}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="tiny-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
        {sessions.length === 0 ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            Henüz sohbet yok.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="group flex items-center gap-1">
              <Button effect="shine"
                type="button"
                variant={activeSessionId === session.id ? "default" : "secondary"}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setIsMobileSessionsOpen(false);
                }}
                className="min-w-0 flex-1 justify-start px-3"
              >
                <span className="truncate text-sm font-medium">
                  {session.title || "İsimsiz sohbet"}
                </span>
              </Button>
              <Button effect="shine"
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label={`${session.title || "İsimsiz sohbet"} sohbetini sil`}
                onClick={(event) => void handleDeleteSession(session.id, event)}
                className="text-destructive opacity-0 transition-opacity lg:group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-6rem)] w-[calc(100%+2rem)] md:w-full -mx-4 -my-4 md:mx-0 md:my-0 overflow-hidden md:rounded-sm border-0 md:border md:border-border bg-background">
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-80 flex-col border-r border-border bg-muted/20 md:flex">
        {SessionsSidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSessionsOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileSessionsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border bg-background transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileSessionsOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SessionsSidebarContent}
      </aside>
      <section className="flex min-w-0 flex-1 flex-col h-full">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">{t("chat.title")}</h1>
            </div>
          </div>
          <Button effect="shine" variant="secondary" size="sm" className="md:hidden text-xs px-3" onClick={() => setIsMobileSessionsOpen(true)}>
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Sohbetler
          </Button>
        </header>

        <div className="tiny-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Brain className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Verilerine danış</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Görevler, projeler, müşteriler, finans ve günlük kayıtların hakkında soru sorabilirsin.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] md:max-w-[85%] rounded-sm px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/40 text-foreground"
                    }`}
                  >
                    {formatMessageContent(text)}
                  </div>
                </div>
              );
            })
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Yanıt hazırlanıyor...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border p-3 md:p-4 shrink-0 bg-background">
          <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-sm border border-border bg-background p-1.5 focus-within:border-primary">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit(event);
                }
              }}
              placeholder="Mesaj gönder..."
              className="min-h-9 max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground placeholder:truncate"
              rows={1}
              disabled={isLoading}
            />
            {isLoading ? (
              <Button effect="shine" type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => void stop()}>
                <span className="h-3 w-3 bg-current" />
              </Button>
            ) : (
              <Button variant="default" effect="shine" type="submit" size="icon" className="shrink-0" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
