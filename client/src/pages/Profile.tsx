import { useEffect, useState } from 'react';
import useLoginContext from '../hooks/useLoginContext.ts';
import dayjs from 'dayjs';
import useEditProfileForm from '../hooks/useEditProfileForm.ts';

export default function Profile() {
  const { user: contextUser } = useLoginContext();
  const [now] = useState(new Date());
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState(contextUser);

  const {
    display,
    setDisplay,
    password,
    setPassword,
    confirm,
    setConfirm,
    err,
    handleSubmit,
    bio,
    setBio,
    displayImageUrl,
    selectedFile,
    uploading,
    handleFileSelect,
    resetImageUrl,
    fileInputRef,
  } = useEditProfileForm();

  useEffect(() => {
    fetch(`/api/user/${contextUser.username}`)
      .then(res => res.json())
      .then(data => setUser(data as typeof contextUser))
      .catch(() => {});
  }, [contextUser.username]);

  return (
    <form className='content spacedSection' onSubmit={handleSubmit}>
      <h2>Profile</h2>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {dayjs(user.createdAt).from(now)}</li>
        </ul>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Game Stats</h3>
        <ul>
          <li>Games Played: {user.stats?.gamesPlayed ?? 0}</li>
          <li>Games Won: {user.stats?.gamesWon ?? 0}</li>
          <li>
            Win Rate:{' '}
            {user.stats?.gamesPlayed
              ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
              : 0}
            %
          </li>
        </ul>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Profile Picture</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt='Profile'
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #ccc',
                }}
              />
            ) : (
              <img
                src='/default-profile.png'
                alt='Default Profile'
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #ccc',
                  opacity: 0.7,
                }}
              />
            )}
            <div>
              {selectedFile ? (
                <p style={{ color: '#666', fontSize: '0.9em', margin: 0 }}>
                  New image selected - will be uploaded when you submit
                </p>
              ) : displayImageUrl !== contextUser.image_url && displayImageUrl ? (
                <p style={{ color: '#666', fontSize: '0.9em', margin: 0 }}>
                  New image selected - will be saved when you submit
                </p>
              ) : null}
            </div>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              data-focus-group='main'
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ flex: 1 }}
            />

            {uploading ? (
              <span style={{ color: '#666' }}>Uploading...</span>
            ) : selectedFile ? (
              <span style={{ color: '#28a745', fontSize: '0.9em' }}>✓ Ready to upload</span>
            ) : null}

            <button
              data-focus-group='main'
              className='secondary narrow'
              onClick={e => {
                e.preventDefault();
                resetImageUrl();
              }}>
              Reset
            </button>
          </div>
        </div>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Display name</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <input
            data-focus-group='main'
            className='widefill notTooWide'
            value={display}
            onChange={e => setDisplay(e.target.value)}
          />
          <button
            data-focus-group='main'
            className='secondary narrow'
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setDisplay(contextUser.display);
            }}>
            Reset
          </button>
        </div>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Bio</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            className='widefill notTooWide'
            placeholder='Tell other players about yourself...'
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <div className='smallAndGray' style={{ alignSelf: 'flex-start' }}>
            {bio.length}/500 characters
          </div>
          <button
            className='secondary narrow'
            style={{ alignSelf: 'flex-start' }}
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setBio(user.bio);
            }}>
            Reset
          </button>
        </div>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Reset password</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <input
            data-focus-group='main'
            type={showPass ? 'input' : 'password'}
            className='widefill notTooWide'
            placeholder='New password'
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            data-focus-group='main'
            className='secondary narrow'
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setPassword('');
              setConfirm('');
            }}>
            Reset
          </button>
          <button
            data-focus-group='main'
            className='secondary narrow'
            aria-label='Toggle show password'
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setShowPass(v => !v);
            }}>
            {showPass ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <input
            data-focus-group='main'
            type={showPass ? 'input' : 'password'}
            className='widefill notTooWide'
            placeholder='Confirm new password'
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>
      </div>
      <hr />
      {err && <p className='error-message'>{err}</p>}
      <div>
        <button data-focus-group='main' className='primary narrow' disabled={uploading}>
          {uploading ? 'Uploading...' : 'Submit'}
        </button>
      </div>
      <div className='smallAndGray'>After updating your profile, you will be logged out</div>
    </form>
  );
}
