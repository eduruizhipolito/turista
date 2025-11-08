import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { stellarService } from '../services/stellar.service';

export const useCheckIn = (placeId: number) => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey } = useWallet();

  useEffect(() => {
    const check = async () => {
      if (!publicKey || !placeId) return;

      setIsLoading(true);
      try {
        const checkedIn = await stellarService.hasCheckedIn(publicKey, placeId);
        setHasCheckedIn(checkedIn);
      } catch (error) {
        console.error('Error checking check-in status:', error);
        setHasCheckedIn(false); // Assume not checked in on error
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [publicKey, placeId]);

  return { hasCheckedIn, isLoading };
};
