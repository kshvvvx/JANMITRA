import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Button } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [visible, setVisible] = React.useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button 
            mode="outlined" 
            onPress={() => setVisible(true)}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {currentLanguage.name}
          </Button>
        }
      >
        {languages.map(lang => (
          <Menu.Item
            key={lang.code}
            onPress={() => changeLanguage(lang.code)}
            title={lang.name}
            style={styles.menuItem}
            titleStyle={[
              styles.menuItemText,
              i18n.language === lang.code && styles.selectedLanguage
            ]}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    zIndex: 1000,
  },
  button: {
    borderColor: '#6200ee',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItemText: {
    fontSize: 16,
  },
  selectedLanguage: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
});

export default LanguageSelector;
