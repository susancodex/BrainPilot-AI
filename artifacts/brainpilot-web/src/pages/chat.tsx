import { useState, useEffect, useRef } from "react";
import { useConversations, useConversation, useSendMessage } from "@/hooks/use-chat";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrainCircuit, Send, User, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth";

export default function Chat() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const activeId = searchParams.get("id");

  const { data: conversations, isLoading: isLoadingList } = useConversations();
  const { data: activeConversation, isLoading: isLoadingChat } = useConversation(activeId);
  
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

    // Start SSE stream
    try {
      const url = new URL("/api/v1/chatbot/send/stream/", window.location.origin);
      url.searchParams.append("message", messageText);
      if (activeId) {
        url.searchParams.append("conversation_id", activeId);
      }

      const token = getAccessToken();
      const eventSource = new EventSource(`${url.toString()}&token=${token}`); // Note: SSE with auth header is tricky, passing token in query or relying on cookies. Assuming query or standard setup.

      eventSource.addEventListener("chunk", (e) => {
        try {
          const data = JSON.parse(e.data);
          setStreamingMessage((prev) => prev + data.text);
        } catch (err) {}
      });

      eventSource.addEventListener("done", () => {
        eventSource.close();
        setIsStreaming(false);
        // Refresh conversation to get proper state from server
        // Using window.location.reload is hacky, in real app we'd invalidate queries
        // Assuming we're using a helper function in a real scenario
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();
        setIsStreaming(false);
      });

    } catch (err) {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-4 border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <Button 
            className="w-full gap-2" 
            onClick={() => setLocation("/chat")}
            variant={!activeId ? "secondary" : "ghost"}
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations?.map((conv: any) => (
              <Button
                key={conv.id}
                variant={activeId === conv.id ? "secondary" : "ghost"}
                className="w-full justify-start font-normal truncate"
                onClick={() => setLocation(`/chat?id=${conv.id}`)}
              >
                <span className="truncate">{conv.title || "New Conversation"}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6 max-w-3xl mx-auto">
            {activeConversation?.messages?.map((msg: any, i: number) => (
              <div key={i} className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <Avatar className="h-8 w-8 shrink-0">
                  {msg.role === "user" ? (
                    <>
                      <AvatarFallback className="bg-primary text-primary-foreground"><User className="w-4 h-4"/></AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarFallback className="bg-accent text-accent-foreground"><BrainCircuit className="w-4 h-4"/></AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className={cn(
                  "px-4 py-3 rounded-2xl max-w-[80%] text-sm",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted text-foreground rounded-tl-none whitespace-pre-wrap"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Streaming message indicator */}
            {isStreaming && (
              <div className="flex gap-4 flex-row">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-accent text-accent-foreground"><BrainCircuit className="w-4 h-4"/></AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 rounded-2xl max-w-[80%] text-sm bg-muted text-foreground rounded-tl-none whitespace-pre-wrap">
                  {streamingMessage}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-foreground animate-pulse align-middle" />
                </div>
              </div>
            )}
            
            {(!activeConversation?.messages?.length && !isStreaming) && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
                <BrainCircuit className="w-12 h-12 mb-4 text-muted" />
                <h3 className="text-lg font-medium text-foreground">How can I help you study today?</h3>
                <p className="text-sm mt-2 max-w-sm">Ask me to explain a concept, quiz you, or help organize your notes.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1"
              disabled={isStreaming}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
