// src/services/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

// necesario para que laravel-echo encuentre Pusher en RN
global.Pusher = Pusher;

// CAMBIA ESTO por la IP de tu PC
const LARAVEL_HOST = '192.168.0.13';
const WS_PORT = 8080;

// Son los mismos valores que tienes en el .env de Laravel
const REVERB_APP_KEY = 'ljtplxexpbq7atbjzrzp';

const echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_APP_KEY,
  wsHost: LARAVEL_HOST,
  wsPort: WS_PORT,
  wssPort: WS_PORT,
  forceTLS: false,
  enabledTransports: ['ws'],
});

export default echo;
