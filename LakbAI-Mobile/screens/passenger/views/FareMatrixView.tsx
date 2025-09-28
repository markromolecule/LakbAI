import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FareItem } from '../components/fare/FareItem';
import { InfoCard } from '../../../components/common/InfoCard';
import { FARE_MATRIX } from '../../../constants/fareMatrix';
import { COLORS, SPACING } from '../../../shared/styles';
import { globalStyles } from '../../../shared/styles/globalStyles';
import { fareMatrixService, FareMatrixEntry } from '../../../shared/services/fareMatrixService';
import { searchService, FareSearchResult } from '../../../shared/services/searchService';

export const FareMatrixScreen: React.FC = () => {
  const [fareMatrixData, setFareMatrixData] = useState<FareMatrixEntry[]>([]);
  const [filteredFareData, setFilteredFareData] = useState<FareMatrixEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<FareSearchResult[]>([]);
  const [isSearchingDatabase, setIsSearchingDatabase] = useState<boolean>(false);

  const routeInfo = [
    '• Operating hours: 5:00 AM - 10:00 PM',
    '• Average travel time: 45-60 minutes',
    '• Frequency: Every 10-15 minutes',
    '• Air-conditioned jeepneys available'
  ];

  const fetchFareMatrix = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching fare matrix from API...');
      
      // Fetch fare matrix for route 1 (Tejero - Pala-pala route)
      // Filter for sequential routes (adjacent checkpoints)
      const result = await fareMatrixService.getFareMatrixForRoute(1);
      
      console.log('📊 API Response:', result);
      
      if (result.status === 'success' && result.fare_matrix && result.fare_matrix.length > 0) {
        console.log('📊 Raw fare_matrix length:', result.fare_matrix.length);
        
        // Filter for sequential routes (each checkpoint to the next one)
        const sequentialRoutes = result.fare_matrix.filter(fare => fare.from_checkpoint_id === fare.to_checkpoint_id - 1);
        console.log('📍 Sequential routes found:', sequentialRoutes.length);
        
        // Randomize and limit to 10 entries
        const shuffledFares = [...sequentialRoutes].sort(() => Math.random() - 0.5);
        const limitedFares = shuffledFares.slice(0, 10);
        
        console.log('✅ Successfully loaded', limitedFares.length, 'randomized sequential fare entries');
        console.log('📋 Sample fare entries:', limitedFares.slice(0, 3));
        setFareMatrixData(limitedFares);
        setFilteredFareData(limitedFares);
      } else {
        // Fallback to static data if API fails
        console.warn('❌ API failed, using static data:', result.message);
        setFareMatrixData([]);
        setFilteredFareData([]);
        setError('Unable to load dynamic fare data. Showing limited information.');
      }
    } catch (error) {
      console.error('💥 Error fetching fare matrix:', error);
      setError('Failed to load fare data. Please check your connection.');
      setFareMatrixData([]);
      setFilteredFareData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Refreshing fare matrix with new randomization...');
    await fetchFareMatrix();
    setIsRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    
    if (query.trim() === '') {
      setFilteredFareData(fareMatrixData);
      setSearchResults([]);
      return;
    }

    // First try local filtering for immediate results
    const localFiltered = fareMatrixData.filter(fare => {
      const fromMatch = fare.from_checkpoint.toLowerCase().includes(query.toLowerCase());
      const toMatch = fare.to_checkpoint.toLowerCase().includes(query.toLowerCase());
      const fareMatch = fare.fare_amount.toString().includes(query);
      
      return fromMatch || toMatch || fareMatch;
    });
    
    setFilteredFareData(localFiltered);

    // Then search the database for more comprehensive results
    if (query.length >= 2) { // Only search database for queries with 2+ characters
      setIsSearchingDatabase(true);
      try {
        // For now, simulate database search with expanded local data
        // This will be replaced with actual API call once the backend is fixed
        const expandedResults = await simulateDatabaseSearch(query);
        setSearchResults(expandedResults);
        console.log('🔍 Simulated database search found:', expandedResults.length, 'results');
      } catch (error) {
        console.error('❌ Database search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearchingDatabase(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredFareData(fareMatrixData);
    setSearchResults([]);
    setIsSearching(false);
  };

  // Simulate database search with comprehensive fare data
  const simulateDatabaseSearch = async (query: string): Promise<FareSearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create comprehensive fare data that would come from database
    const comprehensiveFares: FareSearchResult[] = [
      // Route 1 fares
      { id: 1, fare_amount: '13', from_checkpoint: 'SM Epza', to_checkpoint: 'Robinson Tejero', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 2, fare_amount: '15', from_checkpoint: 'SM Epza', to_checkpoint: 'Malabon', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 3, fare_amount: '17', from_checkpoint: 'SM Epza', to_checkpoint: 'Riverside', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 4, fare_amount: '19', from_checkpoint: 'SM Epza', to_checkpoint: 'Lancaster New City', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 5, fare_amount: '21', from_checkpoint: 'SM Epza', to_checkpoint: 'Pasong Camachile I', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 6, fare_amount: '23', from_checkpoint: 'SM Epza', to_checkpoint: 'Open Canal', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 7, fare_amount: '25', from_checkpoint: 'SM Epza', to_checkpoint: 'Santiago', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 8, fare_amount: '27', from_checkpoint: 'SM Epza', to_checkpoint: 'Bella Vista', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 9, fare_amount: '29', from_checkpoint: 'SM Epza', to_checkpoint: 'San Francisco', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 10, fare_amount: '31', from_checkpoint: 'SM Epza', to_checkpoint: 'Country Meadow', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 11, fare_amount: '33', from_checkpoint: 'SM Epza', to_checkpoint: 'Pabahay', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 12, fare_amount: '35', from_checkpoint: 'SM Epza', to_checkpoint: 'Monterey', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 13, fare_amount: '37', from_checkpoint: 'SM Epza', to_checkpoint: 'Langkaan', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 14, fare_amount: '39', from_checkpoint: 'SM Epza', to_checkpoint: 'Tierra Vista', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 15, fare_amount: '41', from_checkpoint: 'SM Epza', to_checkpoint: 'Robinson Dasmariñas', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      { id: 16, fare_amount: '43', from_checkpoint: 'SM Epza', to_checkpoint: 'SM Dasmariñas', route_name: 'SM Epza → SM Dasmariñas', origin: 'SM Epza', destination: 'SM Dasmariñas' },
      
      // Route 2 fares (reverse)
      { id: 17, fare_amount: '13', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Robinson Dasmariñas', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 18, fare_amount: '15', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Tierra Vista', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 19, fare_amount: '17', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Langkaan', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 20, fare_amount: '19', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Monterey', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 21, fare_amount: '21', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Pabahay', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 22, fare_amount: '23', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Country Meadow', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 23, fare_amount: '25', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'San Francisco', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 24, fare_amount: '27', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Bella Vista', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 25, fare_amount: '29', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Santiago', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 26, fare_amount: '31', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Open Canal', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 27, fare_amount: '33', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Pasong Camachile I', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 28, fare_amount: '35', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Lancaster New City', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 29, fare_amount: '37', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Riverside', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 30, fare_amount: '39', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Malabon', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 31, fare_amount: '41', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'Robinson Tejero', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
      { id: 32, fare_amount: '43', from_checkpoint: 'SM Dasmariñas', to_checkpoint: 'SM Epza', route_name: 'SM Dasmariñas → SM Epza', origin: 'SM Dasmariñas', destination: 'SM Epza' },
    ];
    
    // Filter the comprehensive data based on query
    const filtered = comprehensiveFares.filter(fare => {
      const fromMatch = fare.from_checkpoint.toLowerCase().includes(query.toLowerCase());
      const toMatch = fare.to_checkpoint.toLowerCase().includes(query.toLowerCase());
      const fareMatch = fare.fare_amount.includes(query);
      const routeMatch = fare.route_name.toLowerCase().includes(query.toLowerCase());
      const originMatch = fare.origin.toLowerCase().includes(query.toLowerCase());
      const destinationMatch = fare.destination.toLowerCase().includes(query.toLowerCase());
      
      return fromMatch || toMatch || fareMatch || routeMatch || originMatch || destinationMatch;
    });
    
    return filtered;
  };

  useEffect(() => {
    fetchFareMatrix();
  }, []);

  const renderFareItems = () => {
    // Show database search results if available, otherwise show local results
    const hasDatabaseResults = searchResults.length > 0;
    const hasLocalResults = filteredFareData.length > 0;
    
    if (hasDatabaseResults) {
      // Show database search results
      return (
        <View>
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsTitle}>
              Database Results ({searchResults.length})
            </Text>
            {isSearchingDatabase && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </View>
          {searchResults.map((fare, index) => (
            <FareItem
              key={`db-fare-${fare.id}-${index}`}
              fareInfo={{
                from: fare.from_checkpoint,
                to: fare.to_checkpoint,
                fare: parseFloat(fare.fare_amount.toString())
              }}
              isLast={index === searchResults.length - 1}
            />
          ))}
        </View>
      );
    } else if (hasLocalResults) {
      // Show local filtered results
      return filteredFareData.map((fare, index) => (
        <FareItem
          key={`local-fare-${fare.id}-${index}`}
          fareInfo={{
            from: fare.from_checkpoint,
            to: fare.to_checkpoint,
            fare: parseFloat(fare.fare_amount.toString())
          }}
          isLast={index === filteredFareData.length - 1}
        />
      ));
    } else if (fareMatrixData.length === 0) {
      // Fallback to static data
      return FARE_MATRIX.slice(0, 10).map((fare, index) => (
        <FareItem
          key={`static-${fare.from}-${fare.to}`}
          fareInfo={fare}
          isLast={index === 9}
        />
      ));
    } else {
      // No search results
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search" size={48} color={COLORS.gray400} />
          <Text style={styles.noResultsTitle}>No Results Found</Text>
          <Text style={styles.noResultsText}>
            Try searching for different checkpoints or destinations
          </Text>
        </View>
      );
    }
  };

  return (
    <ScrollView 
      style={globalStyles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      <Text style={globalStyles.pageTitle}>Routes & Fare Matrix</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search checkpoints, destinations, or fares..."
            placeholderTextColor={COLORS.gray500}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          )}
        </View>
        {isSearching && (
          <Text style={styles.searchResultsText}>
            {isSearchingDatabase 
              ? 'Searching database...' 
              : searchResults.length > 0 
                ? `${searchResults.length} database result${searchResults.length !== 1 ? 's' : ''} found`
                : `${filteredFareData.length} local result${filteredFareData.length !== 1 ? 's' : ''} found`
            }
          </Text>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.fareMatrixContainer}>
        <View style={styles.fareMatrixHeader}>
          <Text style={styles.fareMatrixTitle}>Vice-versa Routes</Text>
          <Text style={styles.fareMatrixSubtitle}>
            {fareMatrixData.length > 0 ? 'Checkpoint Fares' : 'Sample fares (limited)'}
          </Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading fare data...</Text>
          </View>
        ) : (
          renderFareItems()
        )}
      </View>

      <InfoCard
        title="Route Information:"
        items={routeInfo}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fareMatrixContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareMatrixHeader: {
    backgroundColor: COLORS.blue50,
    padding: SPACING.lg,
    borderTopLeftRadius: SPACING.md,
    borderTopRightRadius: SPACING.md,
  },
  fareMatrixTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue800,
  },
  fareMatrixSubtitle: {
    fontSize: 14,
    color: COLORS.blue600,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.gray600,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  // Search styles
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.gray800,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  searchResultsText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.gray50,
    borderRadius: SPACING.md,
    margin: SPACING.md,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray700,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noResultsText: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.blue50,
    borderTopLeftRadius: SPACING.md,
    borderTopRightRadius: SPACING.md,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue800,
  },
});