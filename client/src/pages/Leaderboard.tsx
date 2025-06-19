import { useEffect, useState } from 'react';

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

interface LeaderboardUser {
  username: string;
  display: string;
  stats: UserStats;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/leaderboard')
      .then(res => res.json())
      .then(data => {
        setUsers(data as LeaderboardUser[]);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load leaderboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className='content spacedSection'>
      <h2>Leaderboard</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>#</th>
            <th style={{ textAlign: 'left' }}>Username</th>
            <th style={{ textAlign: 'left' }}>Games Played</th>
            <th style={{ textAlign: 'left' }}>Games Won</th>
            <th style={{ textAlign: 'left' }}>Win Rate (%)</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr key={user.username}>
              <td>{i + 1}</td>
              <td>{user.display || user.username}</td>
              <td>{user.stats?.gamesPlayed ?? 0}</td>
              <td>{user.stats?.gamesWon ?? 0}</td>
              <td>{((user.stats?.winRate ?? 0) * 100).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
