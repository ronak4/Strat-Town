import { zSkribblMove, type SkribblView, type TaggedGameView } from '@strategy-town/shared';
import { GameService } from './gameServiceManager.ts';
import { type GameLogic } from './gameLogic.ts';

export interface SkribblState {
  // Game configuration
  totalRounds: number;
  roundTimeLimit: number; // in secs
  wordList: string[];

  // Current game progress
  currentRound: number;
  currentDrawer: number; // player index of drawer
  currentWord: string;
  roundStartTime: number; // Timestamp when round started
  gamePhase: 'playing' | 'roundEnd' | 'gameEnd';

  // Player progress
  scores: number[]; // by player index
  correctGuessers: number[];
}

function calculatePoints(state: SkribblState): number {
  const timeElapsed = Date.now() - state.roundStartTime;
  const timeRemaining = Math.max(0, state.roundTimeLimit * 1000 - timeElapsed);

  const pointsBase = 100;
  const timeBonus = Math.floor((timeRemaining / (state.roundTimeLimit * 1000)) * 50);
  return pointsBase + timeBonus;
}

function shouldRoundEnd(state: SkribblState): boolean {
  const totalPlayers = state.scores.length;
  const nonDrawerPlayers = totalPlayers - 1;
  const correctGuessersCount = state.correctGuessers.length;

  const timeElapsed = Date.now() - state.roundStartTime;
  const timeUp = timeElapsed >= state.roundTimeLimit * 1000;

  return timeUp || correctGuessersCount >= nonDrawerPlayers;
}

function advanceGame(state: SkribblState): SkribblState {
  const newState = { ...state };

  if (state.gamePhase === 'playing') {
    newState.gamePhase = 'roundEnd';
  } else if (state.gamePhase === 'roundEnd') {
    if (state.currentRound >= state.totalRounds) {
      newState.gamePhase = 'gameEnd';
      console.log('Game ending! Final scores:', newState.scores);
    } else {
      const currentWord = state.wordList[Math.floor(Math.random() * state.wordList.length)];
      newState.currentRound += 1;
      newState.currentDrawer = (state.currentDrawer + 1) % state.scores.length;
      newState.currentWord = currentWord;
      newState.wordList = state.wordList.filter(item => item !== currentWord);
      newState.roundStartTime = Date.now();
      newState.correctGuessers = [];
      newState.gamePhase = 'playing';
    }
  }

  return newState;
}

export const skribblLogic: GameLogic<SkribblState, SkribblView> = {
  minPlayers: 2,
  maxPlayers: 8,

  start: (numPlayers: number): SkribblState => {
    const wordList = [
      // Animals
      'cat',
      'dog',
      'elephant',
      'giraffe',
      'lion',
      'tiger',
      'monkey',
      'kangaroo',
      'zebra',
      'whale',
      'octopus',
      'penguin',
      'bear',
      'rabbit',
      'snail',

      // Food & Drink
      'apple',
      'banana',
      'pizza',
      'burger',
      'fries',
      'icecream',
      'cake',
      'cookie',
      'carrot',
      'bread',
      'sushi',
      'donut',
      'cheese',
      'egg',
      'popcorn',

      // Objects
      'book',
      'chair',
      'table',
      'phone',
      'key',
      'watch',
      'glasses',
      'camera',
      'bottle',
      'backpack',
      'umbrella',
      'mirror',
      'pencil',
      'lamp',
      'toothbrush',

      // Vehicles
      'car',
      'bus',
      'bicycle',
      'motorcycle',
      'airplane',
      'train',
      'truck',
      'scooter',
      'boat',
      'submarine',
      'helicopter',
      'rocket',
      'tram',
      'skateboard',

      // Nature
      'tree',
      'flower',
      'mountain',
      'volcano',
      'cloud',
      'rain',
      'snowman',
      'sun',
      'moon',
      'river',
      'leaf',
      'island',
      'cactus',
      'iceberg',
      'ocean',

      // Places
      'school',
      'castle',
      'beach',
      'park',
      'zoo',
      'farm',
      'hospital',
      'airport',
      'stadium',
      'library',
      'museum',
      'desert',
      'forest',
      'cave',
      'village',

      // Fantasy / Interesting Concepts
      'dragon',
      'robot',
      'alien',
      'wizard',
      'witch',
      'ghost',
      'vampire',
      'zombie',
      'mermaid',
      'knight',
      'fairy',
      'dinosaur',
      'spaceship',
      'treasure',
      'pirate',
      'monster',
      'ninja',
      'genie',
      'yeti',
      'kraken',
      'phoenix',
      'minotaur',
      'mummy',
      'centaur',
      'pegasus',
      'goblin',
      'leviathan',

      // Clothing
      'hat',
      'shirt',
      'pants',
      'shoes',
      'gloves',
      'jacket',
      'socks',
      'scarf',
      'skirt',
      'belt',
      'tie',
      'helmet',
      'boots',
      'crown',

      // Fun Extras / Unexpected
      'toilet',
      'boomerang',
      'jellyfish',
      'slingshot',
      'broom',
      'shark',
      'snowball',
      'lava',
      'magnet',
      'beehive',
      'marshmallow',
      'accordion',
      'trophy',
      'cannon',
      'trapdoor',
      'bunker',
      'rollercoaster',
      'maze',
      'simmons',
      'joker',
      'steve',
    ];

    const currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    return {
      totalRounds: 3,
      roundTimeLimit: 90,
      wordList: wordList.filter(item => item !== currentWord),
      currentRound: 1,
      currentDrawer: 0,
      currentWord,
      roundStartTime: Date.now(),
      gamePhase: 'playing',
      scores: Array.from({ length: numPlayers }, () => 0),
      correctGuessers: [],
    };
  },

  update: function (state: SkribblState, movePayload, playerIndex: number): SkribblState | null {
    if (movePayload === 'next' && state.gamePhase === 'roundEnd') {
      console.log(`Player ${playerIndex} advancing to next round`);
      return advanceGame(state);
    }
    if (state.gamePhase === 'playing') {
      const timeElapsed = Date.now() - state.roundStartTime;
      const timeUp = timeElapsed >= state.roundTimeLimit * 1000;

      const totalPlayers = state.scores.length;
      const nonDrawerPlayers = totalPlayers - 1;
      const correctGuessersCount = state.correctGuessers.length;

      if (timeUp || correctGuessersCount >= nonDrawerPlayers) {
        console.log(
          'Round ending: ' + (timeUp ? 'Time is up!' : 'All players have guessed correctly!'),
        );
        return advanceGame(state);
      }
    }
    const move = zSkribblMove.safeParse(movePayload);

    if (move.error) return null;
    if (
      state.gamePhase !== 'playing' ||
      playerIndex < 0 ||
      playerIndex >= state.scores.length ||
      playerIndex === state.currentDrawer ||
      state.correctGuessers.includes(playerIndex)
    ) {
      return null;
    }

    const isCorrect = move.data.toLowerCase().trim() === state.currentWord.toLowerCase().trim();
    const newState: SkribblState = { ...state };

    if (isCorrect) {
      newState.correctGuessers = [...state.correctGuessers, playerIndex];
      newState.scores = [...state.scores];
      newState.scores[playerIndex] += calculatePoints(state);
    }

    if (shouldRoundEnd(newState)) {
      return advanceGame(newState);
    }

    return newState;
  },

  isDone: function (state: SkribblState): boolean {
    return state.gamePhase === 'gameEnd';
  },

  viewAs: function (state: SkribblState, playerIndex: number): SkribblView {
    const timeElapsed = Date.now() - state.roundStartTime;
    const timeRemaining = Math.max(
      0,
      Math.floor((state.roundTimeLimit * 1000 - timeElapsed) / 1000),
    );

    return {
      currentRound: state.currentRound,
      totalRounds: state.totalRounds,
      currentDrawer: state.currentDrawer,
      timeRemaining,
      scores: state.scores,
      gamePhase: state.gamePhase,
      myPlayerIndex: playerIndex,
      wordToGuess:
        playerIndex === state.currentDrawer || state.gamePhase !== 'playing'
          ? state.currentWord
          : undefined,
      playersGuessedCorrectly: state.scores.map((_, index) =>
        state.correctGuessers.includes(index),
      ),
    };
  },

  tagView: function (view: SkribblView): TaggedGameView {
    return { type: 'skribbl', view };
  },
};

export const skribblGameService = new GameService<SkribblState, SkribblView>(skribblLogic);
