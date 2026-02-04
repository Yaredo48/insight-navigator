import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, ArrowLeftRight } from "lucide-react";
import type { Grade, Subject } from "@/types/education";

interface CardData {
  id: string;
  front_text: string;
  back_text: string;
}

interface FlashcardDeckCreatorProps {
  grades: Grade[];
  subjects: Subject[];
  onSave: (deck: {
    title: string;
    description?: string;
    grade_id?: number;
    subject_id?: number;
    topic?: string;
  }, cards: Omit<CardData, 'id'>[]) => Promise<void>;
  onCancel: () => void;
}

export function FlashcardDeckCreator({ grades, subjects, onSave, onCancel }: FlashcardDeckCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradeId, setGradeId] = useState<number | undefined>();
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<CardData[]>([
    { id: '1', front_text: '', back_text: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addCard = () => {
    setCards(prev => [...prev, { 
      id: crypto.randomUUID(), 
      front_text: '', 
      back_text: '' 
    }]);
  };

  const updateCard = (id: string, field: 'front_text' | 'back_text', value: string) => {
    setCards(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  const swapCard = (id: string) => {
    setCards(prev => prev.map(c => 
      c.id === id ? { ...c, front_text: c.back_text, back_text: c.front_text } : c
    ));
  };

  const handleSave = async () => {
    if (!title || cards.length === 0) return;
    
    const validCards = cards.filter(c => c.front_text.trim() && c.back_text.trim());
    if (validCards.length === 0) return;

    setIsSaving(true);
    try {
      await onSave({
        title,
        description: description || undefined,
        grade_id: gradeId,
        subject_id: subjectId,
        topic: topic || undefined
      }, validCards.map(c => ({ front_text: c.front_text, back_text: c.back_text })));
    } finally {
      setIsSaving(false);
    }
  };

  const validCardCount = cards.filter(c => c.front_text.trim() && c.back_text.trim()).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create Flashcard Deck</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title || validCardCount === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : `Save Deck (${validCardCount} cards)`}
          </Button>
        </div>
      </div>

      {/* Deck Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Deck Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Deck Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Biology Chapter 5 Vocabulary"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this deck cover?"
                rows={2}
              />
            </div>
            <div>
              <Label>Grade</Label>
              <Select
                value={gradeId?.toString()}
                onValueChange={(val) => setGradeId(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select
                value={subjectId?.toString()}
                onValueChange={(val) => setSubjectId(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Cell Structure"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Flashcards</h3>
          <Button onClick={addCard} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>

        {cards.map((card, index) => (
          <Card key={card.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <span className="text-sm font-medium text-muted-foreground pt-2">
                  {index + 1}
                </span>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Front (Question/Term)</Label>
                    <Textarea
                      value={card.front_text}
                      onChange={(e) => updateCard(card.id, 'front_text', e.target.value)}
                      placeholder="Enter the question or term..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Back (Answer/Definition)</Label>
                    <Textarea
                      value={card.back_text}
                      onChange={(e) => updateCard(card.id, 'back_text', e.target.value)}
                      placeholder="Enter the answer or definition..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => swapCard(card.id)}
                    title="Swap front and back"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCard(card.id)}
                    disabled={cards.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addCard} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Another Card
        </Button>
      </div>
    </div>
  );
}
