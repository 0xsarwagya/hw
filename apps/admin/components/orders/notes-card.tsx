"use client";

import { MessageSquare, Plus, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminOrderNotes,
  useCreateOrderNote,
} from "@/hooks/orders/use-admin-order-notes";
import { DateTime } from "./date-time";

interface NotesCardProps {
  orderId: string;
}

export function NotesCard({ orderId }: NotesCardProps) {
  const [newNote, setNewNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const { data: notes, isLoading } = useAdminOrderNotes(orderId);
  const createNote = useCreateOrderNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote.mutateAsync({
        orderId,
        note: newNote.trim(),
        isPublic,
      });
      setNewNote("");
      setIsPublic(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const adminNotes = notes?.filter((n) => !n.isPublic) || [];
  const publicNotes = notes?.filter((n) => n.isPublic) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : (
          <>
            {adminNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Admin Notes (Private)</p>
                {adminNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md border p-3 text-sm bg-muted/50"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {note.authorName || note.authorEmail || "Admin"}
                        </span>
                      </div>
                      <DateTime date={note.createdAt} format="short" />
                    </div>
                    <p className="text-sm">{note.note}</p>
                  </div>
                ))}
              </div>
            )}

            {publicNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Customer-Facing Notes</p>
                {publicNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md border p-3 text-sm bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {note.authorName || note.authorEmail || "Admin"}
                        </span>
                      </div>
                      <DateTime date={note.createdAt} format="short" />
                    </div>
                    <p className="text-sm">{note.note}</p>
                  </div>
                ))}
              </div>
            )}

            {notes && notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            )}
          </>
        )}

        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label
              htmlFor="is-public"
              className="text-sm font-normal cursor-pointer"
            >
              Customer-visible note
            </Label>
          </div>
          <Button
            onClick={handleAddNote}
            size="sm"
            disabled={!newNote.trim() || createNote.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createNote.isPending ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
