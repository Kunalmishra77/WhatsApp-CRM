import React from 'react';
const Page: React.FC<{ name: string }> = ({ name }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-zinc-100">{name}</h2>
    <div className="h-[600px] glass-morphism rounded-[2.5rem] flex items-center justify-center border-dashed border-2 border-zinc-200 dark:border-white/5">
      <p className="text-zinc-500 uppercase tracking-widest font-black text-xs">Module Under Construction</p>
    </div>
  </div>
);
export default Page;
