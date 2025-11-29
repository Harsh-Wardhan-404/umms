export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE 
  ? JSON.parse(import.meta.env.VITE_MAINTENANCE_MODE) 
  : false;
