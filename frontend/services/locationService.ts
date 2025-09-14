// Sample location data - in production, this would come from an API
const locationData = {
  states: [
    {
      id: 'mh',
      name: 'Maharashtra',
      cities: [
        {
          id: 'mum',
          name: 'Mumbai',
          areas: ['Andheri', 'Bandra', 'Dadar', 'Juhu', 'Powai', 'Thane', 'Navi Mumbai']
        },
        {
          id: 'pnq',
          name: 'Pune',
          areas: ['Hinjewadi', 'Kothrud', 'Viman Nagar', 'Baner', 'Wakad']
        },
        {
          id: 'ngp',
          name: 'Nagpur',
          areas: ['Dharampeth', 'Manewada', 'Wardha Road', 'Hingna', 'Koradi']
        }
      ]
    },
    {
      id: 'dl',
      name: 'Delhi',
      cities: [
        {
          id: 'del',
          name: 'New Delhi',
          areas: ['Connaught Place', 'Karol Bagh', 'Rajouri Garden', 'Saket', 'Dwarka']
        },
        {
          id: 'gzb',
          name: 'Ghaziabad',
          areas: ['Vaishali', 'Indirapuram', 'Kaushambi', 'Raj Nagar']
        }
      ]
    },
    {
      id: 'ka',
      name: 'Karnataka',
      cities: [
        {
          id: 'blr',
          name: 'Bengaluru',
          areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'Marathahalli', 'Electronic City']
        },
        {
          id: 'mys',
          name: 'Mysuru',
          areas: ['Vijaynagar', 'Kuvempunagar', 'Mysore East', 'Bogadi']
        }
      ]
    }
  ]
};

type State = {
  id: string;
  name: string;
};

type City = {
  id: string;
  name: string;
  areas: string[];
};

class LocationService {
  // Get all states
  static getStates(): State[] {
    return locationData.states.map(({ id, name }) => ({ id, name }));
  }

  // Get cities for a state
  static getCities(stateId: string): City[] | null {
    const state = locationData.states.find(s => s.id === stateId);
    return state ? state.cities.map(({ id, name }) => ({ id, name, areas: [] })) : null;
  }

  // Get areas for a city
  static getAreas(stateId: string, cityId: string): string[] | null {
    const state = locationData.states.find(s => s.id === stateId);
    if (!state) return null;
    
    const city = state.cities.find(c => c.id === cityId);
    return city ? city.areas : null;
  }

  // Get full location details
  static getLocationDetails(stateId: string, cityId: string, area: string) {
    const state = locationData.states.find(s => s.id === stateId);
    if (!state) return null;
    
    const city = state.cities.find(c => c.id === cityId);
    if (!city) return null;
    
    return {
      state: state.name,
      city: city.name,
      area: area
    };
  }

  // Search locations by query
  static searchLocations(query: string) {
    const results: {
      type: 'state' | 'city' | 'area';
      id: string;
      name: string;
      path: string;
    }[] = [];

    const lowerQuery = query.toLowerCase();

    locationData.states.forEach(state => {
      // Check state name
      if (state.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'state',
          id: state.id,
          name: state.name,
          path: state.name
        });
      }

      // Check cities in state
      state.cities.forEach(city => {
        if (city.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'city',
            id: city.id,
            name: city.name,
            path: `${state.name} > ${city.name}`
          });
        }

        // Check areas in city
        city.areas.forEach(area => {
          if (area.toLowerCase().includes(lowerQuery)) {
            results.push({
              type: 'area',
              id: `${state.id}-${city.id}-${area.toLowerCase().replace(/\s+/g, '-')}`,
              name: area,
              path: `${state.name} > ${city.name} > ${area}`
            });
          }
        });
      });
    });

    return results;
  }
}

export default LocationService;
