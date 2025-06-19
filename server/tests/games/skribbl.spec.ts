import { describe, it, expect, beforeEach, vi } from 'vitest';
import { skribblLogic, type SkribblState } from '../../src/games/skribbl.ts';

describe('start', () => {
  it('should create initial game state with correct number of players and wordlist size', () => {
    const numPlayers = 4;
    const state = skribblLogic.start(numPlayers);

    expect(state.scores).toHaveLength(numPlayers);
    expect(state.scores.every(score => score === 0)).toBe(true);
    expect(state.wordList.length).toBeGreaterThanOrEqual(state.totalRounds);
  });

  it('should not always select the same word from the wordlist', () => {
    const words = new Set();
    for (let i = 0; i < 10; i += 1) {
      words.add(skribblLogic.start(3).currentWord);
    }
    expect(words.size).toBeGreaterThan(1);
  });

  it('should initialize game with first round and first player as drawer', () => {
    const state = skribblLogic.start(3);

    expect(state.currentRound).toBe(1);
    expect(state.currentDrawer).toBe(0);
    expect(state.gamePhase).toBe('playing');
  });

  it('should select a word from the word list', () => {
    const state = skribblLogic.start(3);

    expect(state.currentWord).toBeDefined();
    expect(typeof state.currentWord).toBe('string');
  });

  it('should initialize with default configuration', () => {
    const state = skribblLogic.start(3);

    expect(state.totalRounds).toBe(3);
    expect(state.roundTimeLimit).toBe(90);
    expect(state.correctGuessers.length).toBe(0);
    expect(state.roundStartTime).toBeCloseTo(Date.now(), -2);
  });
});

describe('update', () => {
  let baseState: SkribblState;

  beforeEach(() => {
    baseState = skribblLogic.start(3);
    baseState.currentWord = 'cat';
  });

  it('should reject moves from the current drawer', () => {
    const result = skribblLogic.update(baseState, 'cat', 0);
    expect(result).toBe(null);
  });

  it('should reject moves when game is not in playing phase', () => {
    baseState.gamePhase = 'gameEnd';
    const result = skribblLogic.update(baseState, 'cat', 1);
    expect(result).toBe(null);
  });

  it('should reject moves from players who already guessed correctly', () => {
    baseState.correctGuessers.push(1);
    const result = skribblLogic.update(baseState, 'cat', 1);
    expect(result).toBe(null);
  });

  it('should reject moves from invalid player index', () => {
    const result1 = skribblLogic.update(baseState, 'cat', -1);
    expect(result1).toBe(null);

    const result2 = skribblLogic.update(baseState, 'cat', 200);
    expect(result2).toBe(null);
  });

  it('should handle correct guess and award points', () => {
    const result = skribblLogic.update(baseState, 'cat', 1);

    expect(result).not.toBe(null);
    expect(result!.correctGuessers.includes(1)).toBe(true);
    expect(result!.scores[1]).toBeGreaterThan(100);
  });

  it('should handle incorrect guess without awarding points', () => {
    const result = skribblLogic.update(baseState, 'dog', 1);

    expect(result).not.toBe(null);
    expect(result!.correctGuessers.includes(1)).toBe(false);
    expect(result!.scores[1]).toBe(0);
  });

  it('should be case insensitive for correct guesses', () => {
    const result = skribblLogic.update(baseState, 'CAT', 1);

    expect(result).not.toBe(null);
    expect(result!.correctGuessers.includes(1)).toBe(true);
  });

  it('should advance to next round after 5 seconds in roundEnd phase', () => {
    vi.useFakeTimers();
    baseState.gamePhase = 'roundEnd';
    baseState.currentRound = 1;
    baseState.totalRounds = 3;
    baseState.correctGuessers = [1];
    let state = skribblLogic.update(baseState, 'ignored', 1);
    expect(state).toBe(null);
    vi.advanceTimersByTime(5000);
    state = skribblLogic.update(baseState, 'next', 1);
    expect(state).not.toBe(null);
    expect(state!.gamePhase).toBe('playing');
    expect(state!.currentRound).toBe(2);
    expect(state!.currentDrawer).toBe(1);
    expect(state!.correctGuessers.length).toBe(0);
    vi.useRealTimers();
  });

  it('should end game after final round and 5 seconds', () => {
    vi.useFakeTimers();
    baseState.gamePhase = 'roundEnd';
    baseState.currentRound = 3;
    baseState.totalRounds = 3;
    baseState.correctGuessers = [1, 2];
    let state = skribblLogic.update(baseState, 'ignored', 1);
    expect(state).toBe(null);
    vi.advanceTimersByTime(5000);
    state = skribblLogic.update(baseState, 'next', 1);
    expect(state).not.toBe(null);
    expect(state!.gamePhase).toBe('gameEnd');
    vi.useRealTimers();
  });
});

describe('isDone', () => {
  it('should return false when game is in playing phase', () => {
    const state = skribblLogic.start(3);
    expect(skribblLogic.isDone(state)).toBe(false);
  });

  it('should return false when game is in roundEnd phase', () => {
    const state = skribblLogic.start(3);
    state.gamePhase = 'roundEnd';
    expect(skribblLogic.isDone(state)).toBe(false);
  });

  it('should return true when game is in gameEnd phase', () => {
    const state = skribblLogic.start(3);
    state.gamePhase = 'gameEnd';
    expect(skribblLogic.isDone(state)).toBe(true);
  });
});

describe('viewAs', () => {
  let state: SkribblState;

  beforeEach(() => {
    state = skribblLogic.start(3);
    state.currentWord = 'cat';
    state.scores = [10, 20, 30];
    state.correctGuessers.push(1);
  });

  it('should show word to current drawer', () => {
    const view = skribblLogic.viewAs(state, 0);
    expect(view.wordToGuess).toBe('cat');
  });

  it('should hide word from guessers', () => {
    const view = skribblLogic.viewAs(state, 1);
    expect(view.wordToGuess).toBeUndefined();
  });

  it('should include correct player index', () => {
    const view = skribblLogic.viewAs(state, 2);
    expect(view.myPlayerIndex).toBe(2);
  });

  it('should show which players guessed correctly', () => {
    const view = skribblLogic.viewAs(state, 0);

    expect(view.playersGuessedCorrectly).toEqual([false, true, false]);
  });

  it('should calculate timeRemaining correctly', () => {
    const view = skribblLogic.viewAs(state, 1);
    expect(typeof view.timeRemaining).toBe('number');
    expect(view.timeRemaining).toBeLessThanOrEqual(state.roundTimeLimit);
    expect(view.timeRemaining).toBeGreaterThanOrEqual(0);
  });

  it('should handle observers gracefully', () => {
    const view = skribblLogic.viewAs(state, -1);
    expect(view.myPlayerIndex).toBe(-1);
  });

  it('should include all required view properties', () => {
    const view = skribblLogic.viewAs(state, 1);

    expect(view).toHaveProperty('currentRound');
    expect(view).toHaveProperty('totalRounds');
    expect(view).toHaveProperty('currentDrawer');
    expect(view).toHaveProperty('timeRemaining');
    expect(view).toHaveProperty('scores');
    expect(view).toHaveProperty('gamePhase');
    expect(view).toHaveProperty('myPlayerIndex');
    expect(view).toHaveProperty('playersGuessedCorrectly');
  });
});

describe('tagView', () => {
  it('should add correct type tag to view', () => {
    const mockView = {
      currentRound: 1,
      totalRounds: 3,
      currentDrawer: 0,
      timeRemaining: 90,
      scores: [0, 0, 0],
      gamePhase: 'playing' as const,
      myPlayerIndex: 1,
      hasGuessedCorrectly: false,
      playersGuessedCorrectly: [false, false, false],
    };

    const taggedView = skribblLogic.tagView(mockView);

    expect(taggedView.type).toBe('skribbl');
    expect(taggedView.view).toBe(mockView);
  });
});
