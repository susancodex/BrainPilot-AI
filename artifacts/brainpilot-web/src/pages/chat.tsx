import { useState, useEffect, useRef } from "react";
import { useConversations, useConversation, useSendMessage, useDeleteConversation } from "@/hooks/use-chat";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrainCircuit, Send, User, MessageSquarePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth";

export default function Chat() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const activeId = searchParams.get("id");

  const { data: conversations, isLoading: isLoadingList } = useConversations();
  const { data: activeConversation, isLoading: isLoadingChat, refetch } = useConversation(activeId);
  const sendMessage = useSendMessage();
  const deleteConversation = useDeleteConversation();
  
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamingMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const messageText = input;
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const url = new URL("/api/v1/chatbot/send/stream/", window.location.origin);
      url.searchParams.append("message", messageText);
      if (activeId) {
        url.searchParams.append("conversation_id", activeId);
      }

      const token = getAccessToken();
      const eventSource = new EventSource(`${url.toString()}&token=${token}`);

      eventSource.addEventListener("chunk", (e) => {
        try {
          const data = JSON.parse(e.data);
          setStreamingMessage((prev) => prev + data.text);
        } catch (err) {}
      });

      eventSource.addEventListener("done", () => {
        eventSource.close();
        setIsStreaming(false);
        refetch(); // Refresh to get the finalized message from DB
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();
        setIsStreaming(false);
        // Fallback to standard mutation if streaming fails
        sendMessage.mutate({ content: messageText, conversation_id: activeId || undefined });
      });

    } catch (err) {
      setIsStreaming(false);
      sendMessage.mutate({ content: messageText, conversation_id: activeId || undefined });
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation.mutate(id, {
        onSuccess: () => {
          if (activeId === id) setLocation("/chat");
        }
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-4 border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <Button 
            className="w-full gap-2 shadow-sm font-semibold" 
            onClick={() => setLocation("/chat")}
            variant={!activeId ? "default" : "outline"}
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations?.map((conv: any) => (
              <div key={conv.id} className="relative group">
                <Button
                  variant={activeId === conv.id ? "secondary" : "ghost"}
                  className={cn("w-full justify-start font-medium truncate pr-10", activeId === conv.id && "bg-primary/10 text-primary hover:bg-primary/15")}
                  onClick={() => setLocation(`/chat?id=${conv.id}`)}
                >
                  <span className="truncate">{conv.title || "New Conversation"}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(conv.id, e)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        {activeConversation?.subject_context && (
          <div className="px-4 py-2 border-b border-border bg-accent/5 text-xs font-semibold text-accent flex items-center justify-center">
            Subject Context: {activeConversation.subject_context}
          </div>
        )}
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {activeConversation?.messages?.map((msg: any, i: number) => (
              <div key={i} className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <Avatar className="h-8 w-8 shrink-0 border border-border shadow-sm">
                  {msg.role === "user" ? (
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      <User className="w-4 h-4"/>
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      <BrainCircuit className="w-4 h-4"/>
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className={cn(
                  "px-5 py-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-muted/60 border border-border text-foreground rounded-tl-sm whitespace-pre-wrap"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div className="flex gap-4 flex-row">
                <Avatar className="h-8 w-8 shrink-0 border border-border shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white"><BrainCircuit className="w-4 h-4"/></AvatarFallback>
                </Avatar>
                <div className="px-5 py-3.5 rounded-2xl max-w-[85%] text-sm bg-muted/60 border border-border text-foreground rounded-tl-sm whitespace-pre-wrap shadow-sm leading-relaxed">
                  {streamingMessage}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle rounded-full" />
                </div>
              </div>
            )}
            
            {(!activeConversation?.messages?.length && !isStreaming) && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 mt-20">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">How can I help you study today?</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">Ask me to explain a concept, quiz you, or help organize your notes.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border">
          <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message BrainPilot..."
              className="flex-1 rounded-full pl-6 pr-14 py-6 shadow-sm border-primary/20 focus-visible:ring-primary/50 text-base"
              disabled={isStreaming}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 shadow-sm"
              disabled={!input.trim() || isStreaming}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
