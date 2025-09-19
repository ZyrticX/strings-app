import React from 'react';
import { AlertCircle, Settings } from 'lucide-react';

export const LocalDevBanner = () => {
  const isLocalDev = import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1') || 
                     import.meta.env.VITE_SUPABASE_URL?.includes('localhost') ||
                     !import.meta.env.VITE_SUPABASE_URL;

  if (!isLocalDev) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
      <Settings className="w-4 h-4 animate-spin" />
      <span>🏠 מצב פיתוח מקומי - Base44 מבוטל, Supabase מקומי פעיל</span>
      <AlertCircle className="w-4 h-4" />
    </div>
  );
};

export default LocalDevBanner;
