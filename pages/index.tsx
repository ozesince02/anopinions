'use client';

import { useRouter } from 'next/router';
import React from 'react';

const Home: React.FC = () => {
  const router = useRouter();

  const createRoom = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/`, {
      method: 'POST',
    });
    const { code } = await res.json() as { code: string };
    router.push(`/room/${code}`);
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1>Anonymous Chat</h1>
      <button
        onClick={createRoom}
        style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
      >
        Create New Room
      </button>
    </div>
  );
};

export default Home;
