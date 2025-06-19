import useNewGameForm from '../hooks/useNewGameForm.ts';
import { gameNames } from '../util/consts.ts';

export default function NewGame() {
  const { gameKey, settings, handleInputChange, handleSettingsChange, err, handleSubmit } =
    useNewGameForm();

  return (
    <form className='content spacedSection' onSubmit={handleSubmit}>
      <h2>Create new game</h2>
      <div>
        <select value={gameKey} aria-label='Game selection' onChange={e => handleInputChange(e)}>
          <option value=''>— Select a game —</option>
          {Object.entries(gameNames).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {gameKey === 'skribbl' && (
        <div className='spacedSection'>
          <h3>Game Settings</h3>
          <div>
            <label htmlFor='playerCount'> Max Player Count: </label>
            <input
              id='playerCount'
              type='number'
              min='2'
              max='8'
              value={settings.playerCount}
              onChange={e => handleSettingsChange('playerCount', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor='roundCount'>Round Count: </label>
            <input
              id='roundCount'
              type='number'
              min='1'
              max='30'
              value={settings.roundCount}
              onChange={e => handleSettingsChange('roundCount', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor='drawingTime'>Drawing Time (seconds):</label>
            <input
              id='drawingTime'
              type='number'
              min='10'
              max='300'
              value={settings.drawingTime}
              onChange={e => handleSettingsChange('drawingTime', parseInt(e.target.value))}
            />
          </div>
        </div>
      )}

      {err && <p className='error-message'>{err}</p>}
      <div>
        <button className='primary narrow'>Create New Game</button>
      </div>
    </form>
  );
}
