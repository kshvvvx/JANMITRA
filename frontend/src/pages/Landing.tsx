import { useState } from 'react';
import { LanguageSelector } from '@/components/ui/language-selector';
import { RoleSelector } from '@/components/ui/role-selector';
import { Language, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import janmitraLogo from '@/assets/janmitra-logo-new.png';
import civicHero from '@/assets/civic-hero.jpg';

export const Landing = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const navigate = useNavigate();

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleRoleSelect = (role: UserRole) => {
    // Store language and role in localStorage for the session
    localStorage.setItem('janmitra-language', selectedLanguage || 'en');
    localStorage.setItem('janmitra-role', role);
    
    // Navigate based on role
    switch (role) {
      case 'citizen':
        navigate('/citizen/login');
        break;
      case 'guest':
        navigate('/guest/complaint-flow');
        break;
      case 'adhikaari':
        navigate('/adhikaari/login');
        break;
      case 'supervisor':
        navigate('/supervisor/login');
        break;
      default:
        navigate('/citizen/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={civicHero} 
            alt="Civic participation hero" 
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        
        <div className="relative container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={janmitraLogo} 
                alt="JANMITRA Logo" 
                className="h-16 w-16 mr-4"
              />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                JANMITRA
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              जनमित्र - Your Digital Partner for Civic Issues
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Report, Track, and Resolve Community Issues with Transparency
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {!selectedLanguage ? (
              <div className="animate-fade-in">
                <LanguageSelector onLanguageSelect={handleLanguageSelect} />
              </div>
            ) : (
              <div className="animate-fade-in">
                <RoleSelector 
                  onRoleSelect={handleRoleSelect} 
                  language={selectedLanguage} 
                />
              </div>
            )}
          </div>

          {/* Features Preview */}
          <div className="mt-16 text-center">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary text-2xl">📱</span>
                </div>
                <h3 className="font-semibold mb-2">Easy Reporting</h3>
                <p className="text-sm text-muted-foreground">
                  Report civic issues with photos, location, and voice notes
                </p>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-secondary text-2xl">🔍</span>
                </div>
                <h3 className="font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track complaint status and resolution progress
                </p>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-success text-2xl">🤝</span>
                </div>
                <h3 className="font-semibold mb-2">Community Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Upvote issues and see what matters to your community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};