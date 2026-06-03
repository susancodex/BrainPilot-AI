import { useState, useRef, useEffect } from "react";
import {
  usePDFs, useUploadPDF, useDeletePDF,
  usePDFChat, useSendPDFMessage, usePDFHighlights,
} from "@/hooks/use-pdfs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PDFDocument, PDFChatMessage } from "@/types";
import {
  FileText, Upload, Trash2, MessageSquare, ArrowLeft,
  Send, Loader2, BookOpen, HighlighterIcon, File,
  CheckCircle2, Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function PDFCard({
  doc,
  onChat,
  onDelete,
}: {
  doc: PDFDocument;
  onChat: (doc: PDFDocument) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="group hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">{doc.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {doc.is_processed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500 animate-spin" />
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {doc.subject && (
                <Badge variant="secondary" className="text-xs">{doc.subject}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {doc.page_count > 0 ? `${doc.page_count} pages` : "Processing..."}
              </span>
              <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => onChat(doc)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat with PDF
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(doc.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChatMessage({ msg }: { msg: PDFChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function PDFChatPanel({ doc, onBack }: { doc: PDFDocument; onBack: () => void }) {
  const { data: messages = [], isLoading } = usePDFChat(doc.id);
  const sendMessage = useSendPDFMessage(doc.id);
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sendMessage.isPending) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sendMessage.isPending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;
    setInput("");
    try {
      await sendMessage.mutateAsync(text);
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground line-clamp-1">{doc.title}</h2>
          <p className="text-xs text-muted-foreground">
            {doc.page_count} pages · {formatBytes(doc.file_size)}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4" ref={scrollRef as any}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Chat with your PDF</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask questions about the document, request summaries, or get explanations of key concepts.
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
            {sendMessage.isPending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this document..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PDFs() {
  const { data: docs, isLoading } = usePDFs();
  const uploadPDF = useUploadPDF();
  const deletePDF = useDeletePDF();
  const { toast } = useToast();

  const [activeDoc, setActiveDoc] = useState<PDFDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.pdf$/i, ""));
    try {
      await uploadPDF.mutateAsync(formData);
      toast({ title: "PDF uploaded", description: "Your document has been processed." });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    try {
      await deletePDF.mutateAsync(id);
      if (activeDoc?.id === id) setActiveDoc(null);
      toast({ title: "PDF deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  const docList = Array.isArray(docs) ? docs : [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar — PDF list */}
      <div className={cn(
        "border-r border-border flex flex-col transition-all",
        activeDoc ? "w-80 shrink-0" : "flex-1"
      )}>
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <File className="h-5 w-5 text-red-500" />
                PDF Library
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {docList.length} document{docList.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPDF.isPending}
              className="gap-1.5"
              size="sm"
            >
              {uploadPDF.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload PDF
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* PDF grid / list */}
        <ScrollArea className="flex-1">
          <div className="p-5">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : docList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div
                  className="p-6 rounded-3xl bg-muted mb-4 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No PDFs yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Upload PDF documents and chat with them using AI to extract insights and answer questions.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload your first PDF
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {docList.map((doc) => (
                  <PDFCard
                    key={doc.id}
                    doc={doc}
                    onChat={setActiveDoc}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat panel */}
      {activeDoc && (
        <div className="flex-1 flex flex-col p-5">
          <PDFChatPanel doc={activeDoc} onBack={() => setActiveDoc(null)} />
        </div>
      )}
    </div>
  );
}
