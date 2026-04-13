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

        // 1. Set up the listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Event: ${event}`, session?.user?.id || "No session");

            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }

            // We only stop loading once we've received the initial session event
            // or a successful sign-in
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                setLoading(false);
                console.log("[Auth] Loading finished via event:", event);
            }
        });

        // 2. We don't need a separate initSession with its own setLoading(false)
        // as onAuthStateChange will trigger INITIAL_SESSION automatically.

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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within the AuthProvider")
    }
    return context
}