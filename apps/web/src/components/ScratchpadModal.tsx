import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Calendar, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface LocalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ScratchpadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScratchpadModal({ open, onOpenChange }: ScratchpadModalProps) {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Load notes on open
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("career-os-scratchpad-notes");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as LocalNote[];
          setNotes(parsed);
          if (parsed.length > 0) {
            // Select first note by default if none selected or if selected note is missing
            const activeExists = parsed.find(n => n.id === activeNoteId);
            if (!activeExists) {
              setActiveNoteId(parsed[0].id);
              setTitle(parsed[0].title);
              setContent(parsed[0].content);
            }
          } else {
            setActiveNoteId(null);
            setTitle("");
            setContent("");
          }
        } catch (e) {
          console.error("Failed to parse local notes", e);
        }
      } else {
        setNotes([]);
        setActiveNoteId(null);
        setTitle("");
        setContent("");
      }
    }
  }, [open]);

  // Sync active note form state
  const handleSelectNote = (note: LocalNote) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  // Add new note
  const handleCreateNote = () => {
    const newNote: LocalNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem("career-os-scratchpad-notes", JSON.stringify(updated));
    handleSelectNote(newNote);
  };

  // Update notes on title/content change
  const handleSaveNote = (updatedTitle: string, updatedContent: string) => {
    if (!activeNoteId) return;

    const updated = notes.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: updatedTitle,
          content: updatedContent,
          createdAt: new Date().toISOString(), // update modification time
        };
      }
      return n;
    });

    setNotes(updated);
    localStorage.setItem("career-os-scratchpad-notes", JSON.stringify(updated));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    handleSaveNote(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    handleSaveNote(title, val);
  };

  // Delete note
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem("career-os-scratchpad-notes", JSON.stringify(updated));

    if (activeNoteId === id) {
      if (updated.length > 0) {
        handleSelectNote(updated[0]);
      } else {
        setActiveNoteId(null);
        setTitle("");
        setContent("");
      }
    }
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] bg-bg-card border-border text-text-main p-0 overflow-hidden rounded-xl shadow-2xl h-[80vh] flex flex-col">
        <DialogHeader className="p-5 border-b border-border bg-bg-elevated/35 shrink-0">
          <DialogTitle className="text-base font-semibold">Scratchpad / Quick Notes</DialogTitle>
          <DialogDescription className="text-[10px] text-text-dim uppercase tracking-wider">
            Draft logs, thoughts, checklists, or preparation answers. Saved locally on this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Notes Sidebar List */}
          <div className="w-1/3 border-r border-border flex flex-col bg-bg-main/20 shrink-0">
            <div className="p-3 border-b border-border flex justify-between items-center bg-bg-card/45 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">My Notes ({notes.length})</span>
              <Button
                onClick={handleCreateNote}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] font-semibold text-primary hover:bg-primary/10 hover:text-primary-hover rounded"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New Note
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {notes.map(note => {
                const isActive = note.id === activeNoteId;
                const formattedDate = format(new Date(note.createdAt), "MMM dd, HH:mm");
                const preview = note.content.slice(0, 45) || "Empty note draft...";

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all group flex flex-col gap-1.5 ${
                      isActive
                        ? "bg-bg-elevated border-primary/25 text-text-main"
                        : "border-transparent bg-transparent text-text-muted hover:bg-bg-elevated/20 hover:text-text-main"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <span className="text-xs font-semibold truncate leading-none flex-1 group-hover:text-primary transition-colors">
                        {note.title || "Untitled Note"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="h-5 w-5 rounded text-text-dim hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-text-dim line-clamp-1 leading-normal">{preview}</p>
                    <span className="text-[9px] text-text-dim/60 font-semibold tabular-nums mt-0.5">{formattedDate}</span>
                  </div>
                );
              })}

              {notes.length === 0 && (
                <div className="py-12 text-center flex flex-col items-center justify-center p-4">
                  <FileText className="w-8 h-8 text-text-dim/40 mb-2.5" />
                  <p className="text-[11px] font-semibold text-text-muted">No notes recorded</p>
                  <p className="text-[10px] text-text-dim mt-0.5">Click "New Note" to create one.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Note Content Editor */}
          <div className="flex-1 flex flex-col bg-bg-card p-5 overflow-hidden">
            {activeNoteId ? (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="shrink-0">
                  <Input
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter note title..."
                    className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm font-bold text-text-main placeholder:text-text-dim/55 h-8 border-b border-border/40 focus:border-border"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <Textarea
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Start writing notes, clipboard drafts, checklist items..."
                    className="w-full h-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-xs font-medium leading-relaxed resize-none text-text-main placeholder:text-text-dim/55 focus:outline-none overflow-y-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-text-dim" />
                </div>
                <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">No Active Note</h4>
                <p className="text-[11px] text-text-dim max-w-xs leading-relaxed mt-1">
                  Select an existing note from the sidebar list or create a new scratchpad draft to get started.
                </p>
                <Button
                  onClick={handleCreateNote}
                  className="mt-4 bg-primary/10 border border-primary/20 hover:bg-primary/15 text-primary text-[11px] font-semibold h-8 rounded-lg cursor-pointer"
                >
                  Create New Note
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
