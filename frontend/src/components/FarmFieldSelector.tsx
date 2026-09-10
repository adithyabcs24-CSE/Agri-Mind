'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFarmField } from '@/context/FarmFieldContext';
import { ChevronDown, Search, Check, Plus, Loader2, Sprout, AlertCircle, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function FarmFieldSelector() {
  const router = useRouter();
  const {
    farms,
    fields,
    selectedFarmId,
    selectedFieldId,
    selectedFarm,
    selectedField,
    setSelectedFarmId,
    setSelectedFieldId,
    isLoadingFarms,
    isLoadingFields,
    isOffline,
  } = useFarmField();

  // Dropdown open states
  const [farmOpen, setFarmOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);

  // Search states
  const [farmSearch, setFarmSearch] = useState('');
  const [fieldSearch, setFieldSearch] = useState('');

  // Keyboard navigation indexes
  const [farmFocusIdx, setFarmFocusIdx] = useState(-1);
  const [fieldFocusIdx, setFieldFocusIdx] = useState(-1);

  // Refs for click outside
  const farmRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Reset focus indexes when dropdown opens
  useEffect(() => {
    if (farmOpen) {
      setFarmFocusIdx(-1);
      setFarmSearch('');
    }
  }, [farmOpen]);

  useEffect(() => {
    if (fieldOpen) {
      setFieldFocusIdx(-1);
      setFieldSearch('');
    }
  }, [fieldOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (farmRef.current && !farmRef.current.contains(event.target as Node)) {
        setFarmOpen(false);
      }
      if (fieldRef.current && !fieldRef.current.contains(event.target as Node)) {
        setFieldOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items
  const filteredFarms = farms.filter(f =>
    f.name.toLowerCase().includes(farmSearch.toLowerCase())
  );

  const filteredFields = fields.filter(f =>
    f.name.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  // Handle farm keyboard navigation
  const handleFarmKeyDown = (e: React.KeyboardEvent) => {
    if (!farmOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFarmOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFarmFocusIdx(prev => (prev + 1) % (filteredFarms.length + 1)); // +1 for "Create New" option if empty/applicable
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFarmFocusIdx(prev => (prev - 1 + (filteredFarms.length + 1)) % (filteredFarms.length + 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (farmFocusIdx >= 0 && farmFocusIdx < filteredFarms.length) {
          setSelectedFarmId(filteredFarms[farmFocusIdx].id);
          setFarmOpen(false);
        } else if (farmFocusIdx === filteredFarms.length || filteredFarms.length === 0) {
          router.push('/dashboard/settings?tab=farms');
          setFarmOpen(false);
        }
        break;
      case 'Escape':
      case 'Tab':
        setFarmOpen(false);
        break;
    }
  };

  // Handle field keyboard navigation
  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedFarmId) return;

    if (!fieldOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFieldOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFieldFocusIdx(prev => (prev + 1) % (filteredFields.length + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFieldFocusIdx(prev => (prev - 1 + (filteredFields.length + 1)) % (filteredFields.length + 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (fieldFocusIdx >= 0 && fieldFocusIdx < filteredFields.length) {
          setSelectedFieldId(filteredFields[fieldFocusIdx].id);
          setFieldOpen(false);
        } else if (fieldFocusIdx === filteredFields.length || filteredFields.length === 0) {
          router.push('/dashboard/settings?tab=fields');
          setFieldOpen(false);
        }
        break;
      case 'Escape':
      case 'Tab':
        setFieldOpen(false);
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      {/* Farm Dropdown */}
      <div ref={farmRef} className="flex flex-col relative w-60">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider font-display">
          Select Farm
        </label>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={farmOpen}
          onKeyDown={handleFarmKeyDown}
          onClick={() => setFarmOpen(!farmOpen)}
          className="flex items-center justify-between w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:border-slate-350 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-left"
        >
          {isLoadingFarms ? (
            <span className="flex items-center gap-2 text-slate-450">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading Farms...
            </span>
          ) : selectedFarm ? (
            <span className="flex items-center gap-2 truncate">
              <Sprout className="w-3.5 h-3.5 text-green-500" /> {selectedFarm.name}
            </span>
          ) : farms.length === 0 ? (
            <span className="text-red-500 dark:text-red-400 font-bold">No Farms Available</span>
          ) : (
            <span className="text-slate-400">Select a Farm...</span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        <AnimatePresence>
          {farmOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800/60 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              {/* Search input */}
              <div className="relative p-2.5 border-b border-slate-100 dark:border-slate-800/50">
                <Search className="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={farmSearch}
                  onChange={e => setFarmSearch(e.target.value)}
                  placeholder="Search farms..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Items List */}
              <ul className="max-h-52 overflow-y-auto py-1">
                {filteredFarms.map((farm, idx) => (
                  <li key={farm.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={farm.id === selectedFarmId}
                      onClick={() => {
                        setSelectedFarmId(farm.id);
                        setFarmOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-left text-xs font-medium transition-all ${
                        farm.id === selectedFarmId
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-bold'
                          : idx === farmFocusIdx
                          ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <span className="truncate">{farm.name}</span>
                      {farm.id === selectedFarmId && <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />}
                    </button>
                  </li>
                ))}

                {filteredFarms.length === 0 && (
                  <li className="px-4 py-3 text-center text-xs text-slate-400">
                    No matching farms found
                  </li>
                )}

                {/* Create New Farm action button */}
                <li className="border-t border-slate-100 dark:border-slate-800/40 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/dashboard/settings?tab=farms');
                      setFarmOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-500/5 font-bold transition-all ${
                      farmFocusIdx === filteredFarms.length ? 'bg-green-500/5' : ''
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Farm
                  </button>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Field Dropdown */}
      <div ref={fieldRef} className="flex flex-col relative w-60">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider font-display">
          Select Field
        </label>
        <button
          type="button"
          disabled={!selectedFarmId}
          aria-haspopup="listbox"
          aria-expanded={fieldOpen}
          onKeyDown={handleFieldKeyDown}
          onClick={() => setFieldOpen(!fieldOpen)}
          className={`flex items-center justify-between w-full px-4 py-2.5 border rounded-xl text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-left ${
            !selectedFarmId
              ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-850 text-slate-400 cursor-not-allowed'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-slate-350 dark:hover:border-slate-700'
          }`}
        >
          {isLoadingFields ? (
            <span className="flex items-center gap-2 text-slate-450">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading Fields...
            </span>
          ) : selectedField ? (
            <span className="flex items-center gap-2 truncate">
              <Compass className="w-3.5 h-3.5 text-blue-500" /> {selectedField.name}
            </span>
          ) : !selectedFarmId ? (
            <span className="text-slate-450">Disabled (Select Farm First)</span>
          ) : fields.length === 0 ? (
            <span className="text-amber-500 dark:text-amber-400 font-bold">No Fields Found</span>
          ) : (
            <span className="text-slate-450">Select a Field...</span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        <AnimatePresence>
          {fieldOpen && selectedFarmId && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800/60 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              {/* Search input */}
              <div className="relative p-2.5 border-b border-slate-100 dark:border-slate-800/50">
                <Search className="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={e => setFieldSearch(e.target.value)}
                  placeholder="Search fields..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              {/* Items List */}
              <ul className="max-h-52 overflow-y-auto py-1">
                {filteredFields.map((field, idx) => (
                  <li key={field.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={field.id === selectedFieldId}
                      onClick={() => {
                        setSelectedFieldId(field.id);
                        setFieldOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-left text-xs font-medium transition-all ${
                        field.id === selectedFieldId
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                          : idx === fieldFocusIdx
                          ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <span className="truncate">{field.name}</span>
                      {field.id === selectedFieldId && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                    </button>
                  </li>
                ))}

                {filteredFields.length === 0 && (
                  <li className="px-4 py-3 text-center text-xs text-slate-400">
                    No matching fields found
                  </li>
                )}

                {/* Create New Field action button */}
                <li className="border-t border-slate-100 dark:border-slate-800/40 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/dashboard/settings?tab=fields');
                      setFieldOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-500/5 font-bold transition-all ${
                      fieldFocusIdx === filteredFields.length ? 'bg-green-500/5' : ''
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Field
                  </button>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
