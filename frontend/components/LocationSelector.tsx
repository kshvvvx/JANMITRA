import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Menu, Divider, Searchbar } from 'react-native-paper';
import LocationService from '../services/locationService';

interface LocationSelectorProps {
  onLocationSelect: (location: {
    state: string;
    city: string;
    area: string;
    stateId: string;
    cityId: string;
  }) => void;
  initialLocation?: {
    stateId?: string;
    cityId?: string;
    area?: string;
  };
  showSearch?: boolean;
  style?: object;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  initialLocation = {},
  showSearch = false,
  style = {},
}) => {
  const [selectedState, setSelectedState] = useState<{ id: string; name: string } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{
    type: 'state' | 'city' | 'area';
    id: string;
    name: string;
    path: string;
  }[]>([]);
  const [menuVisible, setMenuVisible] = useState<{
    state: boolean;
    city: boolean;
    area: boolean;
    search: boolean;
  }>({ state: false, city: false, area: false, search: false });
  const [states, setStates] = useState<Array<{ id: string; name: string }>>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

  // Load states on component mount
  useEffect(() => {
    const loadStates = () => {
      const allStates = LocationService.getStates();
      setStates(allStates);
      
      // If initial location is provided, set the corresponding state, city, and area
      if (initialLocation.stateId) {
        const state = allStates.find(s => s.id === initialLocation.stateId);
        if (state) {
          setSelectedState(state);
          
          const stateCities = LocationService.getCities(state.id);
          if (stateCities) {
            setCities(stateCities);
            
            if (initialLocation.cityId) {
              const city = stateCities.find(c => c.id === initialLocation.cityId);
              if (city) {
                setSelectedCity(city);
                
                const cityAreas = LocationService.getAreas(state.id, city.id);
                if (cityAreas) {
                  setAreas(cityAreas);
                  
                  if (initialLocation.area) {
                    setSelectedArea(initialLocation.area);
                  }
                }
              }
            }
          }
        }
      }
    };
    
    loadStates();
  }, [initialLocation]);

  // Handle state selection
  const handleStateSelect = (state: { id: string; name: string }) => {
    setSelectedState(state);
    setSelectedCity(null);
    setSelectedArea('');
    setAreas([]);
    
    const stateCities = LocationService.getCities(state.id);
    if (stateCities) {
      setCities(stateCities);
    }
    
    setMenuVisible({ ...menuVisible, state: false });
    onLocationSelect({
      state: state.name,
      city: '',
      area: '',
      stateId: state.id,
      cityId: '',
    });
  };

  // Handle city selection
  const handleCitySelect = (city: { id: string; name: string }) => {
    setSelectedCity(city);
    setSelectedArea('');
    
    if (selectedState) {
      const cityAreas = LocationService.getAreas(selectedState.id, city.id);
      if (cityAreas) {
        setAreas(cityAreas);
      }
    }
    
    setMenuVisible({ ...menuVisible, city: false });
    onLocationSelect({
      state: selectedState?.name || '',
      city: city.name,
      area: '',
      stateId: selectedState?.id || '',
      cityId: city.id,
    });
  };

  // Handle area selection
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setMenuVisible({ ...menuVisible, area: false });
    
    onLocationSelect({
      state: selectedState?.name || '',
      city: selectedCity?.name || '',
      area,
      stateId: selectedState?.id || '',
      cityId: selectedCity?.id || '',
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 1) {
      const results = LocationService.searchLocations(query);
      setSearchResults(results);
      setMenuVisible({ ...menuVisible, search: true });
    } else {
      setSearchResults([]);
      setMenuVisible({ ...menuVisible, search: false });
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: {
    type: 'state' | 'city' | 'area';
    id: string;
    name: string;
  }) => {
    if (result.type === 'state') {
      const state = states.find(s => s.id === result.id);
      if (state) {
        handleStateSelect(state);
      }
    } else if (result.type === 'city') {
      const city = cities.find(c => c.id === result.id);
      if (city) {
        handleCitySelect(city);
      }
    } else if (result.type === 'area') {
      handleAreaSelect(result.name);
    }
    
    setSearchQuery('');
    setSearchResults([]);
    setMenuVisible({ ...menuVisible, search: false });
  };

  return (
    <View style={[styles.container, style]}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search for state, city, or area..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            onFocus={() => setMenuVisible({ ...menuVisible, search: true })}
          />
          {menuVisible.search && searchResults.length > 0 && (
            <View style={styles.menu}>
              {searchResults.map((result) => (
                <React.Fragment key={result.id}>
                  <Menu.Item
                    onPress={() => handleSearchResultSelect(result)}
                    title={result.name}
                    titleStyle={styles.menuItemTitle}
                  />
                  <Divider />
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.selectorContainer}>
        <View style={styles.selector}>
          <Menu
            visible={menuVisible.state}
            onDismiss={() => setMenuVisible({ ...menuVisible, state: false })}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible({ ...menuVisible, state: true })}
                style={styles.selectorButton}
                contentStyle={styles.selectorButtonContent}
              >
                {selectedState ? selectedState.name : 'Select State'}
              </Button>
            }
            style={styles.menu}
          >
            {states.map((state) => (
              <React.Fragment key={state.id}>
                <Menu.Item
                  onPress={() => handleStateSelect(state)}
                  title={state.name}
                  titleStyle={styles.menuItemTitle}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Menu>
        </View>

        <View style={styles.selector}>
          <Menu
            visible={menuVisible.city}
            onDismiss={() => setMenuVisible({ ...menuVisible, city: false })}
            anchor={
              <Button
                mode="outlined"
                onPress={() => {
                  if (!selectedState) {
                    // Show error or alert to select state first
                    return;
                  }
                  setMenuVisible({ ...menuVisible, city: true });
                }}
                disabled={!selectedState}
                style={[
                  styles.selectorButton,
                  !selectedState && styles.disabledButton,
                ]}
                contentStyle={styles.selectorButtonContent}
              >
                {selectedCity ? selectedCity.name : 'Select City'}
              </Button>
            }
            style={styles.menu}
          >
            {cities.map((city) => (
              <React.Fragment key={city.id}>
                <Menu.Item
                  onPress={() => handleCitySelect(city)}
                  title={city.name}
                  titleStyle={styles.menuItemTitle}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Menu>
        </View>

        <View style={styles.selector}>
          <Menu
            visible={menuVisible.area}
            onDismiss={() => setMenuVisible({ ...menuVisible, area: false })}
            anchor={
              <Button
                mode="outlined"
                onPress={() => {
                  if (!selectedCity) {
                    // Show error or alert to select city first
                    return;
                  }
                  setMenuVisible({ ...menuVisible, area: true });
                }}
                disabled={!selectedCity}
                style={[
                  styles.selectorButton,
                  !selectedCity && styles.disabledButton,
                ]}
                contentStyle={styles.selectorButtonContent}
              >
                {selectedArea || 'Select Area'}
              </Button>
            }
            style={styles.menu}
          >
            {areas.map((area, index) => (
              <React.Fragment key={index}>
                <Menu.Item
                  onPress={() => handleAreaSelect(area)}
                  title={area}
                  titleStyle={styles.menuItemTitle}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Menu>
        </View>
      </View>

      {selectedState && selectedCity && selectedArea && (
        <View style={styles.selectedLocationContainer}>
          <Text style={styles.selectedLocationText}>
            Selected: {selectedState.name} &gt; {selectedCity.name} &gt; {selectedArea}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 2,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selector: {
    width: '32%',
    marginBottom: 8,
  },
  selectorButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorButtonContent: {
    height: '100%',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  menu: {
    marginTop: 40,
    width: '100%',
    maxHeight: 300,
  },
  menuItemTitle: {
    fontSize: 14,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  selectedLocationContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#333',
  },
});

export default LocationSelector;
