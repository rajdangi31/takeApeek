import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { LogIn, Sparkles, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const LoginPage = () => {
    const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Mode Toggle: 'signin' | 'signup'
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    
    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");

    // Status State
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // If user is already logged in, redirect them away from the login page
    useEffect(() => {
        if (!loading && user) {
            const from = (location.state as any)?.from?.pathname || "/";
            const safeFrom = from === "/login" ? "/" : from;
            
            if (location.pathname !== safeFrom) {
                navigate(safeFrom, { replace: true });
            }
        }
    }, [user, loading, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setIsSubmitting(true);

        try {
            if (mode === 'signup') {
                const { error } = await signUpWithEmail(email, password, {
                    username,
                    display_name: displayName,
                });
                if (error) throw error;
                setIsSuccess(true);
            } else {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;
            }
        } catch (err: any) {
            setAuthError(err.message || "An authentication error occurred.");
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
             {/* Subtle background text */}
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                className="fixed bottom-10 left-0 right-0 pointer-events-none select-none overflow-hidden whitespace-nowrap"
            >
                <div className="text-[15rem] font-black font-outfit flex gap-10">
                    <span>PEEK</span><span>PEEK</span><span>PEEK</span><span>PEEK</span>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-effect rounded-[3rem] p-8 md:p-10 border-white/60 shadow-2xl relative z-10"
            >
                 {/* Decorative background pulse */}
                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                         <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-xl skew-y-3 mb-4"
                        >
                            <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center">
                                <span className="text-pink-600 text-2xl">👀</span>
                            </div>
                        </motion.div>
                        <h1 className="text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">
                            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            {mode === 'signin' ? 'Discover the unfiltered world.' : 'Join your circle in the peek-verse.'}
                        </p>
                    </div>

                    {isSuccess ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50 border border-green-100 p-6 rounded-3xl text-center space-y-4"
                        >
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-green-900">Registration Successful!</h3>
                                <p className="text-green-700 text-xs leading-relaxed px-4">
                                    Please check your email to verify your account before logging in.
                                </p>
                            </div>
                            <button 
                                onClick={() => { setIsSuccess(false); setMode('signin'); }}
                                className="text-green-600 font-bold text-sm hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode="wait">
                                {authError && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-red-50/80 border border-red-100 p-3 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-medium"
                                    >
                                        <AlertCircle size={16} className="shrink-0" />
                                        {authError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                {mode === 'signup' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    placeholder="Username"
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="relative group">
                                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="Display Name"
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
                                        {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-300">
                            <span className="bg-white/80 px-4 blur-fallback">Or</span>
                        </div>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5 object-contain" />
                        Continue with Google
                    </button>

                    <div className="text-center">
                        <button
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setAuthError(null); }}
                            className="text-sm font-bold text-slate-500 hover:text-pink-600 transition-colors"
                        >
                            {mode === 'signin' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
