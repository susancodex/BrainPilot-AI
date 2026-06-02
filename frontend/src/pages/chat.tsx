import { useState, useEffect, useRef } from "react";
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useSendMessage,
  useDeleteConversation,
} from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/types";
import {
  BrainCircuit, Plus, Send, Trash2, MessageSquare,
  MoreHorizontal, ChevronRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LocalMessage {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export default function Chat() {
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: conversation } = useConversation(selectedId);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const deleteConversation = useDeleteConversation();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const convList = (conversations as Conversation[] | undefined) ?? [];
  const selectedConv = conversation as Conversation | undefined;

  const allMessages: LocalMessage[] =
    localMessages.length > 0
      ? localMessages
      : (selectedConv?.messages ?? []).map((m: Message) => ({ role: m.role, content: m.content }));

  useEffect(() => {
    setLocalMessages([]);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleNewConversation = () => {
    createConversation.mutate(
      { title: "New Chat" },
      {
        onSuccess: (data: Conversation) => {
          setSelectedId(data.id);
        },
      }
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedId) return;

    const userMsg: LocalMessage = { role: "user", content: input };
    const pendingMsg: LocalMessage = { role: "assistant", content: "...", pending: true };

    setLocalMessages((prev) => {
      const base =
        prev.length > 0
          ? prev
          : (selectedConv?.messages ?? []).map((m: Message) => ({ role: m.role, content: m.content }));
      return [...base, userMsg, pendingMsg];
    });

    const msgContent = input;
    setInput("");

    sendMessage.mutate(
      { conversation_id: selectedId, content: msgContent },
      {
        onSuccess: (data: { conversation_id: string; message: Message }) => {
          setLocalMessages((prev) => {
            const without = prev.filter((m) => !m.pending);
            return [
              ...without,
              { role: "assistant", content: data.message?.content ?? "No response" },
            ];
          });
          inputRef.current?.focus();
        },
        onError: () => {
          setLocalMessages((prev) => prev.filter((m) => !m.pending));
          toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-border shrink-0">
        <div className="p-3 border-b border-border">
          <Button className="w-full gap-2 h-9" onClick={handleNewConversation} disabled={createConversation.isPending}>
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : convList.length ? (
            convList.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/60 transition-colors group flex items-start justify-between gap-1",
                  selectedId === conv.id && "bg-primary/10 border-l-2 border-l-primary"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate text-foreground">{conv.title || "Untitled"}</span>
                  </div>
                  {conv.subject_context && (
                    <span className="text-[10px] text-muted-foreground">{conv.subject_context}</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation.mutate(conv.id);
                        if (selectedId === conv.id) setSelectedId(null);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted" />
              <p className="text-xs">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedId ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm text-foreground">{selectedConv?.title || "AI Tutor"}</p>
              {selectedConv?.subject_context && (
                <p className="text-xs text-muted-foreground">{selectedConv.subject_context}</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BrainCircuit className="w-14 h-14 mb-4 text-muted" />
                <h3 className="text-lg font-medium text-foreground">Ask me anything</h3>
                <p className="text-sm text-center max-w-sm mt-1">
                  I'm your AI tutor powered by Gemini. Ask about concepts, get explanations, or quiz yourself.
                </p>
              </div>
            )}

            {allMessages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[75%] text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.pending ? (
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:bg-background/50">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-5 py-3 border-t border-border bg-muted/20">
            <div className="flex gap-2 items-center max-w-3xl mx-auto">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI tutor anything..."
                className="flex-1 bg-background"
                disabled={sendMessage.isPending}
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!input.trim() || sendMessage.isPending} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
          <BrainCircuit className="w-16 h-16 mb-4 text-muted" />
          <h3 className="text-lg font-medium text-foreground">BrainPilot AI Tutor</h3>
          <p className="text-sm mt-1 max-w-sm text-center">Start a new conversation or pick an existing one to chat with your AI tutor.</p>
          <Button className="mt-4 gap-2" onClick={handleNewConversation} disabled={createConversation.isPending}>
            <Plus className="w-4 h-4" /> New Conversation
          </Button>
        </div>
      )}
    </div>
  );
}
