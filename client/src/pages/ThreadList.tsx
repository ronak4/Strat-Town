import { useNavigate } from 'react-router-dom';
import ThreadSummaryView from '../components/ThreadSummaryView.tsx';
import useThreadList from '../hooks/useThreadList.ts';

export default function ThreadList() {
  const threadList = useThreadList();
  const navigate = useNavigate();

  return (
    <div className='content'>
      <div className='spacedSection'>
        <h2>All forum posts</h2>
        <div>
          <button
            data-focus-group='main'
            className='primary narrow'
            onClick={() => navigate('/forum/post/new')}>
            Create New Post
          </button>
        </div>
        <>
          {'message' in threadList ? (
            threadList.message
          ) : (
            <div className='dottedForumList'>
              {threadList.map(thread => (
                <ThreadSummaryView {...thread} key={thread._id.toString()} />
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
