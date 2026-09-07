import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

interface SettingsFeedbackBannerProps {
  feedback: FeedbackState | null;
}

export const SettingsFeedbackBanner: React.FC<SettingsFeedbackBannerProps> = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div
      className={`p-3.5 rounded-xl flex items-center gap-2.5 border animate-fade-in ${
        feedback.type === 'success'
          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-500/20 dark:border-green-900/30'
          : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-900/30'
      }`}
    >
      {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="text-xs font-semibold">{feedback.message}</span>
    </div>
  );
};
