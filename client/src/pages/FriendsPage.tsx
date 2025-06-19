import './FriendsPage.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import useLoginContext from '../hooks/useLoginContext.ts';
import useAuth from '../hooks/useAuth.ts';
import {
  getAllFriends,
  respondToFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from '../services/friendService.ts';
import type { FriendInfo, FriendsListResponse } from '@strategy-town/shared/src/friend.types';
import ChatPanel from '../components/ChatPanel.tsx';
import { createChat } from '../services/chatService.ts';
import UsernameAutocomplete from '../components/UsernameAutocomplete.tsx';

type Tab = 'existing' | 'pending';

export default function FriendsPage() {
  const { user } = useLoginContext();
  const auth = useAuth();

  const [tab, setTab] = useState<Tab>('existing');
  const [accepted, setAccepted] = useState<FriendInfo[]>([]);
  const [pending, setPending] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  // DM
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatWith, setChatWith] = useState<string>('');

  // Add‐friend
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string>();

  // Unfriend confirmation
  const [confirmUnfriendId, setConfirmUnfriendId] = useState<string | null>(null);
  const [confirmUnfriendName, setConfirmUnfriendName] = useState<string>('');
  const [unfriendLoading, setUnfriendLoading] = useState(false);

  // Fetch on mount or when tab changes
  useEffect(() => {
    setError(undefined);
    setLoading(true);
    getAllFriends(user.username)
      .then((list: FriendsListResponse) => {
        setAccepted(list.accepted);
        setPending(list.pending);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : 'An unexpected error occurred';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [tab, user.username]);

  const sent = pending.filter(p => p.requester.username === user.username);
  const received = pending.filter(p => p.addressee.username === user.username);

  // Handlers
  const handleAccept = async (id: string) => {
    await respondToFriendRequest(auth, id, 'accept');
    setPending(p => p.filter(x => x._id !== id));
    setAccepted(a => [...a, received.find(r => r._id === id)!]);
  };
  const handleReject = async (id: string) => {
    await respondToFriendRequest(auth, id, 'reject');
    setPending(p => p.filter(x => x._id !== id));
  };

  if (chatId) {
    return (
      <div className='p-4 h-full flex flex-col'>
        <button className='btn btn-secondary mb-4 self-start' onClick={() => setChatId(null)}>
          ← Back to Friends
        </button>
        <h2 className='content spacedSection'>Chat with {chatWith}</h2>
        <div className='flex-1'>
          <ChatPanel chatId={chatId} />
        </div>
      </div>
    );
  }

  return (
    <div className='content spaceSection'>
      <h2>Friends</h2>

      {/* Header: Tabs + Add Friend */}
      <div className='friends-header'>
        <div className='tabs'>
          <button onClick={() => setTab('existing')} className={tab === 'existing' ? 'active' : ''}>
            Existing
          </button>
          <button onClick={() => setTab('pending')} className={tab === 'pending' ? 'active' : ''}>
            Pending
          </button>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setNewFriendUsername('');
            setAddError(undefined);
          }}
          className='btn btn-primary add-friend-btn'>
          + Add Friend
        </button>
      </div>
      <div className='friends-header-separator' />

      {/* Add Friend */}
      {showAddModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h2 className='text-lg mb-2'>Send Friend Request</h2>
            <UsernameAutocomplete
              value={newFriendUsername}
              onChange={setNewFriendUsername}
              onSelect={username => {
                setNewFriendUsername(username);
                setAddError(undefined);
              }}
              currentUser={user.username}
            />
            {addError && <p className='add-error'>{addError}</p>}
            <div className='modal-actions'>
              <button
                onClick={() => setShowAddModal(false)}
                className='btn btn-secondary'
                disabled={addLoading}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  setAddError(undefined);
                  setAddLoading(true);
                  try {
                    const result = await sendFriendRequest(auth, newFriendUsername.trim());
                    if (!result) {
                      setAddError('Request failed or already exists');
                    } else {
                      setPending(p => [...p, result]);
                      setShowAddModal(false);
                    }
                  } catch (err: unknown) {
                    if (axios.isAxiosError(err)) {
                      if (err.response?.status === 404) {
                        setAddError('User not found');
                      } else if (err.response?.status === 409) {
                        setAddError('Friend Request already sent or received');
                      } else {
                        setAddError(err.message || 'An unexpected error occurred');
                      }
                    } else {
                      setAddError('An unexpected error occurred');
                    }
                  } finally {
                    setAddLoading(false);
                  }
                }}
                className='btn btn-primary'
                disabled={addLoading || !newFriendUsername.trim()}>
                {addLoading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unfriend Confirmation */}
      {confirmUnfriendId && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h2>Confirm Unfriend</h2>
            <p>
              Are you sure you want to unfriend <strong>{confirmUnfriendName}</strong>?
            </p>
            <div className='modal-actions'>
              <button
                className='btn btn-secondary'
                onClick={() => setConfirmUnfriendId(null)}
                disabled={unfriendLoading}>
                Cancel
              </button>
              <button
                className='btn btn-danger'
                onClick={async () => {
                  setUnfriendLoading(true);
                  try {
                    await removeFriendship(auth, confirmUnfriendId);
                    setAccepted(a => a.filter(x => x._id !== confirmUnfriendId));
                  } finally {
                    setUnfriendLoading(false);
                    setConfirmUnfriendId(null);
                  }
                }}
                disabled={unfriendLoading}>
                {unfriendLoading ? 'Removing…' : 'Unfriend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Loading…</p>}
      {error && <p className='text-red-600'>Error: {error}</p>}

      {/* Existing friends */}
      {tab === 'existing' &&
        !loading &&
        (accepted.length ? (
          <ul className='friends-list list-none p-0'>
            {accepted.map(f => {
              const name =
                f.requester.username === user.username
                  ? f.addressee.username
                  : f.requester.username;
              return (
                <li key={f._id} className='friends-list-item py-3'>
                  <span>{name}</span>

                  {/* DM + Unfriend buttons */}
                  <div className='friend-actions'>
                    <button
                      className='btn btn-dm'
                      onClick={async () => {
                        try {
                          // Dm
                          const chat = await createChat(auth, [user.username, name]);
                          setChatWith(name);
                          setChatId(chat._id);
                        } catch (e) {
                          setError('Failed to start DM');
                        }
                      }}>
                      DM
                    </button>
                    <button
                      className='btn btn-danger'
                      onClick={() => {
                        setConfirmUnfriendId(f._id);
                        setConfirmUnfriendName(name);
                      }}>
                      Unfriend
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>You have no friends yet.</p>
        ))}

      {/* Pending requests */}
      {tab === 'pending' && !loading && (
        <>
          <section className='mb-6'>
            <h2 className='text-xl mb-2'>Received</h2>
            {received.length ? (
              <ul className='list-none p-0'>
                {received.map(r => (
                  <li key={r._id} className='friends-list-item py-3'>
                    <span>{r.requester.username}</span>
                    <div className='friend-actions'>
                      <button onClick={() => handleAccept(r._id)} className='btn btn-primary'>
                        Accept
                      </button>
                      <button onClick={() => handleReject(r._id)} className='btn btn-danger'>
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No incoming requests.</p>
            )}
          </section>

          <section>
            <h2 className='text-xl mb-2'>Sent</h2>
            {sent.length ? (
              <ul className='list-none p-0'>
                {sent.map(r => (
                  <li key={r._id} className='flex items-center justify-between py-3'>
                    <span>{r.addressee.username}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No outgoing requests.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
