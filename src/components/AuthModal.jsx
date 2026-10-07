import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, defaultMode = 'login', onSuccess }) {
  const { login, signup, resendConfirmation } = useAuth();
  const [mode, setMode] = useState(defaultMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEmailConfirmRequired, setIsEmailConfirmRequired] = useState(false);
  const [needsResend, setNeedsResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setIsEmailConfirmRequired(false);
      setNeedsResend(false);
      setResendSuccess(false);
    }
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await resendConfirmation(email);
      setResendSuccess(true);
      setNeedsResend(false);
      setError('¡Correo de confirmación reenviado! Revisa tu bandeja de entrada o spam.');
    } catch (err) {
      console.error('Resend error:', err);
      setError(err.message || 'Error al reenviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNeedsResend(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onSuccess?.();
        onClose();
      } else {
        const res = await signup(email, password, { fullName, username });
        // Supabase returns session as null if email confirmation is required
        if (res && res.user && !res.session) {
          setIsEmailConfirmRequired(true);
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.message || '';
      
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('not confirmed') || msg.toLowerCase().includes('email link')) {
        setError('Parece que este correo requiere confirmación o ya está registrado.');
        setNeedsResend(true);
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
         setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        setError(msg || 'Error al autenticar en Supabase.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#E60023] rounded-full mx-auto flex items-center justify-center text-white font-black text-2xl shadow-md mb-3">
            P
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'login' 
              ? 'Ingresa tus credenciales registradas en Supabase Auth' 
              : 'Regístrate para guardar pines, comentar y subir contenido'}
          </p>
        </div>

        {/* Success / Form Content */}
        {isEmailConfirmRequired ? (
          <div className="text-center py-6 animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Revisa tu correo!</h3>
            <p className="text-sm text-gray-600 mb-6">
              Te hemos enviado un enlace de confirmación a <span className="font-semibold">{email}</span>. 
              Por favor, haz clic en el enlace para activar tu cuenta.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-bold text-sm transition-all"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            {/* Error / Feedback notification */}
            {error && (
              <div className={`mb-4 p-3 border rounded-xl text-sm flex flex-col gap-2 animate-fadeIn ${resendSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="flex items-start gap-2">
                  {resendSuccess ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  )}
                  <span>{error}</span>
                </div>
                {needsResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="mt-1 w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    Reenviar correo de confirmación
                  </button>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Sofía Valdés"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de Usuario (@)</label>
                    <div className="relative">
                      <span className="text-gray-400 absolute left-3.5 top-2.5 text-sm font-semibold">@</span>
                      <input
                        type="text"
                        required
                        placeholder="sofia_ux"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico o Usuario</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="tu@email.com o usuario"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando con Supabase...</span>
                  </>
                ) : mode === 'login' ? (
                  'Iniciar Sesión'
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            {/* Switch mode */}
            <div className="text-center mt-5 pt-4 border-t border-gray-100 text-xs text-gray-600">
              {mode === 'login' ? (
                <p>
                  ¿Aún no tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-bold text-[#E60023] hover:underline"
                  >
                    Regístrate gratis
                  </button>
                </p>
              ) : (
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="font-bold text-[#E60023] hover:underline"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
