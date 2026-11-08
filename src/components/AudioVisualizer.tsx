import React from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isLoading?: boolean;
  barsCount?: number;
  barColor?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  isLoading = false,
  barsCount = 18,
  barColor = 'bg-amber-400',
  className = '',
}) => {
  const bars = Array.from({ length: barsCount });

  return (
    <div className={`flex items-end justify-center gap-1 h-8 px-2 ${className}`}>
      {bars.map((_, index) => {
        // Vary heights and delays for a realistic musical spectrum
        const heights = [
          'h-2', 'h-4', 'h-6', 'h-8', 'h-5', 'h-7', 
          'h-3', 'h-8', 'h-6', 'h-4', 'h-7', 'h-5',
          'h-3', 'h-6', 'h-8', 'h-5', 'h-4', 'h-2'
        ];
        const heightClass = heights[index % heights.length];
        const delay = (index * 0.08).toFixed(2);

        return (
          <div
            key={index}
            style={{
              animationDelay: `${delay}s`,
            }}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? `${barColor} animate-soundwave-${(index % 5) + 1}`
                : isLoading
                ? `${barColor} opacity-50 animate-pulse h-3`
                : 'bg-slate-600/40 h-1.5'
            } ${isPlaying ? heightClass : ''}`}
          />
        );
      })}
    </div>
  );
};
