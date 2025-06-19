import Whiteboard from '../components/Whiteboard.tsx';
import './WhiteboardPage.css';

export default function WhiteboardPage() {
  return (
    <div className='whiteboard-page'>
      <Whiteboard gameId={''} />
    </div>
  );
}
