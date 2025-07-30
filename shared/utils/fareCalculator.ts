import { FARE_MATRIX } from '../../constants/fareMatrix';
import { FareInfo } from '../types';

export const calculateFare = (from: string, to: string): number | null => {
  const fareInfo = FARE_MATRIX.find(f => f.from === from && f.to === to);
  return fareInfo ? fareInfo.fare : null;
};

export const getFareInfo = (from: string, to: string): FareInfo | null => {
  return FARE_MATRIX.find(f => f.from === from && f.to === to) || null;
};