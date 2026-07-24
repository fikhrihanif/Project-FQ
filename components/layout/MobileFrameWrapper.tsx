"use client";

import React from "react";
import { Wifi, Battery, Smartphone } from "lucide-react";

export function MobileFrameWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-6 text-slate-100 font-sans">
      {/* Top Banner for Competition Showcase */}
      <div className="hidden sm:flex items-center gap-3 mb-4 bg-slate-900/90 border border-slate-800/90 rounded-full px-6 py-2.5 shadow-2xl backdrop-blur-md">
        <Smartphone className="w-5 h-5 text-blue-400 animate-pulse" />
        <div className="text-left">
          <p className="text-xs font-bold text-white tracking-wide">
            FAST QUEUE MOBILE — COMPETITION SHOWCASE
          </p>
          <p className="text-[10px] text-slate-400">
            Tampilan Aplikasi Mobile Live di Web (Database Connected)
          </p>
        </div>
      </div>

      {/* Smartphone Device Frame Container */}
      <div className="w-full max-w-[440px] min-h-screen sm:min-h-[860px] sm:max-h-[92vh] bg-slate-900 sm:border-[10px] border-slate-800 rounded-none sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative sm:ring-1 ring-slate-700/50">
        
        {/* Phone Top Notch / Dynamic Island & Status Bar */}
        <div className="bg-slate-900 text-white px-6 pt-3 pb-2 flex items-center justify-between text-xs select-none shrink-0 border-b border-slate-800/50">
          <span className="font-semibold tracking-tight text-[11px]">12:00</span>
          {/* Dynamic Island Notch */}
          <div className="w-20 h-4 bg-black rounded-full mx-auto hidden sm:block border border-slate-800/80 shadow-inner" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Inner App Content Screen */}
        <div className="flex-1 overflow-y-auto bg-surface-muted scrollbar-thin relative flex flex-col">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="bg-slate-900 py-2.5 flex justify-center shrink-0 border-t border-slate-800/40">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>

      {/* Footer Info */}
      <p className="hidden sm:block text-[11px] text-slate-500 mt-4 text-center">
        💡 Siap Diperlombakan — Tampilan Aplikasi Mobile Terhubung 100% ke Database Cloud.
      </p>
    </div>
  );
}
