import { useState } from 'react';
import { SafeUserInfo } from '@strategy-town/shared';
import './UserHoverCard.css';

interface UserHoverCardProps {
  user: SafeUserInfo;
}

export default function UserHoverCard({ user }: UserHoverCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className='user-hover-container'>
      <span
        className='username-hover-trigger'
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}>
        {user.display}
      </span>

      {isVisible && (
        <div className='user-hover-card'>
          <div className='user-hover-header'>
            <img
              src={user.image_url || '/default-profile.png'}
              alt={`${user.display}'s profile`}
              className='user-hover-avatar'
            />
            <div className='user-hover-info'>
              <h4 className='user-hover-display'>{user.display}</h4>
              <p className='user-hover-username'>@{user.username}</p>
            </div>
          </div>

          {user.bio.length > 0 && (
            <div className='user-hover-bio'>
              <p>{user.bio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
