
/**
 * Fisher-Yates shuffle algorithm with position and skill balancing
 * Ensures fair team distribution for futsal matches
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
export function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate team balance score based on positions and skill levels
 * @param {Array} team - Array of players
 * @returns {Object} - Balance metrics
 */
function calculateTeamBalance(team) {
  const positions = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  let totalSkill = 0;

  team.forEach(player => {
    positions[player.position]++;
    totalSkill += player.skillLevel;
  });

  return {
    positions,
    averageSkill: totalSkill / team.length,
    totalSkill,
  };
}

/**
 * Balance teams by swapping players to minimize skill and position differences
 * @param {Array} team1 - First team
 * @param {Array} team2 - Second team
 * @returns {Object} - Balanced teams
 */
function balanceTeams(team1, team2) {
  const maxIterations = 50;
  let iterations = 0;

  while (iterations < maxIterations) {
    const balance1 = calculateTeamBalance(team1);
    const balance2 = calculateTeamBalance(team2);
    
    const skillDiff = Math.abs(balance1.averageSkill - balance2.averageSkill);
    
    // If teams are reasonably balanced, stop
    if (skillDiff < 0.5) break;

    // Find best swap to improve balance
    let bestSwap = null;
    let bestImprovement = 0;

    for (let i = 0; i < team1.length; i++) {
      for (let j = 0; j < team2.length; j++) {
        // Create temporary teams with swapped players
        const tempTeam1 = [...team1];
        const tempTeam2 = [...team2];
        
        [tempTeam1[i], tempTeam2[j]] = [tempTeam2[j], tempTeam1[i]];
        
        const newBalance1 = calculateTeamBalance(tempTeam1);
        const newBalance2 = calculateTeamBalance(tempTeam2);
        const newSkillDiff = Math.abs(newBalance1.averageSkill - newBalance2.averageSkill);
        
        const improvement = skillDiff - newSkillDiff;
        
        if (improvement > bestImprovement) {
          bestImprovement = improvement;
          bestSwap = { i, j };
        }
      }
    }

    // Apply best swap if found
    if (bestSwap && bestImprovement > 0.1) {
      [team1[bestSwap.i], team2[bestSwap.j]] = [team2[bestSwap.j], team1[bestSwap.i]];
    } else {
      break; // No beneficial swap found
    }

    iterations++;
  }

  return { team1, team2 };
}

/**
 * Shuffle players into balanced teams
 * @param {Array} players - Array of all players
 * @param {number} teamSize - Number of players per team
 * @returns {Object} - Shuffled and balanced teams with remaining players
 */
export function shuffleIntoTeams(players, teamSize) {
  if (players.length < teamSize * 2) {
    throw new Error(`Need at least ${teamSize * 2} players for ${teamSize}v${teamSize} match`);
  }

  // Shuffle all players first
  const shuffledPlayers = fisherYatesShuffle(players);
  
  // Calculate how many complete teams we can make
  const totalTeams = Math.floor(shuffledPlayers.length / teamSize);
  const playersNeeded = totalTeams * teamSize;
  
  // Select players for teams (leave extras as substitutes)
  const selectedPlayers = shuffledPlayers.slice(0, playersNeeded);
  const substitutes = shuffledPlayers.slice(playersNeeded);
  
  // Create teams
  const teams = [];
  for (let i = 0; i < totalTeams; i++) {
    const team = selectedPlayers.slice(i * teamSize, (i + 1) * teamSize);
    teams.push(team);
  }
  
  // For 2 teams, apply balancing algorithm
  if (teams.length === 2) {
    const balanced = balanceTeams(teams[0], teams[1]);
    teams[0] = balanced.team1;
    teams[1] = balanced.team2;
  }
  
  // Assign team names
  const teamNames = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];
  const namedTeams = teams.map((team, index) => ({
    name: teamNames[index] || `Team ${index + 1}`,
    players: team,
    color: getTeamColor(index),
  }));
  
  return {
    teams: namedTeams,
    substitutes,
    totalTeams: namedTeams.length,
  };
}

/**
 * Get team color based on index
 * @param {number} index - Team index
 * @returns {string} - Hex color code
 */
function getTeamColor(index) {
  const colors = ['#28a745', '#007bff', '#fd7e14', '#dc3545'];
  return colors[index % colors.length];
}

/**
 * Validate if teams can be formed with given players and team size
 * @param {Array} players - Array of players
 * @param {number} teamSize - Desired team size
 * @returns {Object} - Validation result with suggestions
 */
export function validateTeamFormation(players, teamSize) {
  const totalPlayers = players.length;
  const minPlayersNeeded = teamSize * 2;
  
  if (totalPlayers < minPlayersNeeded) {
    return {
      valid: false,
      message: `Need at least ${minPlayersNeeded} players for ${teamSize}v${teamSize}. You have ${totalPlayers}.`,
      suggestion: `Add ${minPlayersNeeded - totalPlayers} more players.`,
    };
  }
  
  // Check position distribution
  const positions = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  players.forEach(player => {
    positions[player.position]++;
  });
  
  const warnings = [];
  
  // For futsal, ideally we want at least 1 goalkeeper per team
  if (positions.GK < 2 && teamSize >= 5) {
    warnings.push('Consider adding more goalkeepers for better team balance.');
  }
  
  const maxTeams = Math.floor(totalPlayers / teamSize);
  const substitutes = totalPlayers % teamSize;
  
  return {
    valid: true,
    maxTeams,
    substitutes,
    warnings,
    message: `Can form ${maxTeams} teams with ${substitutes} substitutes.`,
  };
}

/**
 * Get team statistics for display
 * @param {Array} team - Team players
 * @returns {Object} - Team statistics
 */
export function getTeamStats(team) {
  const balance = calculateTeamBalance(team);
  const positions = Object.entries(balance.positions)
    .filter(([_, count]) => count > 0)
    .map(([pos, count]) => `${count} ${pos}`)
    .join(', ');
  
  return {
    averageSkill: balance.averageSkill.toFixed(1),
    totalSkill: balance.totalSkill,
    positions,
    playerCount: team.length,
  };
}