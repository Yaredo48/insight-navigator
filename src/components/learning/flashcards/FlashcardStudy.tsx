import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, ThumbsDown, ThumbsUp, Brain, Zap, Check } from "lucide-react";
import type { Flashcard, FlashcardDeck } from "@/hooks/useFlashcards";
import { cn } from "@/lib/utils";

interface FlashcardStudyProps {
  deck: FlashcardDeck;
  cards: Flashcard[];
  onReview: (cardId: string, quality: number) => Promise<void>;
  onClose: () => void;
}

export function FlashcardStudy({ deck, cards, onReview, onClose }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (quality: number) => {
    if (!currentCard) return;

    await onReview(currentCard.id, quality);
    setReviewedCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const ratingButtons = [
    { quality: 0, label: 'Again', icon: RotateCcw, color: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950', desc: "Didn't remember" },
    { quality: 3, label: 'Hard', icon: ThumbsDown, color: 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950', desc: 'Took effort' },
    { quality: 4, label: 'Good', icon: ThumbsUp, color: 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950', desc: 'Remembered well' },
    { quality: 5, label: 'Easy', icon: Zap, color: 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950', desc: 'Too easy!' },
  ];

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Cards to Study</h2>
        <p className="text-muted-foreground mb-6">This deck doesn't have any cards yet.</p>
        <Button onClick={onClose}>Go Back</Button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Session Complete! 🎉</h2>
        <p className="text-muted-foreground mb-6">
          You reviewed {reviewedCount} cards. Great job!
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onClose}>
            Back to Decks
          </Button>
          <Button onClick={() => {
            setCurrentIndex(0);
            setReviewedCount(0);
            setSessionComplete(false);
            setIsFlipped(false);
          }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Study Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
        <div className="text-center">
          <h2 className="font-semibold">{deck.title}</h2>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
        <div className="w-20" />
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      <div 
        className="perspective-1000 cursor-pointer min-h-[300px]"
        onClick={handleFlip}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard?.id}-${isFlipped}`}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn(
              "min-h-[300px] flex items-center justify-center",
              isFlipped && "bg-primary/5 border-primary"
            )}>
              <CardContent className="p-8 text-center">
                {!isFlipped ? (
                  <>
                    {currentCard?.front_image_url && (
                      <img 
                        src={currentCard.front_image_url} 
                        alt="Front" 
                        className="max-h-40 mx-auto mb-4 rounded-lg"
                      />
                    )}
                    <p className="text-2xl font-medium">{currentCard?.front_text}</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      Click to reveal answer
                    </p>
                  </>
                ) : (
                  <>
                    {currentCard?.back_image_url && (
                      <img 
                        src={currentCard.back_image_url} 
                        alt="Back" 
                        className="max-h-40 mx-auto mb-4 rounded-lg"
                      />
                    )}
                    <p className="text-2xl font-medium text-primary">{currentCard?.back_text}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating buttons - only show when flipped */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-center text-sm text-muted-foreground">
            How well did you remember this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ratingButtons.map(({ quality, label, icon: Icon, color, desc }) => (
              <Button
                key={quality}
                variant="outline"
                className={cn("flex-col h-auto py-4 gap-2", color)}
                onClick={() => handleRate(quality)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
                <span className="text-xs opacity-70">{desc}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Keyboard hints */}
      <p className="text-center text-xs text-muted-foreground">
        Press Space to flip • 1-4 to rate
      </p>
    </div>
  );
}
