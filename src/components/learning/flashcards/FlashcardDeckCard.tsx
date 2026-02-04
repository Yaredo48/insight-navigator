import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, Layers } from "lucide-react";
import type { FlashcardDeck } from "@/hooks/useFlashcards";

interface FlashcardDeckCardProps {
  deck: FlashcardDeck;
  onStudy: (deckId: string) => void;
  onDelete?: (deckId: string) => void;
  dueCount?: number;
}

export function FlashcardDeckCard({ deck, onStudy, onDelete, dueCount = 0 }: FlashcardDeckCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{deck.title}</CardTitle>
            {deck.topic && (
              <Badge variant="secondary" className="text-xs">
                {deck.topic}
              </Badge>
            )}
          </div>
          {dueCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {dueCount} due
            </Badge>
          )}
        </div>
        {deck.description && (
          <CardDescription className="line-clamp-2">
            {deck.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            <span>{deck.card_count || 0} cards</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={() => onStudy(deck.id)} className="gap-2">
          <Play className="w-4 h-4" />
          Study Now
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(deck.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
