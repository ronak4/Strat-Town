import useLoginContext from '../hooks/useLoginContext.ts';
import './Header.css';
import { useNavigate } from 'react-router-dom';

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { user, reset } = useLoginContext();
  const navigate = useNavigate();

  return (
    <div id='header' className='header'>
      <div className='title'>Strategy Town!</div>
      signed in as {user.display}
      <button
        data-focus-group='main'
        className='narrowcenter secondary'
        onClick={() => {
          reset();
          navigate('/login');
        }}>
        Log Out
      </button>
      <button
        data-focus-group='main'
        className='narrowcenter secondary'
        onClick={() => navigate(`/profile/${user.username}`)}>
        View Profile
      </button>
    </div>
  );
}
