'use client';

import { useEffect, useCallback } from 'react';
import { Winner } from '@/types/winner';
import { BrandChip, ExecutionChip, DurationChip, ThemeChip } from './Chips';

interface VideoModalProps {
  winner: Winner;
  onClose: () => void;
}

// Extract Google Drive file ID from various URL formats
function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  
  // Format: https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
  // Format: https://drive.google.com/file/d/{FILE_ID}/view
  // Format: https://drive.google.com/open?id={FILE_ID}
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

export function VideoModal({ winner, onClose }: VideoModalProps) {
  const fileId = extractGoogleDriveId(winner.videoUrl);
  const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [handleEscape]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <BrandChip brand={winner.brand} />
              <ExecutionChip execution={winner.execution} />
              <DurationChip duration={winner.duration} />
              {winner.theme && <ThemeChip theme={winner.theme} />}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
              {winner.ticket}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {winner.month} {winner.variant && `- ${winner.variant}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black aspect-video">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No video available</p>
              <p className="text-sm mt-1">Add a Google Drive link to the VIDEO_URL column</p>
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {winner.testDifferentiators && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Test Differentiators:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.testDifferentiators}</p>
              </div>
            )}
            {winner.music && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Music:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.music}</p>
              </div>
            )}
            {winner.caps && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Captions:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.caps}</p>
              </div>
            )}
            {winner.textOverlay && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Text Overlay:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.textOverlay}</p>
              </div>
            )}
            {winner.mention && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">First Mention:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.mention}s</p>
              </div>
            )}
            {winner.productOverlay && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Product Overlay:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.productOverlay}</p>
              </div>
            )}
            {winner.notes && (
              <div className="md:col-span-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Notes:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{winner.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
