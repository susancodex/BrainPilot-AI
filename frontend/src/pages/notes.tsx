import { useState, useCallback, useEffect } from "react";
import { useNotes, useCreateNote, useDeleteNote, useSummarizeNote, useGenerateFlashcards, useUpdateNote } from "@/hooks/use-notes";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Note } from "@/types";
import {
  FileText, Plus, Search, Trash2, Wand2, Layers, Pin, PinOff,
  MoreHorizontal, Tag, ChevronRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Notes() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const summarizeNote = useSummarizeNote();
  const generateFlashcards = useGenerateFlashcards();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [fcCount, setFcCount] = useState([5]);
  const [fcDialogOpen, setFcDialogOpen] = useState(false);

  const debouncedContent = useDebounce(editContent, 600);
  const debouncedTitle = useDebounce(editTitle, 600);

  const notesList = (notes as Note[] | undefined) ?? [];
  const selectedNote = notesList.find((n) => n.id === selectedId);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content ?? "");
    }
  }, [selectedNote?.id]);

  useEffect(() => {
    if (!selectedId || !selectedNote) return;
    const hasChanges = debouncedTitle !== selectedNote.title || debouncedContent !== selectedNote.content;
    if (hasChanges) {
      updateNote.mutate({ id: selectedId, title: debouncedTitle, content: debouncedContent });
    }
  }, [debouncedContent, debouncedTitle]);

  const filteredNotes = notesList
    .filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.content ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

  const handleCreate = () => {
    createNote.mutate(
      { title: "Untitled Note", content: "" },
      {
        onSuccess: (data: Note) => {
          setSelectedId(data.id);
          setEditTitle(data.title);
          setEditContent(data.content ?? "");
        },
      }
    );
  };

  const handleSummarize = () => {
    if (!selectedId) return;
    summarizeNote.mutate(selectedId, {
      onSuccess: () => toast({ title: "Summary generated", description: "AI has summarized your note." }),
    });
  };

  const handleGenerateFlashcards = () => {
    if (!selectedId) return;
    generateFlashcards.mutate(
      { id: selectedId, count: fcCount[0] },
      {
        onSuccess: () => {
          toast({ title: "Flashcards generated", description: `${fcCount[0]} flashcards created.` });
          setFcDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = useCallback(
    (id: string) => {
      deleteNote.mutate(id);
      if (selectedId === id) {
        setSelectedId(null);
        setEditTitle("");
        setEditContent("");
      }
    },
    [selectedId, deleteNote]
  );

  const togglePin = (id: string, isPinned: boolean) => {
    updateNote.mutate({ id, is_pinned: !isPinned });
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r border-border shrink-0">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">Notes</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCreate} disabled={createNote.isPending}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : filteredNotes.length ? (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/60 transition-colors group",
                  selectedId === note.id && "bg-primary/10 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {note.is_pinned && <Pin className="w-2.5 h-2.5 text-primary fill-primary shrink-0" />}
                      <span className="font-medium text-sm text-foreground truncate">{note.title || "Untitled"}</span>
                    </div>
                    {note.subject && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                        {note.subject}
                      </span>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {(note.content ?? "").replace(/<[^>]*>/g, "").slice(0, 60) || "Empty note"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(note.id, note.is_pinned); }}>
                        {note.is_pinned ? <PinOff className="w-3.5 h-3.5 mr-2" /> : <Pin className="w-3.5 h-3.5 mr-2" />}
                        {note.is_pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(note.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  {note.flashcard_count > 0 && (
                    <span className="ml-2 text-amber-500">· {note.flashcard_count} cards</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mb-3 text-muted" />
              <p className="text-sm">No notes yet</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleCreate}>
                <Plus className="w-3 h-3 mr-1" /> Create one
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editor pane */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/20">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-semibold border-none bg-transparent px-0 shadow-none focus-visible:ring-0 h-auto text-foreground"
              placeholder="Note title..."
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={handleSummarize}
                disabled={summarizeNote.isPending}
              >
                <Wand2 className="w-3.5 h-3.5" />
                {summarizeNote.isPending ? "Summarizing..." : "Summarize"}
              </Button>
              <Dialog open={fcDialogOpen} onOpenChange={setFcDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                    <Layers className="w-3.5 h-3.5" /> Flashcards
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Generate Flashcards</DialogTitle></DialogHeader>
                  <div className="py-6 space-y-4">
                    <Label>Number of cards: {fcCount[0]}</Label>
                    <Slider min={1} max={20} step={1} value={fcCount} onValueChange={setFcCount} />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleGenerateFlashcards} disabled={generateFlashcards.isPending}>Generate</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* AI Summary */}
          {selectedNote.ai_summary && (
            <div className="mx-5 mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1">
                <Wand2 className="w-3 h-3" /> AI Summary
              </div>
              <p className="text-xs text-foreground">{selectedNote.ai_summary}</p>
            </div>
          )}

          {/* Tags */}
          {selectedNote.tags && selectedNote.tags.length > 0 && (
            <div className="flex items-center gap-2 px-5 pt-3">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {selectedNote.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
              ))}
            </div>
          )}

          {/* TipTap Editor */}
          <div className="flex-1 overflow-hidden px-5 pt-3 pb-4">
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Start writing your notes..."
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
          <FileText className="w-16 h-16 mb-4 text-muted" />
          <h3 className="text-lg font-medium text-foreground">No note selected</h3>
          <p className="text-sm mt-1">Pick a note from the list or create a new one</p>
          <Button className="mt-4 gap-2" onClick={handleCreate} disabled={createNote.isPending}>
            <Plus className="w-4 h-4" /> New Note
          </Button>
        </div>
      )}
    </div>
  );
}
