/* eslint no-console: "off" */

import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login.tsx';
import { AuthContext } from './contexts/LoginContext.ts';
import Layout from './components/Layout.tsx';
import Home from './pages/Home.tsx';
import ThreadList from './pages/ThreadList.tsx';
import Profile from './pages/Profile.tsx';
import { io } from 'socket.io-client';
import { StrategySocket } from './util/types.ts';
import LoggedInRoute from './components/LoggedInRoute.tsx';
import NewGame from './pages/NewGame.tsx';
import Game from './pages/Game.tsx';
import GameList from './pages/GameList.tsx';
import ThreadPage from './pages/ThreadPage.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import fallback from './fallback.tsx';
import NewThread from './pages/NewThread.tsx';
import { ApplyPreferences } from './components/ChangingPreferences.tsx';
import Preferences from './pages/Preferences.tsx';
import useLoginContext from './hooks/useLoginContext.ts';
import FriendsPage from './pages/FriendsPage.tsx';
import Leaderboard from './pages/Leaderboard.tsx';

/** If `true`, all incoming socket messages will be logged */
const DEBUG_SOCKETS = false;

function findNextFocusable(current: HTMLElement, key: string): HTMLElement | null {
  function getFocusableInGroup(groupName: string): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>(`[data-focus-group="${groupName}"]:not([disabled])`),
    );
  }

  function getCurrentGroup(el: HTMLElement): string | null {
    return el.getAttribute('data-focus-group');
  }

  const currentGroup = getCurrentGroup(current);
  if (!currentGroup) return null;

  const sidebarItems = getFocusableInGroup('sidebar');
  const mainItems = getFocusableInGroup('main');

  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const groupList = currentGroup === 'sidebar' ? sidebarItems : mainItems;
    const idx = groupList.findIndex(el => el === current);
    if (idx === -1) return null;

    let nextIdx = idx;
    if (key === 'ArrowDown') nextIdx = idx + 1;
    if (key === 'ArrowUp') nextIdx = idx - 1;

    if (nextIdx < 0) nextIdx = groupList.length - 1;
    if (nextIdx >= groupList.length) nextIdx = 0;

    return groupList[nextIdx] || null;
  }

  if (key === 'ArrowRight' && currentGroup === 'sidebar') {
    return mainItems.length > 0 ? mainItems[0] : null;
  }

  if (key === 'ArrowLeft' && currentGroup === 'main') {
    return sidebarItems.length > 0 ? sidebarItems[sidebarItems.length - 1] : null;
  }

  return null;
}

function NoSuchRoute() {
  const { pathname } = useLocation();
  return `No page found for route '${pathname}'`;
}

function ShortcutHandler() {
  const navigate = useNavigate();
  const { user } = useLoginContext();
  const username = user.username;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Only react if command (mac) or ctrl (windows) is pressed, without Shift/Alt.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'g':
            e.preventDefault();
            navigate('/games');
            break;
          case 'f':
            e.preventDefault();
            navigate('/forum');
            break;
          case 'i':
            e.preventDefault();
            navigate(`/profile/${username}`);
            break;
          case 'l':
            e.preventDefault();
            navigate(`/login`);
            break;
          case 'h':
            e.preventDefault();
            navigate(`/`);
            break;
          case 'e':
            e.preventDefault();
            navigate(`/preferences`);
            break;
          case 'z':
            e.preventDefault();
            navigate(-1);
            break;
          default:
            return;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate, username]);

  return null;
}

export default function App() {
  const [socket, setSocket] = useState<StrategySocket | null>(null);
  const [auth, setAuth] = useState<AuthContext | null>(null);

  useEffect(() => {
    const newSocket: StrategySocket = io();
    setSocket(newSocket);
    if (DEBUG_SOCKETS) {
      newSocket.onAny((tag, payload) => {
        console.log(`from socket got ${tag}(${JSON.stringify(payload)})`);
      });
    }
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      // 1. Identify current focus
      const current = document.activeElement as HTMLElement | null;
      if (!current) return;
      // 2. Call a helper to find the next element (e.g. getNextInSidebar(current) or getNextInMain(current))
      const next = findNextFocusable(current, e.key);
      if (next) {
        e.preventDefault();
        next.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    socket && (
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login setAuth={auth => setAuth(auth)} />} />
          <Route
            element={
              <LoggedInRoute auth={auth} socket={socket}>
                <>
                  <ShortcutHandler />
                  <ApplyPreferences>
                    <ErrorBoundary fallbackRender={fallback}>
                      <Layout />
                    </ErrorBoundary>
                  </ApplyPreferences>
                </>
              </LoggedInRoute>
            }>
            <Route path='/' element={<Home />} />
            <Route path='/forum' element={<ThreadList />} />
            <Route path='/forum/post/new' element={<NewThread />} />
            <Route path='/forum/post/:threadId' element={<ThreadPage />} />
            <Route path='/games' element={<GameList />} />
            <Route path='/leaderboard' element={<Leaderboard />} />
            <Route path='/friends' element={<FriendsPage />} />
            <Route path='/game/new' element={<NewGame />} />
            <Route path='/game/:gameId' element={<Game />} />
            <Route path='/profile/:username' element={<Profile />} />
            <Route path='/preferences' element={<Preferences />} />
            <Route path='/*' element={<NoSuchRoute />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )
  );
}
