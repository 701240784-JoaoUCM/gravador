import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost:8081') && !origin.includes('192.168.')) {
        return origin;
      }
    }
  }
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getBaseUrl();
