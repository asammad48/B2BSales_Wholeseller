export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://xm9cpxwr-51948.asse.devtunnels.ms'),
};
