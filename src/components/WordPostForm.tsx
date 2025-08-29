import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaImage, FaSmile, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";

interface WordPostFormProps {
  onSubmit?: (word: string, meaning: string, kana?: string, lemma?: string, inflection?: string) => void;
}

const WordPostForm: React.FC<WordPostFormProps> = ({
  onSubmit
}) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [kana, setKana] = useState('');
  const [lemma, setLemma] = useState('');
  const [inflection, setInflection] = useState('');

  const handleSubmit = () => {
    if (word.trim() && meaning.trim()) {
      onSubmit?.(word.trim(), meaning.trim(), kana.trim(), lemma.trim(), inflection.trim());
      setWord('');
      setMeaning('');
      setKana('');
      setLemma('');
      setInflection('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <Card className="border-0 rounded-none border-b">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* User avatar */}
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">U</span>
          </div>

          {/* Form content */}
          <div className="flex-1 space-y-3">
            {/* Word input */}
            <Input
              placeholder="单词 (必填)"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-lg font-medium"
            />

            {/* Meaning input */}
            <Input
              placeholder="含义 (必填)"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="假名 (可选)"
                value={kana}
                onChange={(e) => setKana(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-sm"
              />
              <Input
                placeholder="原型 (可选)"
                value={lemma}
                onChange={(e) => setLemma(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-sm"
              />
            </div>

            <Input
              placeholder="变形 (可选)"
              value={inflection}
              onChange={(e) => setInflection(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm"
            />

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <FaImage className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <FaSmile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <FaMapMarkerAlt className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!word.trim() || !meaning.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <FaPaperPlane className="w-4 h-4 mr-2" />
                发布
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordPostForm;