import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Languages } from 'lucide-react';
import { Language } from '@/types';

interface LanguageSelectorProps {
  onLanguageSelect: (language: Language) => void;
}

export const LanguageSelector = ({ onLanguageSelect }: LanguageSelectorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    onLanguageSelect(language);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center mb-8">
        <Languages className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-3">भाषा चुनें / Choose Language</h2>
        <p className="text-lg text-muted-foreground">Select your preferred language</p>
      </div>
      
      <div className="space-y-4">
        <Button
          variant={selectedLanguage === 'hi' ? 'default' : 'outline'}
          className="w-full h-20 text-2xl font-semibold shadow-card hover:shadow-civic transition-shadow"
          onClick={() => handleLanguageSelect('hi')}
        >
          हिंदी (Hindi)
        </Button>
        <Button
          variant={selectedLanguage === 'en' ? 'default' : 'outline'}
          className="w-full h-20 text-2xl font-semibold shadow-card hover:shadow-civic transition-shadow"
          onClick={() => handleLanguageSelect('en')}
        >
          English
        </Button>
      </div>
    </div>
  );
};