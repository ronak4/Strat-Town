import { JSX, useEffect, useMemo } from 'react';
import { AuthContext, LoginContext } from '../contexts/LoginContext.ts';
import { StrategySocket } from '../util/types.ts';
import { Navigate } from 'react-router-dom';

interface LoggedInRouteParams {
  auth: AuthContext | null;
  socket: StrategySocket | null;
  children: JSX.Element;
}

/**
 * Ensures that, if we're not in an appropriately-initialized logged-in
 * context with auth and socket both non-null, we will navigate to `/login`.
 *
 * This setup assumes that socket will be non-null by the time auth becomes
 * non-null. This could cause unexpected behavior if the socket is unable
 * to initialize correctly. If socket is null when auth becomes non-null, we
 * will navigate back to the login page, even though the user will have just,
 * from their perspective, logged in.
 */
export default function LoggedInRoute({ auth, socket, children }: LoggedInRouteParams) {
  // This use of `useMemo` is critical, because there are there are other
  // places in the app where `context` appears as part of a dependency array
  // (notably in `useAuth`). If we don't use `useMemo` here, those dependency
  // arrays will change every time the app updates.
  const context = useMemo(() => (auth && socket ? { ...auth, socket } : null), [auth, socket]);

  useEffect(() => {
    if (!context) {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-font-size', 'M');
      document.documentElement.setAttribute('data-font-family', 'default');
      document.documentElement.style.filter = 'none';
    }
  }, [context]);

  return context ? (
    <LoginContext.Provider value={context}>{children}</LoginContext.Provider>
  ) : (
    <Navigate to='/login' />
  );
}
