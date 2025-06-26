'use client';

import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';

interface Msg {
  system: boolean;
  name?: string;
  text: string;
}

const RoomPage: React.FC = () => {
  const { query } = useRouter();
  const code = Array.isArray(query.code) ? query.code[0] : query.code;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [name, setName] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    if (!code) return;

    const storageKey = `chatName_${code}`;
    const savedName = localStorage.getItem(storageKey);
    const wsUrl = new URL(`${process.env.NEXT_PUBLIC_WS_URL}/${code}`);
    if (savedName) wsUrl.searchParams.set('name', savedName);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onmessage = (e: MessageEvent) => {
      const d = JSON.parse(e.data) as any;
      if (d.type === 'your_identity') {
        setName(d.name);
        localStorage.setItem(storageKey, d.name);
      } else if (d.type === 'history') {
        setMsgs(d.msgs.map((m: any) => ({
          system: false,
          name: m.participant_name,
          text: m.content,
        })));
      } else if (d.type === 'message') {
        setMsgs(prev => [...prev, {
          system: d.system,
          name: d.name,
          text: d.text
        }]);
      }
    };

    return () => {
      ws.close();
    };
  }, [code]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    wsRef.current?.send(JSON.stringify({ type: 'chat_message', content: input }));
    setInput('');
  };

  if (!code) {
    return <div>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Room: {code} — {name}</h2>
      <div
        style={{
          height: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '1rem'
        }}
      >
        {msgs.map((m, i) => (
          m.system
            ? <div key={i} style={{ color: '#888', fontStyle: 'italic' }}>
                {m.text}
              </div>
            : <div key={i}>
                <strong>{m.name}</strong>: {m.text}
              </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', marginTop: '1rem' }}>
        <input
          style={{ flex: 1, padding: '0.5rem' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
        />
        <button
          style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
