import './MessageList.css';
import dayjs from 'dayjs';
import useLoginContext from '../hooks/useLoginContext.ts';
import { ChatMessage } from '../util/types.ts';
import { useEffect, useRef } from 'react';
import UserHoverCard from './UserHoverCard.tsx';

interface MessageListProps {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
  const { user } = useLoginContext();
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatWindowRef.current) return;
    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className='chatWindow' ref={chatWindowRef}>
      <div className='chatScroller'>
        {messages.map(message => {
          if ('meta' in message) {
            return (
              <div key={message._id} className='chatMeta'>
                {user.username === message.user.username ? (
                  'you'
                ) : (
                  <UserHoverCard user={message.user} />
                )}{' '}
                {message.meta}
                {' chat '}
                {dayjs(message.dateTime).fromNow()}
              </div>
            );
          }
          if (user.username === message.createdBy.username) {
            return (
              <div key={message._id} className='chatMe'>
                <div className='chatSender'>You {dayjs(message.createdAt).fromNow()}</div>
                <div className='chatContent'>{message.text}</div>
              </div>
            );
          }
          return (
            <div key={message._id} className='chatOther'>
              <div className='chatSender'>
                <UserHoverCard user={message.createdBy} /> {dayjs(message.createdAt).fromNow()}
              </div>
              <div className='chatContent'>{message.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
