'use client';

import { useRef, useEffect, useState, memo, useCallback } from 'react';
import { useGame, useChat } from '@/components/GameProvider';

interface ChatProps {
  frozen?: boolean;
}

export const Chat = memo(function Chat({ frozen = false }: ChatProps) {
  const { sendChatMessage, socketId } = useGame();
  const { chatHistory, players } = useChat();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const sendChatRef = useRef(sendChatMessage);
  sendChatRef.current = sendChatMessage;

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [chatHistory]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!frozen && trimmed) {
      sendChatRef.current(trimmed);
      setInput('');
    }
  }, [frozen, input]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.slice(0, 200));
  }, []);

  return (
    <div className="screen-card flex flex-col flex-1 min-h-[200px] max-h-[42dvh] lg:max-h-[340px]">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-sm font-medium">Chat</p>
        {frozen && (
          <span className="text-imposter text-xs font-semibold">Frozen — vote now!</span>
        )}
      </div>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {chatHistory.length === 0 ? (
          <p className="text-white/40 text-sm">No messages yet.</p>
        ) : (
          chatHistory.map((m, i) => {
            if (m.system || m.playerId == null) {
              return (
                <div key={`system-${m.timestamp}-${i}`} className="text-sm text-white/50 italic">
                  — {m.message}
                </div>
              );
            }
            const avatar = players.find((p) => p.id === m.playerId)?.avatar ?? '👤';
            const isMe = m.playerId === socketId;
            return (
              <div
                key={`${m.playerId}-${m.timestamp}`}
                className={`text-sm flex items-center gap-2 rounded-lg px-2 py-1 border ${
                  isMe
                    ? 'bg-primary/15 border-primary/40 ring-1 ring-primary/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <span className="text-lg flex-shrink-0">{avatar}</span>
                <span className={`${isMe ? 'text-primary' : 'text-imposter'} font-medium`}>
                  {m.name}
                  {isMe && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/25 border border-primary/40 align-middle">
                      You
                    </span>
                  )}
                  :
                </span>{' '}
                <span className="text-white/90">{m.message}</span>
              </div>
            );
          })
        )}
      </div>
      {frozen ? (
        <div className="p-3 border-t border-white/10 text-center text-white/50 text-sm">
          Chat closed. Submit your vote below.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            maxLength={200}
            className="input-field flex-1 py-2 text-sm min-w-0"
          />
          <button type="submit" className="btn-primary py-2 px-4 text-sm" disabled={!input.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
});
