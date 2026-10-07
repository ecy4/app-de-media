import React, { useState } from 'react';
import { Database, AlertTriangle, RefreshCw, Key, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SupabaseConnectionError({ message }) {
  const { recheckHealth } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await recheckHealth();
    setRetrying(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-red-500 selection:text-white">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow shape */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#E60023]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Conexión Requerida
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Conexión con Supabase Pendiente
            </h1>
          </div>
        </div>

        {/* Error notice */}
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-200 mb-6 flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Estado del servicio:</p>
            <p className="mt-0.5">{message || 'No se detectaron las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tu archivo .env'}</p>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-3 mb-8 text-xs text-neutral-300">
          <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Pasos para activar tu base de datos:</span>
          </h2>

          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-2">
            <p className="flex items-start gap-2">
              <span className="font-bold text-red-400">1.</span>
              <span>Crea tu proyecto en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-red-400 underline font-semibold inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-red-400">2.</span>
              <span>Ejecuta el script <code className="bg-neutral-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[11px]">supabase_schema.sql</code> en el SQL Editor de Supabase.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-red-400">3.</span>
              <span>Copia tu <code className="bg-neutral-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px]">Project URL</code> y <code className="bg-neutral-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px]">anon key</code> en el archivo <code className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-mono text-[11px]">.env</code>:</span>
            </p>
          </div>

          <pre className="p-3 bg-black/90 border border-neutral-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui`}
          </pre>
        </div>

        {/* Action button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full py-3 px-5 bg-[#E60023] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-full text-xs sm:text-sm shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Comprobando conexión...' : 'Reintentar Conexión'}</span>
        </button>
      </div>
    </div>
  );
}
