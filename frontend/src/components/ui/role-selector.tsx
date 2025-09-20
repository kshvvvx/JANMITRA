import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Shield, Eye, UserCheck } from 'lucide-react';
import { UserRole } from '@/types';
import janmitraLogo from '@/assets/janmitra-logo-updated.png';

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
  language: 'en' | 'hi';
}

export const RoleSelector = ({ onRoleSelect, language }: RoleSelectorProps) => {
  const content = {
    en: {
      title: 'Select Your Role',
      subtitle: 'Choose how you want to access JANMITRA',
      citizen: 'Citizen',
      guest: 'Guest Reporter',
      adhikaari: 'Nagar Nigam Adhikaari',
      supervisor: 'Supervisor'
    },
    hi: {
      title: 'अपनी भूमिका चुनें',
      subtitle: 'चुनें कि आप JANMITRA तक कैसे पहुंचना चाहते हैं',
      citizen: 'नागरिक',
      guest: 'अतिथि रिपोर्टर',
      adhikaari: 'नगर निगम अधिकारी',
      supervisor: 'पर्यवेक्षक'
    }
  };

  const t = content[language];

  const roles = [
    {
      role: 'citizen' as UserRole,
      icon: Users,
      title: t.citizen,
      variant: 'default' as const
    },
    {
      role: 'guest' as UserRole,
      icon: UserCheck,
      title: t.guest,
      variant: 'secondary' as const
    },
    {
      role: 'adhikaari' as UserRole,
      icon: Shield,
      title: t.adhikaari,
      variant: 'outline' as const
    },
    {
      role: 'supervisor' as UserRole,
      icon: Eye,
      title: t.supervisor,
      variant: 'outline' as const
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <img src={janmitraLogo} alt="JANMITRA" className="h-20 w-20 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-foreground mb-4">{t.title}</h2>
        <p className="text-xl text-muted-foreground">{t.subtitle}</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
        {roles.map(({ role, icon: Icon, title }) => (
          <Card
            key={role}
            className="group cursor-pointer hover:shadow-civic transition-all duration-300 hover:scale-105 border-border/50 w-full max-w-sm"
            onClick={() => onRoleSelect(role)}
          >
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-2xl flex items-center justify-center group-hover:from-orange-400/30 group-hover:to-orange-600/30 transition-colors">
                <Icon className="h-10 w-10 text-orange-600" />
              </div>
              <div className="font-bold text-xl text-foreground">{title}</div>
              <Button 
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onRoleSelect(role);
                }}
              >
                Continue
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};