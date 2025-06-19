import { useState, useEffect } from 'react';
import type { SafeUserInfo } from '@strategy-town/shared';
import { searchUsers } from '../services/userService.ts';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (username: string) => void;
  currentUser: string;
}

export default function UsernameAutocomplete({ value, onChange, onSelect, currentUser }: Props) {
  const [results, setResults] = useState<SafeUserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const filteredResults = results.filter(
    u => u.username.toLowerCase() !== currentUser.toLowerCase(),
  );
  const suggestions =
    filteredResults.length === 1 &&
    filteredResults[0].username.toLowerCase() === value.toLowerCase()
      ? []
      : filteredResults;

  useEffect(() => {
    if (value.length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      setLoading(true);
      searchUsers(value).then(res => {
        if (!('error' in res)) {
          setResults(res);
        }
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <div className='autocomplete-container'>
      <input
        type='text'
        placeholder='Username'
        value={value}
        onChange={e => onChange(e.target.value)}
        className='w-full mb-2 p-1 border rounded'
      />
      {loading && <div className='autocomplete-loading'>Loading…</div>}
      {suggestions.length > 0 && (
        <ul className='autocomplete-list'>
          {suggestions.map(u => (
            <li key={u.username} onClick={() => onSelect(u.username)} className='autocomplete-item'>
              {u.username}
            </li>
          ))}
        </ul>
      )}

      {!loading && value.length >= 2 && results.length === 0 && (
        <div className='autocomplete-no-match'>User doesn’t exist</div>
      )}
    </div>
  );
}
