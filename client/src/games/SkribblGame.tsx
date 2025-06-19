import { useState, useRef, useEffect } from 'react';
import Whiteboard from '../components/Whiteboard.tsx';
import { SafeUserInfo, SkribblMove, SkribblView } from '@strategy-town/shared';
import './SkribblGame.css';
import useLoginContext from '../hooks/useLoginContext.ts';

interface SkribblGameProps {
  view: SkribblView;
  makeMove: (move: SkribblMove) => void;
  userPlayerIndex: number;
  players: SafeUserInfo[];
  gameId: string;
}

export default function SkribblGame({
  view,
  makeMove,
  userPlayerIndex,
  players,
  gameId,
}: SkribblGameProps) {
  const { socket, user, pass } = useLoginContext();
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<
    { username: string; text: string; isCorrect: boolean; isSystem?: boolean }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(view.timeRemaining);
  const isDrawer = view.myPlayerIndex === view.currentDrawer;
  const hasGuessedCorrectly =
    view.playersGuessedCorrectly && view.playersGuessedCorrectly[userPlayerIndex];

  // Go to next round automatically after round end
  useEffect(() => {
    if (view.gamePhase === 'roundEnd') {
      socket.emit('whiteboardClear', { gameId });
      const nextRoundTimer = setTimeout(() => {
        makeMove('next');
      }, 5000);

      return () => clearTimeout(nextRoundTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.gamePhase, gameId]); // exclude makeMove from dependencies to avoid game changing state on guesses

  // Scroll the guess chat into view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll the player list into view
  useEffect(() => {
    playersRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [players]);

  // Handle time countdown
  useEffect(() => {
    if (view.gamePhase === 'playing') {
      setTime(view.timeRemaining);
      const timer = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 0) {
            clearInterval(timer);
            makeMove('time');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.gamePhase, view.timeRemaining]); // exclude makeMove from dependencies to timer incrementing on guesses

  // Handle new guesses
  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        username: players[userPlayerIndex]?.display || `Player ${userPlayerIndex + 1}`,
        text: chatMessage,
        isCorrect: false,
      },
    ]);
    if (!isDrawer && !hasGuessedCorrectly) {
      makeMove(chatMessage);
    }
    setChatMessage('');
  };

  useEffect(() => {
    if (view.gamePhase === 'gameEnd' && userPlayerIndex >= 0) {
      // Find the highest score(s)
      const maxScore = Math.max(...view.scores);
      const isWinner = view.scores[userPlayerIndex] === maxScore;
      const result = isWinner ? 'win' : 'loss';
      fetch('/api/user/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth: { username: user.username, password: pass },
          payload: { result },
        }),
      });
    }
  }, [view.gamePhase, pass, user.username, userPlayerIndex, view.scores]);

  return (
    <div className='skribbl-game'>
      <div className='game-header'>
        <h1>Skribbl Game</h1>
        <div className='game-info'>
          <p>
            Round: {view.currentRound}/{view.totalRounds}
          </p>
          <p className='timer'>Time: {time}s</p>
        </div>

        <div className='word-display'>
          {isDrawer ? (
            <p className='drawer-word'>
              Word to draw: <strong>{view.wordToGuess}</strong>
            </p>
          ) : (
            <p className='guesser-word'>Good luck guessing!</p>
          )}
        </div>
        <div className='player-status'>
          {isDrawer ? (
            <span className='status-badge'>You are drawing</span>
          ) : hasGuessedCorrectly ? (
            <span className='status-badge correct'>You guessed correctly!</span>
          ) : (
            <span className='status-badge'>Guess the word</span>
          )}
        </div>
      </div>

      <div className='game-container'>
        <div className='players-sidebar'>
          <h3>Players</h3>
          <ul className='player-list'>
            {view.scores.map((score, index) => (
              <li
                key={index}
                className={`player ${index === view.currentDrawer ? 'drawing' : ''} ${view.playersGuessedCorrectly[index] ? 'correct' : ''}`}>
                <div className='player-name'>
                  {players[index]?.display || `Player ${index + 1}`}
                  {index === userPlayerIndex && <span className='you-tag'> (You)</span>}
                </div>
                <div className='player-score'>Score: {score}</div>
                <div className='player-status'>
                  {index === view.currentDrawer && <span className='drawer-tag'>Drawing</span>}
                  {view.playersGuessedCorrectly[index] && <span className='correct-tag'>✓</span>}
                </div>
              </li>
            ))}
            <div ref={playersRef}></div>
          </ul>
        </div>

        <div className='drawing-container'>
          {<Whiteboard readonly={!isDrawer || view.gamePhase !== 'playing'} gameId={gameId} />}

          {view.gamePhase === 'roundEnd' && (
            <div className='round-end-overlay'>
              <h2>Round ended!</h2>
              <p>
                The word was: <strong>{view.wordToGuess}</strong>
              </p>
            </div>
          )}

          {view.gamePhase === 'gameEnd' && (
            <div className='game-end-overlay'>
              <h2>Game Over!</h2>
              <h3>Final Scores:</h3>
              <ul className='final-scores'>
                {[...view.scores]
                  .map((score, idx) => ({ score, player: idx }))
                  .sort((a, b) => b.score - a.score)
                  .map(({ score, player }) => (
                    <li key={player}>
                      {players[player]?.display || `Player ${player + 1}`}: {score} points
                      {player === userPlayerIndex && ' (You)'}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div className='chat-area'>
          <h3>{isDrawer ? null : 'Guess the word'}</h3>
          <div className='messages'>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${msg.isCorrect ? 'correct' : ''} ${msg.isSystem ? 'system' : ''}`}>
                <b>{msg.username}:</b> {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          <form onSubmit={handleSubmitGuess}>
            <input
              type='text'
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              placeholder={
                isDrawer
                  ? "Can't guess while drawing"
                  : hasGuessedCorrectly
                    ? 'You guessed correctly!'
                    : 'Type your guess...'
              }
              disabled={isDrawer || hasGuessedCorrectly}
            />
            {!isDrawer && (
              <button
                type='submit'
                disabled={hasGuessedCorrectly}
                className={hasGuessedCorrectly ? 'disabled-button' : ''}>
                {hasGuessedCorrectly ? 'You got it!' : 'Send'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
