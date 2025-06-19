import { SafeUserInfo, TaggedGameView } from '@strategy-town/shared';
import NimGame from './NimGame.tsx';
import GuessGame from './GuessGame.tsx';
import { JSX } from 'react';
import useLoginContext from '../hooks/useLoginContext.ts';
import useAuth from '../hooks/useAuth.ts';
import SkribblGame from './SkribblGame.tsx';

interface GameDispatchProps {
  userPlayerIndex: number;
  players: SafeUserInfo[];
  gameId: string;
  view: TaggedGameView;
}

export default function GameDispatch({
  userPlayerIndex,
  gameId,
  players,
  view,
}: GameDispatchProps): JSX.Element {
  const { socket } = useLoginContext();
  const auth = useAuth();

  function makeMove(move: unknown) {
    socket.emit('gameMakeMove', { auth, payload: { gameId, move } });
  }

  const childProps = { userPlayerIndex, players, makeMove };
  switch (view.type) {
    case 'nim':
      return <NimGame {...{ ...childProps, view: view.view }} />;
    case 'guess':
      return <GuessGame {...{ ...childProps, view: view.view }} />;
    case 'skribbl':
      return <SkribblGame {...{ ...childProps, view: view.view }} gameId={gameId} />;
  }
}
