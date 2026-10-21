import { useState, useEffect } from 'react';
import { config, getLaunchEndText } from '../config';

export interface CountdownState {
  isFounding: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  endDateText: string;
}

export const useFoundingTimer = (): CountdownState => {
  const calculate = (): CountdownState => {
    const target = new Date(config.foundingEndsAt).getTime();
    const now = Date.now();
    const diff = target - now;
    const isFounding = diff > 0;

    if (!isFounding) {
      return {
        isFounding: false,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        formattedTime: '0d 0h 0m 0s',
        endDateText: getLaunchEndText(config.foundingEndsAt),
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      isFounding: true,
      days,
      hours,
      minutes,
      seconds,
      formattedTime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      endDateText: getLaunchEndText(config.foundingEndsAt),
    };
  };

  const [state, setState] = useState<CountdownState>(calculate);

  useEffect(() => {
    const timer = setInterval(() => {
      setState(calculate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return state;
};
