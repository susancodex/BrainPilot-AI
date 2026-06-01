import { useState } from "react";
import { useNotes, useCreateNote, useDeleteNote, useSummarizeNote, useGenerateFlashcards, useUpdateNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Plus, Search, Trash2, Wand2, Layers, Pin, PinOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

export default function Notes() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const summarizeNote = useSummarizeNote();
  const generateFlashcards = useGenerateFlashcards();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [fcCount, setFcCount] = useState([5]);

  const filteredNotes = notes?.filter((note: any) => 
    note.title.toLowerCase().includes(search.toLowerCase()) || 
    note.content?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSummarize = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    summarizeNote.mutate(id, {
      onSuccess: () => toast({ title: "Summary generated", description: "AI has summarized your note." })
    });
  };

  const handleGenerateFlashcards = (id: string) => {
    generateFlashcards.mutate({ id, count: fcCount[0] }, {
      onSuccess: () => toast({ title: "Flashcards generated", description: `${fcCount[0]} flashcards added to your deck.` })
    });
  };

  const togglePin = (id: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote.mutate({ id, is_pinned: !isPinned });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">Capture and organize your learning.</p>
        </div>
        <Button className="gap-2" onClick={() => createNote.mutate({ title: "New Note", content: "" })}>
          <Plus className="w-4 h-4" />
          Create Note
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search notes..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading notes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes?.length ? (
            filteredNotes.sort((a: any, b: any) => Number(b.is_pinned) - Number(a.is_pinned)).map((note: any) => (
              <Card key={note.id} className="border-border flex flex-col group cursor-pointer hover:border-primary/50 transition-colors relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1 pr-8">{note.title || "Untitled Note"}</CardTitle>
                    <div className="absolute right-2 top-2 flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={(e) => togglePin(note.id, note.is_pinned, e)}
                      >
                        {note.is_pinned ? <Pin className="w-4 h-4 text-primary fill-primary" /> : <PinOff className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote.mutate(note.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {note.subject && (
                    <div className="text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                      {note.subject}
                    </div>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {note.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">#{tag}</span>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground space-y-4">
                  <p className="line-clamp-3">{note.content || "Empty note."}</p>
                  
                  {note.ai_summary && (
                    <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg">
                      <div className="text-xs font-semibold text-accent flex items-center gap-1 mb-1">
                        <Wand2 className="w-3 h-3" /> AI Summary
                      </div>
                      <p className="text-xs text-foreground line-clamp-2">{note.ai_summary}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex flex-col items-start gap-3 border-t border-border mt-auto">
                  <div className="flex justify-between w-full">
                    <div className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                    {note.flashcard_count > 0 && (
                      <div className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Layers className="w-3 h-3" /> {note.flashcard_count}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={(e) => handleSummarize(note.id, e)}>
                      <Wand2 className="w-3 h-3 mr-1" /> Summarize
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={(e) => e.stopPropagation()}>
                          <Layers className="w-3 h-3 mr-1" /> Flashcards
                        </Button>
                      </DialogTrigger>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Generate Flashcards</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                          <Label>Number of cards: {fcCount[0]}</Label>
                          <Slider min={1} max={20} step={1} value={fcCount} onValueChange={setFcCount} />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleGenerateFlashcards(note.id)}>Generate</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-12 border border-dashed rounded-xl text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted" />
              <p>No notes found. Create your first one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
