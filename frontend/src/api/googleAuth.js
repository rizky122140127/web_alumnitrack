const backendUrl = (
  import.meta.env.VITE_BACKEND_URL
  || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '')
).replace(/\/$/, '');

export const googleAuthUrl = (intent) => {
  const query = intent === 'admin' ? '?intent=admin' : '';
  return `${backendUrl}/auth/google/redirect${query}`;
};
