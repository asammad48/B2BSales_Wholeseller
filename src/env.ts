export const env = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://hbsxxs40-51948.inc1.devtunnels.ms'),
};
