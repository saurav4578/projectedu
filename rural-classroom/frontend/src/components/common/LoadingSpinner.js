import React from 'react';

export default function LoadingSpinner({ size = 'md', text }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div className={`${sizes[size]} border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin`}></div>
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  );
}
