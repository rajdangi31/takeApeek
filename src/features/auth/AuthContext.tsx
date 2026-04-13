import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => void;
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    signUpWithEmail: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("[Auth] Mount: Initializing session...");

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Event: ${event}`, session?.user?.id || "No session");

            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }

            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                setLoading(false);
                console.log("[Auth] Loading finished via event:", event);
            }
        });

        return () => {
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

    const signInWithEmail = async (email: string, password: string) => {
        console.log("[Auth] Initiating Email Sign-In...");
        const result = await supabase.auth.signInWithPassword({ email, password });
        return { error: result.error };
    };

    const signUpWithEmail = async (email: string, password: string, metadata: any = {}) => {
        console.log("[Auth] Initiating Email Sign-Up...");
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            }
        });
        return { error: result.error };
    };

    const signOut = async () => {
        console.log("[Auth] Initiating Sign-Out...");
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within the AuthProvider")
    }
    return context
}