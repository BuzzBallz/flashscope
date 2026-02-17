import React from 'react';

export function Spinner({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4 ${className}`}
      {...props}
    />
  );
}
