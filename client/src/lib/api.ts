import axios from 'axios';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:4010/api`;
  }
  return 'http://localhost:4010/api';
};

export const api = axios.create({
  baseURL: getApiUrl(),
});

export const uploadProject = async (file: File) => {
  const formData = new FormData();
  formData.append('project', file);

  const response = await api.post('/deploy/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
