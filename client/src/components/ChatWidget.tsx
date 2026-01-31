import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Minus, X, Send, Mic, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "matsumind-chat-history";
const GREETING = "👋 Hi! I'm MatsuMind AI. Ask me anything about your business!";

type Message = { role: "user" | "assistant"; content: string };

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

function formatContent(text: string) {
  // Simple markdown-like: **bold**, bullet points
  return text
    .split(/\n/)
    .map((line) => {
      let out = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (out.trimStart().startsWith("- ") || out.trimStart().startsWith("• ")) {
        out = `<span class="block pl-2 border-l-2 border-[#059669] ml-1">${out.trim()}</span>`;
      }
      return out;
    })
    .join("<br />");
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const hist = loadHistory();
    if (hist.length) return hist;
    return [{ role: "assistant", content: GREETING }];
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => {
        const next = [...prev, { role: "assistant" as const, content: data.content }];
        saveHistory(next);
        return next;
      });
    },
    onError: (err) => {
      const message = err?.message?.trim() || "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry — ${message}` },
      ]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      saveHistory(next);
      return next;
    });

    const history = messages.slice(-5).map((m) => ({ role: m.role, content: m.content }));
    chatMutation.mutate({ message: text, history });
  };

  const handleClear = () => {
    setMessages([{ role: "assistant", content: GREETING }]);
    saveHistory([]);
  };

  const unreadCount = 0; // optional: could track if there were messages while closed

  return (
    <>
      {/* Backdrop when open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[999] transition-opacity duration-300"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Minimized button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-[1000] h-[60px] w-[60px] rounded-full shadow-2xl",
            "bg-[#059669] hover:bg-[#047857] text-white transition-all duration-300"
          )}
          aria-label="Open MatsuMind AI"
        >
          <MessageCircle className="h-7 w-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Expanded window */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[1000] w-[420px] h-[650px] max-h-[85vh]",
            "bg-white rounded-2xl shadow-2xl flex flex-col",
            "transition-all duration-300 animate-in slide-in-from-bottom-4"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-green-100 bg-green-50/50 rounded-t-2xl">
            <h2 className="font-semibold text-green-900">MatsuMind AI Assistant</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-700 hover:bg-green-100"
                onClick={handleClear}
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-700 hover:bg-green-100"
                onClick={() => setOpen(false)}
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-700 hover:bg-green-100"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-[#3B82F6] text-white"
                      : "bg-white text-gray-800 shadow-md border border-green-100"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-sm max-w-none prose-p:my-1"
                      dangerouslySetInnerHTML={{
                        __html: formatContent(msg.content),
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-green-100 rounded-2xl px-4 py-2.5 shadow-md">
                  <span className="text-sm text-gray-500">
                    AI is thinking
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-green-100 bg-green-50/30 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about clients, suppliers, inventory..."
                className="flex-1 rounded-xl border border-green-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                disabled={chatMutation.isPending}
              />
              <Button
                size="icon"
                className="rounded-xl bg-[#059669] hover:bg-[#047857] shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-xl border-green-200 shrink-0"
                aria-label="Mic"
              >
                <Mic className="h-4 w-4 text-green-700" />
              </Button>
            </div>
            {/* Quick actions after last assistant message */}
            {messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && !chatMutation.isPending && (
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-green-200 text-green-800 text-xs"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-green-200 text-green-800 text-xs"
                >
                  Export Report
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
