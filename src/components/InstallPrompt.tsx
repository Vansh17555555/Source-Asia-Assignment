"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

export default function InstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if it was already dismissed
    if (localStorage.getItem("pwaPromptDismissed") === "true") {
      setIsDismissed(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsInstallable(false);
    setIsDismissed(true);
    localStorage.setItem("pwaPromptDismissed", "true");
  };

  if (!isInstallable || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 z-50 md:hidden">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-bold text-sm">Install AeroFlight</p>
          <p className="text-xs text-slate-400">Add to home screen for offline access</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleInstallClick}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"
          >
            <Download size={16} /> Install
          </button>
          <button onClick={handleDismiss} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
