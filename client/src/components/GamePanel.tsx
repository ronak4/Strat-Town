import './GamePanel.css';
import { GameInfo } from '@strategy-town/shared';
import { gameNames } from '../util/consts.ts';
import useLoginContext from '../hooks/useLoginContext.ts';
import dayjs from 'dayjs';
import GameDispatch from '../games/GameDispatch.tsx';
import useSocketsForGame from '../hooks/useSocketsForGame.ts';
import { useRef, useEffect } from 'react';

/**
 * A game panel allows viewing the status and players of a live game
 */
export default function GamePanel({
  _id,
  type,
  players: initialPlayers,
  createdAt,
  minPlayers,
  settings,
}: GameInfo) {
  const { user } = useLoginContext();

  const { view, players, userPlayerIndex, hasWatched, joinGame, startGame } = useSocketsForGame(
    _id,
    initialPlayers,
  );
  const playerRosterRef = useRef<HTMLDivElement>(null);

  // make the list of people joining scroll
  useEffect(() => {
    playerRosterRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [players]);

  const playerCount = settings.playerCount ?? Infinity;

  return hasWatched ? (
    <div className='gamePanel'>
      <div className='gameRoster'>
        <h2>{gameNames[type]}</h2>
        <div className='smallAndGray'>Game room created {dayjs(createdAt).fromNow()}</div>
        <div className='buttonsContainer'>
          {userPlayerIndex < 0 && !view && (
            <button className='primary narrow' onClick={joinGame}>
              Join Game
            </button>
          )}
          {userPlayerIndex === 0 && !view && players.length >= minPlayers && (
            <button className='primary narrow' onClick={startGame}>
              Start Game
            </button>
          )}
        </div>
        <div className='dottedList'>
          {players.map((player, index) => (
            <div className='dottedListItem' key={player.username}>
              {player.username === user.username
                ? `you are player #${index + 1}`
                : `Player #${index + 1} is ${player.display}`}
            </div>
          ))}
          <div ref={playerRosterRef}></div>
        </div>
        {
          // If the game hasn't started and user hasn't joined, they can join
          userPlayerIndex < 0 && !view && players.length < playerCount && (
            <button className='primary narrow' onClick={joinGame}>
              Join Game
            </button>
          )
        }
        {
          // If the game hasn't started and the user is the host (player 1), they can start the game if a minimum number of players are present
          userPlayerIndex === 0 && !view && players.length >= minPlayers && (
            <button className='primary narrow' onClick={startGame}>
              Start Game
            </button>
          )
        }
      </div>
      {view ? (
        <div className='gameFrame'>
          <GameDispatch
            gameId={_id}
            userPlayerIndex={userPlayerIndex}
            players={players}
            view={view}
          />
        </div>
      ) : (
        <div className='gameFrame waiting content'>waiting for game to begin</div>
      )}
    </div>
  ) : (
    <div></div>
  );
}
