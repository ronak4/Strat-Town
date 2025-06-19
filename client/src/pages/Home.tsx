import useThreadList from '../hooks/useThreadList.ts';
import ThreadSummaryView from '../components/ThreadSummaryView.tsx';
import { useNavigate } from 'react-router-dom';
import useGameList from '../hooks/useGameList.ts';
import GameSummaryView from '../components/GameSummaryView.tsx';

export default function Home() {
  const threadList = useThreadList(4);
  const gameList = useGameList(4);
  const navigate = useNavigate();

  return (
    <div className='content'>
      <div className='spacedSection'>
        <h2>Recent games</h2>
        {'message' in gameList ? (
          <div>{gameList.message}</div>
        ) : (
          <div id='gameList' className='dottedGameList'>
            {gameList.map(game => (
              <GameSummaryView {...game} key={game._id.toString()} />
            ))}
          </div>
        )}
        <div>
          <button
            data-focus-group='main'
            className='primary narrow'
            onClick={() => navigate('/game/new')}>
            Create New Game
          </button>
        </div>
      </div>
      <div className='spacedSection'>
        <h2>Recent forum posts</h2>
        {'message' in threadList ? (
          <div>{threadList.message}</div>
        ) : (
          <div id='threadList' className='dottedThreadList'>
            {threadList.map(thread => (
              <ThreadSummaryView {...thread} key={thread._id.toString()} />
            ))}
          </div>
        )}
        <div>
          <button
            data-focus-group='main'
            className='primary narrow'
            onClick={() => navigate('/forum/post/new')}>
            Create New Post
          </button>
        </div>
      </div>
    </div>
  );
}
