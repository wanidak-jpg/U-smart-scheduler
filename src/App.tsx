/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LayoutDashboard, Settings, Grid3X3, FileText, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MajorConfigComponent from './components/major/MajorConfig';
import DataImporter from './components/parser/DataImporter';
import { View } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [activeView, setActiveView] = useState<View>('setup');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'setup', label: 'Setup & Configuration', icon: Settings },
    { id: 'planner', label: 'Section Planner', icon: LayoutDashboard },
    { id: 'grid', label: 'Schedule Grid', icon: Grid3X3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 p-0 shadow-2xl md:relative md:flex md:flex-col"
          >
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-900/50">
                  UNI
                </div>
                <div className="flex flex-col leading-tight">
                  <h1 className="text-sm font-bold tracking-tight text-white">Smart Scheduler</h1>
                  <span className="text-[9px] uppercase tracking-widest opacity-40">Admin Dashboard</span>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as View)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 group",
                      isActive 
                        ? "bg-blue-600/10 text-blue-400 border-r-4 border-blue-600 font-semibold" 
                        : "hover:bg-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <Icon size={18} className={cn(isActive ? "text-blue-400" : "text-slate-500 group-hover:text-white")} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 bg-slate-950 border-t border-slate-800 mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 shadow-inner">
                  WK
                </div>
                <div className="flex flex-col overflow-hidden leading-tight">
                  <span className="text-xs font-semibold text-white">Wanida K.</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tight">Firebase Spark Plan</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-800">
              {navItems.find(n => n.id === activeView)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right flex flex-col items-end">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">System Status</p>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Cloud Connected
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider rounded border border-slate-200">
              v1.0
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto"
            >
              {activeView === 'setup' && (
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-12 xl:col-span-6 space-y-6">
                    <MajorConfigComponent />
                  </div>
                  <div className="col-span-12 xl:col-span-6">
                    <DataImporter />
                  </div>
                </div>
              )}
              {activeView === 'planner' && <Placeholder message="Section Planner coming in next phase." />}
              {activeView === 'grid' && <Placeholder message="Schedule Grid coming in next phase." />}
              {activeView === 'reports' && <Placeholder message="Reports coming in next phase." />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Placeholder({ message }: { message: string }) {
  return (
    <div className="h-96 border-2 border-dashed border-[#141414]/10 rounded-2xl flex flex-col items-center justify-center text-[#141414]/40">
      <FileText size={48} className="mb-4 opacity-20" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}
