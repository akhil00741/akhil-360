import { useContext } from 'react';
import { ShootContext } from './ShootContextBase';

export const useShoots = () => {
  const context = useContext(ShootContext);
  if (!context) {
    throw new Error('useShoots must be used within a ShootProvider');
  }
  return context;
};
