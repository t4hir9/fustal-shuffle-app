import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Minus,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Square,
    Trophy
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

const MATCH_DURATIONS = [
  { label: '5 Minutes', value: 5 * 60 },
  { label: '7 Minutes', value: 7 * 60 },
  { label: '10 Minutes', value: 10 * 60 },
  { label: '90 Minutes', value: 90 * 60 },
];

export default function TimerScreen() {
  const [matchData, setMatchData] = useState(null);
  const [duration, setDuration] = useState(10 * 60); // Default 10 minutes
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [scores, setScores] = useState({});
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [goalScorer, setGoalScorer] = useState('');
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  
  const intervalRef = useRef(null);

  useEffect(() => {
    loadMatchData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endMatch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft]);

  const loadMatchData = async () => {
    try {
      const savedMatch = await AsyncStorage.getItem('currentMatch');
      if (savedMatch) {
        const data = JSON.parse(savedMatch);
        setMatchData(data);
        
        // Initialize scores
        const initialScores = {};
        data.teams.forEach(team => {
          initialScores[team.name] = {
            goals: 0,
            scorers: [],
          };
        });
        setScores(initialScores);
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  const startMatch = () => {
    if (!matchData) {
      Alert.alert('No Teams', 'Please create teams first in the Teams tab!');
      return;
    }
    
    setTimeLeft(duration);
    setIsRunning(true);
    setIsPaused(false);
    setMatchStarted(true);
    setMatchEnded(false);
  };

  const pauseMatch = () => {
    setIsPaused(true);
  };

  const resumeMatch = () => {
    setIsPaused(false);
  };

  const stopMatch = () => {
    Alert.alert(
      'Stop Match',
      'Are you sure you want to stop the match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            endMatch();
          },
        },
      ]
    );
  };

  const resetMatch = () => {
    Alert.alert(
      'Reset Match',
      'This will reset the timer and scores. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            setTimeLeft(duration);
            setMatchStarted(false);
            setMatchEnded(false);
            
            if (matchData) {
              const resetScores = {};
              matchData.teams.forEach(team => {
                resetScores[team.name] = {
                  goals: 0,
                  scorers: [],
                };
              });
              setScores(resetScores);
            }
          },
        },
      ]
    );
  };

  const endMatch = () => {
    setIsRunning(false);
    setIsPaused(false);
    setMatchEnded(true);
    
    // Determine winner
    if (matchData && Object.keys(scores).length > 0) {
      const teamScores = Object.entries(scores).map(([team, data]) => ({
        team,
        goals: data.goals,
      }));
      
      teamScores.sort((a, b) => b.goals - a.goals);
      
      if (teamScores[0].goals > teamScores[1].goals) {
        Alert.alert(
          'Match Ended!',
          `🏆 ${teamScores[0].team} wins ${teamScores[0].goals}-${teamScores[1].goals}!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Match Ended!',
          `⚖️ It's a draw ${teamScores[0].goals}-${teamScores[1].goals}!`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const addGoal = (team) => {
    setSelectedTeam(team);
    setShowScoreModal(true);
  };

  const confirmGoal = () => {
    if (!selectedTeam) return;
    
    setScores(prev => ({
      ...prev,
      [selectedTeam.name]: {
        goals: prev[selectedTeam.name].goals + 1,
        scorers: [
          ...prev[selectedTeam.name].scorers,
          {
            player: goalScorer || 'Unknown',
            time: formatTime(duration - timeLeft),
          },
        ],
      },
    }));
    
    setShowScoreModal(false);
    setGoalScorer('');
    setSelectedTeam(null);
  };

  const removeGoal = (teamName) => {
    if (scores[teamName].goals > 0) {
      setScores(prev => ({
        ...prev,
        [teamName]: {
          goals: prev[teamName].goals - 1,
          scorers: prev[teamName].scorers.slice(0, -1),
        },
      }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return '#dc3545'; // Red for last minute
    if (timeLeft <= 300) return '#fd7e14'; // Orange for last 5 minutes
    return '#28a745'; // Green for normal time
  };

  const renderTeamScore = (team) => {
    const teamScore = scores[team.name] || { goals: 0, scorers: [] };
    
    return (
      <View key={team.name} style={[styles.teamScoreCard, { borderLeftColor: team.color }]}>
        <View style={styles.teamScoreHeader}>
          <Text style={[styles.teamScoreName, { color: team.color }]}>
            {team.name}
          </Text>
          <Text style={styles.teamScoreGoals}>{teamScore.goals}</Text>
        </View>
        
        <View style={styles.scoreControls}>
          <TouchableOpacity
            style={[styles.scoreButton, styles.addGoalButton]}
            onPress={() => addGoal(team)}
            disabled={!matchStarted || matchEnded}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.scoreButtonText}>Goal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.scoreButton, styles.removeGoalButton]}
            onPress={() => removeGoal(team.name)}
            disabled={teamScore.goals === 0}
          >
            <Minus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {teamScore.scorers.length > 0 && (
          <View style={styles.scorersContainer}>
            <Text style={styles.scorersTitle}>Goal Scorers:</Text>
            {teamScore.scorers.map((scorer, index) => (
              <Text key={index} style={styles.scorerText}>
                {scorer.player} ({scorer.time})
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match Timer</Text>
        {matchData && (
          <Text style={styles.subtitle}>
            {matchData.teamSize}v{matchData.teamSize} • {matchData.teams.length} teams
          </Text>
        )}
      </View>

      {!matchData ? (
        <View style={styles.noMatchContainer}>
          <Trophy size={64} color="#ced4da" />
          <Text style={styles.noMatchText}>No match setup</Text>
          <Text style={styles.noMatchSubtext}>
            Go to Teams tab to create teams first
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.timerContainer}>
            <Animatable.View
              animation={timeLeft <= 60 && isRunning ? 'pulse' : undefined}
              iterationCount="infinite"
              duration={1000}
            >
              <Text style={[styles.timerText, { color: getTimeColor() }]}>
                {formatTime(timeLeft)}
              </Text>
            </Animatable.View>
            
            <Text style={styles.timerLabel}>
              {matchEnded ? 'FULL TIME' : isRunning ? (isPaused ? 'PAUSED' : 'RUNNING') : 'READY'}
            </Text>
          </View>

          <View style={styles.durationSelector}>
            <Text style={styles.sectionTitle}>Match Duration</Text>
            <View style={styles.durationButtons}>
              {MATCH_DURATIONS.map((dur) => (
                <TouchableOpacity
                  key={dur.value}
                  style={[
                    styles.durationButton,
                    duration === dur.value && styles.durationButtonActive,
                  ]}
                  onPress={() => {
                    setDuration(dur.value);
                    if (!matchStarted) {
                      setTimeLeft(dur.value);
                    }
                  }}
                  disabled={matchStarted}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      duration === dur.value && styles.durationButtonTextActive,
                    ]}
                  >
                    {dur.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.controls}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.controlButton, styles.startButton]}
                onPress={startMatch}
              >
                <Play size={24} color="#ffffff" />
                <Text style={styles.controlButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                  onPress={isPaused ? resumeMatch : pauseMatch}
                >
                  {isPaused ? (
                    <Play size={24} color="#ffffff" />
                  ) : (
                    <Pause size={24} color="#ffffff" />
                  )}
                  <Text style={styles.controlButtonText}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopMatch}
                >
                  <Square size={24} color="#ffffff" />
                  <Text style={styles.controlButtonText}>Stop</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={resetMatch}
            >
              <RotateCcw size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scoresContainer}>
            <Text style={styles.sectionTitle}>Live Score</Text>
            {matchData.teams.map(renderTeamScore)}
          </ScrollView>
        </>
      )}

      <Modal
        visible={showScoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Goal for {selectedTeam?.name}!
            </Text>
            
            <Text style={styles.inputLabel}>Goal Scorer (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={goalScorer}
              onChangeText={setGoalScorer}
              placeholder="Enter player name"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowScoreModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmGoal}
              >
                <Text style={styles.confirmButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  noMatchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noMatchText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 15,
  },
  noMatchSubtext: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 10,
    letterSpacing: 2,
  },
  durationSelector: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 15,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: '#ffffff',
    flex: 1,
    minWidth: '45%',
  },
  durationButtonActive: {
    backgroundColor: '#007bff',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
    textAlign: 'center',
  },
  durationButtonTextActive: {
    color: '#ffffff',
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
  startButton: {
    backgroundColor: '#28a745',
  },
  pauseButton: {
    backgroundColor: '#fd7e14',
  },
  resumeButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  scoresContainer: {
    flex: 1,
    padding: 20,
  },
  teamScoreCard: {
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
  teamScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  teamScoreName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  teamScoreGoals: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212529',
  },
  scoreControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  scoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  addGoalButton: {
    backgroundColor: '#28a745',
    flex: 1,
  },
  removeGoalButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
  },
  scoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scorersContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 15,
  },
  scorersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  scorerText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#28a745',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});