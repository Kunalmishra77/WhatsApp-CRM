import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Save } from 'lucide-react';
import { DateRange } from '../types/filters';

interface RangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: DateRange) => void;
  initialRange: DateRange;
}

export const RangeModal: React.FC<RangeModalProps> = ({ isOpen, onClose, onApply, initialRange }) => {
  const [range, setRange] = useState<DateRange>(initialRange);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(range);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000]"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[1001]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[400px] glass-morphism inner-glow rounded-[2rem] p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] pointer-events-auto border-white/[0.08] relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Calendar size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Custom Range</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl text-zinc-500 hover:bg-white/10 hover:text-zinc-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">From Date</label>
                    <input
                      type="date"
                      value={range.from}
                      onChange={(e) => setRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">To Date</label>
                    <input
                      type="date"
                      value={range.to}
                      onChange={(e) => setRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)]"
                  >
                    <Save size={18} /> Apply Range
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
