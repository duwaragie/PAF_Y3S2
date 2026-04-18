import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { NotificationDTO } from '@/services/notificationService';

/**
 * Single STOMP connection shared across the whole app. Subscribers register
 * a callback; the module owns reconnect + token refresh.
 *
 * Auth: the JWT goes in the STOMP CONNECT frame's "Authorization" header.
 * Server's StompAuthChannelInterceptor reads it and attaches the principal.
 */

type Listener = (n: NotificationDTO) => void;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL = API_URL.replace(/\/api\/?$/, '') + '/ws';

let client: Client | null = null;
let currentToken: string | null = null;
const listeners = new Set<Listener>();

function buildClient(token: string): Client {
  return new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client?.subscribe('/user/queue/notifications', (msg: IMessage) => {
        try {
          const parsed = JSON.parse(msg.body) as NotificationDTO;
          listeners.forEach((l) => {
            try { l(parsed); } catch { /* swallow per-listener errors */ }
          });
        } catch {
          /* ignore malformed frames */
        }
      });
    },
  });
}

export const notificationSocket = {
  connect(token: string) {
    if (!token) return;
    if (client && currentToken === token && client.active) return;
    // Token changed or not connected — rebuild
    if (client) {
      try { client.deactivate(); } catch { /* ignore */ }
    }
    currentToken = token;
    client = buildClient(token);
    client.activate();
  },

  disconnect() {
    if (client) {
      try { client.deactivate(); } catch { /* ignore */ }
    }
    client = null;
    currentToken = null;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
