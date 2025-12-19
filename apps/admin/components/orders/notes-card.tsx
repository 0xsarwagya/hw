"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface NotesCardProps {
  notes?: string[];
  onAddNote?: (note: string) => void;
}

export function NotesCard({ notes = [], onAddNote }: NotesCardProps) {
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (newNote.trim() && onAddNote) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div
                key={`note-${index}-${note.slice(0, 10)}`}
                className="rounded-md border p-3 text-sm bg-muted/50"
              >
                {note}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet</p>
        )}
        {onAddNote && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddNote} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
