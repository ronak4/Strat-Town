import { useNavigate } from 'react-router-dom';
import GameSummaryView from '../components/GameSummaryView.tsx';
import useGameList from '../hooks/useGameList.ts';

export default function GameList() {
  const gameList = useGameList();
  const navigate = useNavigate();

  return (
    <div className='content'>
      <div className='spacedSection'>
        <h2>All games</h2>
        <div>
          <button
            data-focus-group='main'
            className='primary narrow'
            onClick={() => navigate('/game/new')}>
            Create New Game
          </button>
        </div>
        <>
          {'message' in gameList ? (
            gameList.message
          ) : (
            <div className='dottedGameList'>
              {gameList.map(game => (
                <GameSummaryView {...game} key={game._id.toString()} />
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
