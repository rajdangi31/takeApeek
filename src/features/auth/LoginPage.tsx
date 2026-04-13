import { motion } from "framer-motion";
import { useAuth } from "./AuthContext";
import { LogIn, Sparkles } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

export const LoginPage = () => {
    const { user, signInWithGoogle } = useAuth();
    const location = useLocation();

    // If user is already logged in, redirect them away from the login page
    if (user) {
        const from = (location.state as any)?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-effect rounded-[3rem] p-10 border-white/60 shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background pulse */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />

                <div className="relative z-10 text-center space-y-8">
                    {/* Logo Section */}
                    <motion.div 
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-pink-500 to-purple-600 p-1 shadow-pink-200/50 shadow-2xl skew-y-3">
                            <div className="w-full h-full bg-white rounded-[1.8rem] flex items-center justify-center">
                                <span className="text-pink-600 text-4xl font-black font-outfit select-none">👀</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold font-outfit text-slate-900 tracking-tighter">
                            Take<span className="text-pink-500">APeek</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm max-w-[200px] leading-relaxed">
                            Captured moments with your closest circle. 
                        </p>
                    </motion.div>

                    {/* Action Section */}
                    <div className="space-y-4">
                         <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 text-left">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                <Sparkles size={12} className="text-pink-400" /> Getting Started
                            </h4>
                            <p className="text-slate-500 text-xs font-medium leading-normal">
                                Sign in with your University or Google account to join the peek-verse.
                            </p>
                        </div>

                        <button
                            onClick={signInWithGoogle}
                            className="w-full py-5 rounded-[1.8rem] bg-slate-900 text-white font-bold font-outfit text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl hover:bg-slate-800 transition-all active:scale-95 group"
                        >
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 group-hover:rotate-12 transition-transform">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" />
                            </div>
                            Continue with Google
                        </button>
                    </div>

                    {/* Footer Section */}
                    <div className="pt-4">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            By peering in, you agree to our Terms of Peek.
                        </p>
                    </div>
                </div>
            </motion.div>

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
        </div>
    );
};
