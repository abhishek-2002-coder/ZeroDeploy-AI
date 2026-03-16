import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:4010`;
  }
  return 'http://localhost:4010';
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
});
