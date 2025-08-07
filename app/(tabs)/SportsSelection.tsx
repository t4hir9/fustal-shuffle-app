import { useNavigation } from 'expo-router';
import { Basketball, Soccer, Waves } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SPORTS = [
  { name: 'Futsal', icon: Soccer, route: 'index' },
  { name: 'Basketball', icon: Basketball, route: 'index' }, // Reuse index for now
  { name: 'Polo', icon: Waves, route: 'index' }, // Reuse index for now
];

export default function SportsSelection() {
  const navigation = useNavigation();

  const handleSportSelect = (sportRoute: string, sportName: string) => {
    // Pass sportName as a parameter to configure sport-specific logic
    navigation.navigate(sportRoute, { sport: sportName });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select a Sport</Text>
        <Text style={styles.subtitle}>Choose a sport to manage teams</Text>
      </View>
      <ScrollView style={styles.sportsList}>
        {SPORTS.map((sport) => (
          <TouchableOpacity
            key={sport.name}
            style={styles.sportCard}
            onPress={() => handleSportSelect(sport.route, sport.name)}
          >
            <sport.icon size={32} color="#28a745" />
            <Text style={styles.sportName}>{sport.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  sportsList: {
    padding: 20,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sportName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 15,
  },
});