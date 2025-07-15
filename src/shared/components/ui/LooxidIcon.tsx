import React from 'react';

interface LooxidIconProps {
  className?: string;
  size?: number;
}

export const LooxidIcon: React.FC<LooxidIconProps> = ({ 
  className = "", 
  size = 20 
}) => {
  return (
    <img 
      src="/looxid-icon.png" 
      alt="Looxid Labs" 
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}; 