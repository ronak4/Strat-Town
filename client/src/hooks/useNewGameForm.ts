import { GameKey } from '@strategy-town/shared';
import { ChangeEvent, FormEvent, useState } from 'react';
import useAuth from './useAuth.ts';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../services/gameService.ts';

interface GameSettings {
  playerCount: number;
  roundCount: number;
  drawingTime: number;
}

/**
 * Custom hook to manage game creation form logic
 * @throws if outside a LoginContext
 * @returns an object containing
 *  - Form value `gameKey`
 *  - Game settings `settings`
 *  - Possibly-null error message `err`
 *  - Form handlers `handleInputChange` and `handleSubmit`
 */
export default function useNewGameForm() {
  const [gameKey, setGameKey] = useState<GameKey | ''>('');
  const [settings, setSettings] = useState<GameSettings>({
    playerCount: 2,
    roundCount: 1,
    drawingTime: 90,
  });
  const [err, setErr] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setErr(null);

    // type assertion is safe because NewGame.tsx only allows selection of
    // valid game keys
    setGameKey(e.target.value as GameKey | '');
  };

  const handleSettingsChange = (key: keyof GameSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (gameKey === '') {
      setErr('Please select a game');
      return;
    }
    setErr(null);

    const payload = gameKey === 'skribbl' ? { gameKey, settings } : gameKey;

    const game = await createGame(auth, payload);
    if ('error' in game) {
      setErr(game.error);
      return;
    }
    navigate(`/game/${game._id}`);
  };

  return {
    gameKey,
    settings,
    err,
    handleInputChange,
    handleSettingsChange,
    handleSubmit,
  };
}
