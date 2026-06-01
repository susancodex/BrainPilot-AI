import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useGetChat, useSendMessage, getGetChatQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";

export default function ChatPage({ id }: { id: number }) {
  const qc = useQueryClient();
  const { data: chat, isLoading } = useGetChat(id, { query: { enabled: !!id, queryKey: getGetChatQueryKey(id) } });
  const sendMessage = useSendMessage();
  const [input, setInput] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat?.messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    setInput("");
    sendMessage.mutate(
      { id, data: { content } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetChatQueryKey(id) }) }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chat) return <div className="p-6 text-muted-foreground">Chat not found.</div>;

  const MODE_COLOR: Record<string, string> = {
    study: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    tutor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    coach: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] lg:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
        <Link href="/chat">
          <span className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{chat.title}</p>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", MODE_COLOR[chat.mode] ?? MODE_COLOR.study)}>
          {chat.mode}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {chat.messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">Ready to help you study</p>
            <p className="text-sm text-muted-foreground mt-1">Ask anything about {chat.title}</p>
          </div>
        )}
        {chat.messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={cn("flex items-start gap-3", isUser && "flex-row-reverse")} data-testid={`message-${msg.id}`}>
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", isUser ? "bg-primary" : "bg-primary/10")}>
                {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className={cn("max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm"
              )}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {sendMessage.isPending && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-5 py-4 border-t border-border bg-background">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI study assistant..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            data-testid="input-message"
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
            data-testid="button-send"
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
