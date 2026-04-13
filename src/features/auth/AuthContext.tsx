import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("[Auth] Mount: Initializing session...");

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log("[Auth] getSession result:", session?.user?.id || "No session");
                
                if (session?.user) {
                    const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
                    if (!error && verifiedUser) {
                        console.log("[Auth] getUser verified:", verifiedUser.id);
                        setUser(verifiedUser);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("[Auth] Initialization error:", err);
                setUser(null);
            } finally {
                setLoading(false);
                console.log("[Auth] Loading finished.");
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Event: ${event}`, session?.user?.id || "No session");
            
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            } else if (session?.user) {
                setUser(session.user);
                setLoading(false);
            }
        });

        initSession();

        return () => {
            console.log("[Auth] Unmount: Unsubscribing...");
            subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        console.log("[Auth] Initiating Google Sign-In...");
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            }
        });
    };

    const signOut = async () => {
        console.log("[Auth] Initiating Sign-Out...");
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () : AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within the AuthProvider")
    }
    return context
}