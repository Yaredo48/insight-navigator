import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  className?: string;
  readOnly?: boolean;
}

// Predefined tag categories for educational content
const DEFAULT_SUGGESTIONS = [
  'Important',
  'Exam Topic',
  'Practice Required',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Lab Work',
  'Theory',
  'Formula',
  'Definition',
  'Example',
  'Exercise',
  'Review',
  'Homework',
];

export function TagManager({ 
  tags, 
  onChange, 
  suggestions = DEFAULT_SUGGESTIONS,
  maxTags = 10,
  className,
  readOnly = false
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (
      normalizedTag && 
      !tags.includes(normalizedTag) && 
      tags.length < maxTags
    ) {
      onChange([...tags, normalizedTag]);
      setInputValue('');
    }
  }, [tags, onChange, maxTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  }, [tags, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => 
      s.toLowerCase().includes(inputValue.toLowerCase()) && 
      !tags.includes(s.toLowerCase())
  );

  // Color mapping for tags
  const getTagColor = (tag: string): string => {
    const colors = [
      'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'bg-green-500/10 text-green-500 border-green-500/20',
      'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'bg-pink-500/10 text-pink-500 border-pink-500/20',
      'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'bg-red-500/10 text-red-500 border-red-500/20',
    ];
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (readOnly) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {tags.length === 0 ? (
          <span className="text-sm text-muted-foreground">No tags</span>
        ) : (
          tags.map(tag => (
            <Badge key={tag} variant="outline" className={cn('capitalize', getTagColor(tag))}>
              {tag}
            </Badge>
          ))
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tag Input */}
      <div className="relative">
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-background min-h-[44px] flex-wrap">
          <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
          
          <AnimatePresence>
            {tags.map(tag => (
              <motion.div
                key={tag}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Badge 
                  variant="outline" 
                  className={cn('capitalize gap-1 pr-1', getTagColor(tag))}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>

          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length < maxTags ? 'Add tag...' : 'Max tags reached'}
            disabled={tags.length >= maxTags}
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[100px] h-8 px-0"
          />

          {inputValue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addTag(inputValue)}
              className="h-7 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 p-2 border rounded-lg bg-popover shadow-lg z-50 max-h-48 overflow-auto"
            >
              <div className="flex flex-wrap gap-1">
                {filteredSuggestions.map(suggestion => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent capitalize"
                    onClick={() => addTag(suggestion)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tag Count */}
      <p className="text-xs text-muted-foreground">
        {tags.length} / {maxTags} tags
      </p>
    </div>
  );
}
