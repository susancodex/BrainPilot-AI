import { useState } from "react";
import { Link } from "wouter";
import { useListChats, useCreateChat, useDeleteChat, getListChatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatRelative, cn } from "@/lib/utils";
import { MessageSquare, Plus, Trash2, Bot, BookOpen, RotateCcw } from "lucide-react";

const MODES = [
  { value: "study", label: "Study Assistant", icon: Bot, desc: "General study help and explanations" },
  { value: "tutor", label: "AI Tutor", icon: BookOpen, desc: "Deep-dive learning and concepts" },
  { value: "coach", label: "Revision Coach", icon: RotateCcw, desc: "Test recall and revision strategies" },
];

const MODE_COLORS: Record<string, string> = {
  study: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  tutor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  coach: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function ChatListPage() {
  const qc = useQueryClient();
  const { data: chats, isLoading } = useListChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("study");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createChat.mutate(
      { data: { title: title.trim(), mode } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListChatsQueryKey() });
          setTitle("");
          setShowNew(false);
        },
      }
    );
  }

  function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    deleteChat.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListChatsQueryKey() }) });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Chat</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your intelligent study conversations</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4" /> New chat
        </button>
      </div>

      {/* New chat form */}
      {showNew && (
        <div className="mb-5 p-5 border border-border rounded-xl bg-card">
          <h3 className="font-semibold text-foreground mb-4">Start a new conversation</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Topic</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Photosynthesis, Calculus integration..."
                autoFocus
                data-testid="input-chat-title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={cn("p-3 rounded-lg border text-left transition-all", mode === m.value ? "border-primary bg-primary/5" : "border-border hover:border-border/80")}
                    data-testid={`mode-${m.value}`}
                  >
                    <m.icon className={cn("w-4 h-4 mb-1.5", mode === m.value ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-xs font-semibold text-foreground">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={!title.trim() || createChat.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50" data-testid="button-create-chat">
                {createChat.isPending ? "Creating..." : "Start chat"}
              </button>
              <button type="button" onClick={() => { setShowNew(false); setTitle(""); }} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Chat list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse bg-muted" />)}</div>
      ) : (chats ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm mt-1">Start a chat with your AI study assistant</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(chats ?? []).map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <span className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group" data-testid={`chat-${chat.id}`}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{chat.title}</p>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", MODE_COLORS[chat.mode] ?? MODE_COLORS.study)}>
                      {chat.mode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {chat.messageCount} messages · {chat.lastMessageAt ? formatRelative(chat.lastMessageAt) : "No messages yet"}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  data-testid={`delete-chat-${chat.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
