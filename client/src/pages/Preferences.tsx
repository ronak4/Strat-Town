import useEditPreferencesForm from '../hooks/useEditPreferencesForm.ts';
import { THEME_OPTIONS, FONT_FAMILY_OPTIONS } from '@strategy-town/shared';

export default function Preferences() {
  const {
    colorblind,
    setColorblind,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    err,
    handleSubmit,
    handleReset,
  } = useEditPreferencesForm();

  return (
    <form className='content spacedSection' onSubmit={handleSubmit}>
      <h2>UI Preferences</h2>

      <div data-focus-group='main' className='spacedSection'>
        <h3>Theme</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <select
            className='widefill notTooWide'
            value={theme}
            onChange={e => setTheme(e.target.value as typeof theme)}>
            {THEME_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className='smallAndGray'>
          {/* TODO: add theme preview or description here */}
          Themes affect colors and overall appearance
        </div>
      </div>

      <hr />

      <div data-focus-group='main' className='spacedSection'>
        <h3>Colorblind Filter</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <select
            className='widefill notTooWide'
            value={colorblind}
            onChange={e =>
              setColorblind(e.target.value as 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia')
            }>
            <option value='none'>None</option>
            <option value='deuteranopia'>Deuteranopia</option>
            <option value='protanopia'>Protanopia</option>
            <option value='tritanopia'>Tritanopia</option>
          </select>
        </div>
      </div>

      <hr />

      <div data-focus-group='main' className='spacedSection'>
        <h3>Font Family</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <select
            className='widefill notTooWide'
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value as typeof fontFamily)}>
            {FONT_FAMILY_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === 'default'
                  ? 'Default'
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily:
              fontFamily === 'arial'
                ? 'Arial, sans-serif'
                : fontFamily === 'comic'
                  ? "'Comic Sans MS', 'Comic Sans', cursive, sans-serif"
                  : fontFamily === 'times'
                    ? "'Times New Roman', Times, serif"
                    : 'inherit',
          }}>
          The quick brown fox jumps over the lazy dog.
        </div>
        <div className='smallAndGray'>Changes the font used throughout the site</div>
      </div>

      <hr />

      <div data-focus-group='main' className='spacedSection'>
        <h3>Font Size</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <select
            className='widefill notTooWide'
            value={fontSize}
            onChange={e => setFontSize(e.target.value as 'S' | 'M' | 'L')}>
            <option value='S'>Small</option>
            <option value='M'>Medium</option>
            <option value='L'>Large</option>
          </select>
        </div>
      </div>

      <hr />

      {err && <p className='error-message'>{err}</p>}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button data-focus-group='main' className='primary narrow'>
          Submit
        </button>
        <button
          data-focus-group='main'
          type='button'
          className='secondary narrow'
          onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className='smallAndGray'>After updating your preferences, you will be logged out</div>
    </form>
  );
}
