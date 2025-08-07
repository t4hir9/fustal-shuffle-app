import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Star, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

const POSITIONS = [
  { key: 'DEF', label: 'Defender', color: '#007bff' },
  { key: 'MID', label: 'Midfielder', color: '#28a745' },
  { key: 'FWD', label: 'Forward', color: '#dc3545' },
];

const TEAM_SIZES = [4, 5, 7, 11];

type Player = {
  id: string;
  name: string;
  position: string;
  skillLevel: number;
  stats: {
    matches: number;
    goals: number;
    wins: number;
  };
};

export default function Index() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    position: 'MID',
    skillLevel: 3,
  });
  const [teamSize, setTeamSize] = useState(5);

  useEffect(() => {
    loadPlayers();
    loadTeamSize();
  }, []);

  const loadPlayers = async () => {
    try {
      const savedPlayers = await AsyncStorage.getItem('players');
      if (savedPlayers) {
        setPlayers(JSON.parse(savedPlayers));
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadTeamSize = async () => {
    try {
      const savedTeamSize = await AsyncStorage.getItem('teamSize');
      if (savedTeamSize) {
        setTeamSize(parseInt(savedTeamSize));
      }
    } catch (error) {
      console.error('Error loading team size:', error);
    }
  };

  const savePlayers = async (updatedPlayers: {
    id: string;
    name: string;
    position: string;
    skillLevel: number;
    stats: {
      matches: number;
      goals: number;
      wins: number;
    };
  }[]) => {
    try {
      await AsyncStorage.setItem('players', JSON.stringify(updatedPlayers));
      setPlayers(updatedPlayers);
    } catch (error) {
      console.error('Error saving players:', error);
    }
  };

  const saveTeamSize = async (size: number) => {
    try {
      await AsyncStorage.setItem('teamSize', size.toString());
      setTeamSize(size);
    } catch (error) {
      console.error('Error saving team size:', error);
    }
  };

  const addPlayer = () => {
    if (!newPlayer.name.trim()) {
      Alert.alert('Error', 'Please enter a player name');
      return;
    }

    const player = {
      id: uuidv4(),
      name: newPlayer.name.trim(),
      position: newPlayer.position,
      skillLevel: newPlayer.skillLevel,
      stats: {
        matches: 0,
        goals: 0,
        wins: 0,
      },
    };

    const updatedPlayers = [...players, player];
    savePlayers(updatedPlayers);
    setNewPlayer({ name: '', position: 'MID', skillLevel: 3 });
    setShowAddModal(false);
  };

  const removePlayer = (playerId: string) => {
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPlayers = players.filter(p => p.id !== playerId);
            savePlayers(updatedPlayers);
          },
        },
      ]
    );
  };

  const renderStars = (level: number, onPress?: (level: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Star
              size={20}
              color={star <= level ? '#ffc107' : '#e9ecef'}
              fill={star <= level ? '#ffc107' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getPositionColor = (position: string) => {
    return POSITIONS.find(p => p.key === position)?.color || '#6c757d';
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Futsal Players</Text>
        <Text style={styles.subtitle}>{players.length} players added</Text>
      </View>

      <View style={styles.teamSizeContainer}>
        <Text style={styles.sectionTitle}>Team Size</Text>
        <View style={styles.teamSizeButtons}>
          {TEAM_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.teamSizeButton,
                teamSize === size && styles.teamSizeButtonActive,
              ]}
              onPress={() => saveTeamSize(size)}
            >
              <Text
                style={[
                  styles.teamSizeButtonText,
                  teamSize === size && styles.teamSizeButtonTextActive,
                ]}
              >
                {size}v{size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.playersList}>
        {players.map((player) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.playerInfo}>
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
                {renderStars(player.skillLevel)}
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePlayer(player.id)}
            >
              <Trash2 size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Player</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Player</Text>

            <Text style={styles.inputLabel}>Player Name</Text>
            <TextInput
              style={styles.textInput}
              value={newPlayer.name}
              onChangeText={(text) =>
                setNewPlayer({ ...newPlayer, name: text })
              }
              placeholder="Enter player name"
              autoFocus
            />

            <Text style={styles.inputLabel}>Position</Text>
            <View style={styles.positionButtons}>
              {POSITIONS.map((position) => (
                <TouchableOpacity
                  key={position.key}
                  style={[
                    styles.positionButton,
                    newPlayer.position === position.key && {
                      backgroundColor: position.color,
                    },
                  ]}
                  onPress={() =>
                    setNewPlayer({ ...newPlayer, position: position.key })
                  }
                >
                  <Text
                    style={[
                      styles.positionButtonText,
                      newPlayer.position === position.key && {
                        color: '#ffffff',
                      },
                    ]}
                  >
                    {position.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Skill Level</Text>
            {renderStars(newPlayer.skillLevel, (level) =>
              setNewPlayer({ ...newPlayer, skillLevel: level })
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addPlayer}>
                <Text style={styles.saveButtonText}>Add Player</Text>
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
  teamSizeContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 15,
  },
  teamSizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  teamSizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#28a745',
    backgroundColor: '#ffffff',
  },
  teamSizeButtonActive: {
    backgroundColor: '#28a745',
  },
  teamSizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  teamSizeButtonTextActive: {
    color: '#ffffff',
  },
  playersList: {
    flex: 1,
    padding: 20,
  },
  playerCard: {
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 5,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  removeButton: {
    padding: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 10,
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
    fontSize: 24,
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
    marginTop: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  positionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  positionButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#ffffff',
  },
  positionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#28a745',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});