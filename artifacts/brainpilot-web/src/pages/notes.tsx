import { useState } from "react";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Notes() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [search, setSearch] = useState("");

  const filteredNotes = notes?.filter((note: any) => 
    note.title.toLowerCase().includes(search.toLowerCase()) || 
    note.content?.toLowerCase().includes(search.toLowerCase())
  );

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
            filteredNotes.map((note: any) => (
              <Card key={note.id} className="border-border flex flex-col group cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{note.title || "Untitled Note"}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote.mutate(note.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {note.subject && (
                    <div className="text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                      {note.subject}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground">
                  <p className="line-clamp-3">{note.content || "Empty note."}</p>
                </CardContent>
                <CardFooter className="pt-0 text-xs text-muted-foreground">
                  Last updated {new Date(note.updated_at).toLocaleDateString()}
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
