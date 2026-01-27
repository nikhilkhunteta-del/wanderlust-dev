export const CITIES = [
  // North America
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Seattle', 'Denver', 'Boston', 
  'Washington D.C.', 'Nashville', 'Detroit', 'Portland', 'Las Vegas', 'Miami', 'Atlanta', 'Minneapolis',
  'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Quebec City',
  'Mexico City', 'Guadalajara', 'Monterrey', 'Cancun', 'Tijuana',
  
  // Europe
  'London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Vienna', 'Amsterdam', 'Barcelona', 'Munich', 
  'Milan', 'Prague', 'Budapest', 'Warsaw', 'Dublin', 'Brussels', 'Lisbon', 'Copenhagen', 'Stockholm',
  'Oslo', 'Helsinki', 'Athens', 'Zurich', 'Geneva', 'Edinburgh', 'Manchester', 'Liverpool',
  'Florence', 'Venice', 'Naples', 'Seville', 'Valencia', 'Porto', 'Lyon', 'Marseille', 'Nice',
  'Hamburg', 'Frankfurt', 'Cologne', 'Düsseldorf', 'Krakow', 'Reykjavik', 'Monaco', 'Luxembourg',
  
  // Asia
  'Tokyo', 'Beijing', 'Shanghai', 'Hong Kong', 'Singapore', 'Seoul', 'Bangkok', 'Mumbai', 'Delhi',
  'Taipei', 'Osaka', 'Kyoto', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Ho Chi Minh City', 'Hanoi',
  'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Xi\'an',
  'Dubai', 'Abu Dhabi', 'Doha', 'Tel Aviv', 'Jerusalem', 'Istanbul', 'Ankara', 'Bali', 'Phuket',
  'Maldives', 'Kathmandu', 'Colombo', 'Phnom Penh', 'Yangon', 'Macau', 'Busan', 'Nagoya', 'Sapporo',
  
  // Oceania
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Auckland', 'Wellington', 'Gold Coast', 'Cairns',
  'Adelaide', 'Christchurch', 'Queenstown', 'Fiji', 'Bora Bora', 'Tahiti', 'Honolulu',
  
  // Africa
  'Cairo', 'Cape Town', 'Johannesburg', 'Marrakech', 'Casablanca', 'Nairobi', 'Lagos', 'Accra',
  'Zanzibar', 'Victoria Falls', 'Addis Ababa', 'Tunis', 'Dakar', 'Mauritius', 'Seychelles',
  
  // South America
  'São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Lima', 'Bogotá', 'Santiago', 'Cartagena',
  'Medellín', 'Cusco', 'Quito', 'Montevideo', 'La Paz', 'Brasília', 'Salvador', 'Florianópolis',
  
  // Central America & Caribbean
  'Havana', 'San Juan', 'Panama City', 'San José', 'Nassau', 'Kingston', 'Punta Cana',
  'Aruba', 'Barbados', 'St. Lucia', 'Curaçao', 'Bermuda', 'Cayman Islands',
].sort();

export const searchCities = (query: string, limit: number = 8): string[] => {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Prioritize cities that start with the query
  const startsWithMatches = CITIES.filter(city => 
    city.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Then include cities that contain the query
  const containsMatches = CITIES.filter(city => 
    city.toLowerCase().includes(normalizedQuery) && 
    !city.toLowerCase().startsWith(normalizedQuery)
  );
  
  return [...startsWithMatches, ...containsMatches].slice(0, limit);
};
