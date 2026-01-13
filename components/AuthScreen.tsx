
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';
import { User, Lock, LogIn, UserPlus, AlertCircle, ChevronLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react';

type AuthMode = 'CHOICE' | 'LOGIN' | 'SIGNUP';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('CHOICE');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateFormat = (text: string) => {
    const re = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,12}$/;
    return re.test(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateFormat(userId)) {
      setError('User ID must be 6-12 characters (alphanumeric/symbols)');
      return;
    }

    if (!validateFormat(password)) {
      setError('Password must be 6-12 characters (alphanumeric/symbols)');
      return;
    }

    setLoading(true);
    const virtualEmail = `${userId.toLowerCase().replace(/[^a-z0-9]/g, '_')}@tamarind.local`;

    try {
      if (mode === 'LOGIN') {
        const userCredential = await signInWithEmailAndPassword(auth, virtualEmail, password);
        if (!userCredential.user.displayName) {
          await updateProfile(userCredential.user, { displayName: userId });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, password);
        await updateProfile(userCredential.user, { displayName: userId });
      }
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid User ID or Password');
          break;
        case 'auth/email-already-in-use':
          setError('This User ID is already taken');
          break;
        default:
          setError(`Error: ${err.message || 'Something went wrong'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const Disclaimer = () => (
    <div className="mt-8 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
      <div className="flex items-start gap-2">
        <ShieldAlert size={14} className="text-gray-300 shrink-0 mt-0.5" />
        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest text-left leading-relaxed">
          <span className="text-gray-400">Notice:</span> This community platform is for internal resident communication only. Developers and condominium management are not liable for any transaction disputes, items sold, or accidents occurring during playground play. Use at your own responsibility.
        </p>
      </div>
    </div>
  );

  if (mode === 'CHOICE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50 text-center">
        <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-10 border border-pink-100 animate-fade-in">
          <div className="text-6xl mb-6">🏘️</div>
          <h1 className="text-2xl font-black text-pink-500 mb-2 tracking-tighter uppercase">The Tamarind Connect</h1>
          <p className="text-gray-400 mb-10 font-black text-[10px] uppercase tracking-widest leading-loose">Play Together • Trade Together</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setMode('SIGNUP')}
              className="w-full py-5 bg-pink-400 text-white rounded-3xl font-black shadow-lg shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <UserPlus size={20} /> New User? Sign Up
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="flex-grow h-px bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
              <div className="flex-grow h-px bg-gray-100"></div>
            </div>
            <button
              onClick={() => setMode('LOGIN')}
              className="w-full py-5 bg-white border-2 border-pink-100 text-pink-400 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <LogIn size={20} /> Already a member?
            </button>
          </div>
          <Disclaimer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50">
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 border border-pink-100 animate-fade-in">
        <button 
          onClick={() => { setMode('CHOICE'); setError(''); setShowPassword(false); }}
          className="mb-6 flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-pink-400 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>

        <h2 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-tighter">
          {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">User ID</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-pink-200" size={18} />
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="6-12 characters"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-pink-200 font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-pink-200" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6-12 characters"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-pink-200 font-bold text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-300 hover:text-pink-400 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle size={14} className="shrink-0" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
              loading ? 'bg-gray-200 text-gray-400' : 'bg-pink-400 text-white shadow-pink-200'
            }`}
          >
            {loading ? 'Processing...' : mode === 'LOGIN' ? <><LogIn size={18}/> Login</> : <><UserPlus size={18}/> Sign Up</>}
          </button>
        </form>
        <Disclaimer />
      </div>
    </div>
  );
};
