import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactService = {
  send: (payload: ContactPayload) =>
    axios.post<{ message: string }>(`${API_URL}/contact`, payload),
};
