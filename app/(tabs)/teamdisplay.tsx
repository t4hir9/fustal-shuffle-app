import AsyncStorage from '@react-native-async-storage/async-storage';
import { Play, Shuffle, Star, Trophy, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { getTeamStats, shuffleIntoTeams, validateTeamFormation } from '../../utils/shuffleAlgorithm';

export default function TeamsScreen() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [teamSize, setTeamSize] = useState(5);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showCoinToss, setShowCoinToss] = useState(false);
  const [coinResult, setCoinResult] = useState(null);
  const [startingTeam, setStartingTeam] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedPlayers, savedTeamSize] = await Promise.all([
        AsyncStorage.getItem('players'),
        AsyncStorage.getItem('teamSize'),
      ]);

      if (savedPlayers) {
        setPlayers(JSON.parse(savedPlayers));
      }
      if (savedTeamSize) {
        setTeamSize(parseInt(savedTeamSize));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const shuffleTeams = async () => {
    if (players.length === 0) {
      Alert.alert('No Players', 'Please add some players first!');
      return;
    }

    const validation = validateTeamFormation(players, teamSize);
    if (!validation.valid) {
      Alert.alert('Cannot Form Teams', validation.message);
      return;
    }

    if (validation.warnings.length > 0) {
      Alert.alert('Team Formation Warning', validation.warnings.join('\n'));
    }

    setIsShuffling(true);
    
    // Add delay for animation effect
    setTimeout(() => {
      try {
        const result = shuffleIntoTeams(players, teamSize);
        setTeams(result.teams);
        setSubstitutes(result.substitutes);
        setStartingTeam(null);
        setCoinResult(null);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
      setIsShuffling(false);
    }, 1000);
  };

  const performCoinToss = () => {
    if (teams.length < 2) {
      Alert.alert('Need Teams', 'Please shuffle teams first!');
      return;
    }

    setShowCoinToss(true);
    
    // Simulate coin toss with random result
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const winningTeam = result === 'heads' ? teams[0] : teams[1];
      
      setCoinResult(result);
      setStartingTeam(winningTeam);
      
      setTimeout(() => {
        setShowCoinToss(false);
      }, 2000);
    }, 2000);
  };

  const saveTeamsForMatch = async () => {
    if (teams.length === 0) {
      Alert.alert('No Teams', 'Please shuffle teams first!');
    return;
    }
    

    try {
      const matchData = {
        teams,
        substitutes,
        teamSize,
        startingTeam,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem('currentMatch', JSON.stringify(matchData));
      Alert.alert('Success', 'Teams saved! Go to Match tab to start the game.');
    } catch (error) {
      console.error('Error saving teams:', error);
      Alert.alert('Error', 'Failed to save teams for match.');
    }
  };

  const renderPlayer = (player, index) => (
    <View key={player.id} style={styles.playerItem}>
      <Text style={styles.playerName}>{player.name}</Text>
      <View style={styles.playerDetails}>
        <View
          style={[
            styles.positionBadge,
            { backgroundColor: getPositionColor(player.position) },
          ]}
        >
          <Text style={styles.positionText}>{player.position}</Text>
        </View>
        <View style={styles.skillStars}>
          {[...Array(player.skillLevel)].map((_, i) => (
            <Star key={i} size={12} color="#ffc107" fill="#ffc107" />
          ))}
        </View>
      </View>
    </View>
  );

  const renderTeam = (team, index) => {
    const stats = getTeamStats(team.players);
    
    return (
      <Animatable.View
        key={team.name}
        animation={isShuffling ? 'pulse' : undefined}
        duration={1000}
        style={[styles.teamCard, { borderLeftColor: team.color }]}
      >
        <View style={styles.teamHeader}>
          <Text style={[styles.teamName, { color: team.color }]}>
            {team.name}
          </Text>
          {startingTeam && startingTeam.name === team.name && (
            <View style={styles.startingTeamBadge}>
              <Trophy size={16} color="#ffc107" />
              <Text style={styles.startingTeamText}>Starting</Text>
            </View>
          )}
        </View>
        
        <View style={styles.teamStats}>
          <Text style={styles.statText}>
            Avg Skill: {stats.averageSkill} ⭐
          </Text>
          <Text style={styles.statText}>
            Players: {stats.playerCount}
          </Text>
        </View>
        
        <View style={styles.positionSummary}>
          <Text style={styles.positionText}>{stats.positions}</Text>
        </View>
        
        <View style={styles.playersList}>
          {team.players.map(renderPlayer)}
        </View>
      </Animatable.View>
    );
  };

  const getPositionColor = (position) => {
    const colors = {
      GK: '#fd7e14',
      DEF: '#007bff',
      MID: '#28a745',
      FWD: '#dc3545',
    };
    return colors[position] || '#6c757d';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Formation</Text>
        <Text style={styles.subtitle}>
          {players.length} players • {teamSize}v{teamSize} format
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.shuffleButton]}
          onPress={shuffleTeams}
          disabled={isShuffling}
        >
          <Shuffle size={20} color="#ffffff" />
          <Text style={styles.controlButtonText}>
            {isShuffling ? 'Shuffling...' : 'Shuffle Teams'}
          </Text>
        </TouchableOpacity>

        {teams.length >= 2 && (
          <TouchableOpacity
            style={[styles.controlButton, styles.coinTossButton]}
            onPress={performCoinToss}
            disabled={showCoinToss}
          >
            <Trophy size={20} color="#ffffff" />
            <Text style={styles.controlButtonText}>Coin Toss</Text>
          </TouchableOpacity>
        )}
      </View>

      {showCoinToss && (
        <Animatable.View
          animation="bounceIn"
          style={styles.coinTossContainer}
        >
          <Animatable.View
            animation="rotate"
            iterationCount="infinite"
            duration={500}
            style={styles.coin}
          >
            <Text style={styles.coinText}>⚽</Text>
          </Animatable.View>
          <Text style={styles.coinTossText}>Flipping coin...</Text>
          {coinResult && (
            <Animatable.Text
              animation="fadeIn"
              delay={1000}
              style={styles.coinResult}
            >
              {coinResult.toUpperCase()}!
            </Animatable.Text>
          )}
        </Animatable.View>
      )}

      <ScrollView style={styles.teamsContainer}>
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color="#ced4da" />
            <Text style={styles.emptyStateText}>No teams formed yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add players and shuffle to create teams
            </Text>
          </View>
        ) : (
          <>
            {teams.map(renderTeam)}
            
            {substitutes.length > 0 && (
              <View style={styles.substitutesCard}>
                <Text style={styles.substitutesTitle}>
                  Substitutes ({substitutes.length})
                </Text>
                <View style={styles.playersList}>
                  {substitutes.map(renderPlayer)}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {teams.length > 0 && (
        <TouchableOpacity
          style={styles.startMatchButton}
          onPress={saveTeamsForMatch}
        >
          <Play size={24} color="#ffffff" />
          <Text style={styles.startMatchButtonText}>Start Match</Text>
        </TouchableOpacity>
      )}
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
  controls: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  shuffleButton: {
    backgroundColor: '#28a745',
  },
  coinTossButton: {
    backgroundColor: '#fd7e14',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  coinTossContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  coin: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffc107',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  coinText: {
    fontSize: 40,
  },
  coinTossText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  coinResult: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 10,
  },
  teamsContainer: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
  teamCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  teamName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  startingTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  startingTeamText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  positionSummary: {
    marginBottom: 15,
  },
  positionText: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    flex: 1,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  skillStars: {
    flexDirection: 'row',
    gap: 2,
  },
  substitutesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#ffc107',
    borderStyle: 'dashed',
  },
  substitutesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 15,
  },
  startMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    margin: 20,
    padding: 18,
    borderRadius: 15,
    gap: 10,
  },
  startMatchButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});