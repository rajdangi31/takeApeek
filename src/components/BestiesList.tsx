// src/components/BestiesList.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../contexts/AuthContext";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface BestieRow {
  id: number;
  user_id: string;
  bestie_id: string;
  status: "pending" | "accepted";
  avatar_url: string;
  user_name: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const bestiesKey = (uid?: string): QueryKey => ["besties", uid ?? "none"];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const BestiesList = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [emailToAdd, setEmailToAdd] = useState("");

  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: bestiesKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<BestieRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("besties")
        .select("*")
        .or(`user_id.eq.${user.id},bestie_id.eq.${user.id}`);

      if (error) throw error;
      return (data as BestieRow[]) ?? [];
    },
  });

  const addReq = useMutation<void, Error, string>({
    mutationFn: async (email) => {
      if (!user) throw new Error("Not signed in");

      // Check bestie limit (max 4 accepted besties)
      const acceptedCount = accepted.length;
      if (acceptedCount >= 4) {
        throw new Error("You can have a maximum of 4 besties. Remove someone first to add a new bestie.");
      }

      // Normalize email to lowercase for consistent searching
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log("Searching for email:", normalizedEmail);

      // Try different approaches to find the user
      let userData = null;
      let searchError = null;

      // Approach 1: Try exact match with normalized email
      const { data: u1, error: e1 } = await supabase
        .from("user_profiles")
        .select("id, avatar_url, user_name, email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (e1) {
        console.error("Database error (approach 1):", e1);
        searchError = e1;
      } else if (u1) {
        userData = u1;
        console.log("Found user (approach 1):", u1);
      }

      // Approach 2: If not found, try case-insensitive search
      if (!userData) {
        const { data: u2, error: e2 } = await supabase
          .from("user_profiles")
          .select("id, avatar_url, user_name, email")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (e2) {
          console.error("Database error (approach 2):", e2);
          searchError = e2;
        } else if (u2) {
          userData = u2;
          console.log("Found user (approach 2):", u2);
        }
      }

      // Approach 3: If still not found, try searching in auth.users table
      if (!userData) {
        const { data: authUsers, error: e3 } = await supabase.auth.admin.listUsers();
        
        if (e3) {
          console.error("Auth users error:", e3);
        } else {
          const authUser = authUsers.users.find(u => 
            u.email?.toLowerCase() === normalizedEmail
          );
          
          if (authUser) {
            console.log("Found in auth.users:", authUser);
            // Check if this user has a profile
            const { data: profile, error: profileError } = await supabase
              .from("user_profiles")
              .select("id, avatar_url, user_name, email")
              .eq("id", authUser.id)
              .maybeSingle();
            
            if (profile) {
              userData = profile;
              console.log("Found profile for auth user:", profile);
            } else {
              console.log("Auth user exists but no profile found");
            }
          }
        }
      }

      // If we have a database error, throw it
      if (searchError) {
        throw new Error(`Database error: ${searchError.message}`);
      }

      // If no user found, provide detailed error
      if (!userData) {
        // Check RLS permissions by trying to get current user's profile
        const { data: currentUserProfile, error: currentUserError } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", user.id)
          .single();
        
        console.log("Current user profile check:", { currentUserProfile, currentUserError });
        
        // Try a different approach - search without RLS restrictions
        const { data: allUsers, error: allUsersError } = await supabase
          .from("user_profiles")
          .select("email, id")
          .limit(5);
        
        console.log("All users query:", { allUsers, allUsersError });
        
        let errorMessage = `No user found with email: ${normalizedEmail}.`;
        
        if (allUsersError) {
          errorMessage += ` Database access error: ${allUsersError.message}`;
        } else if (!allUsers || allUsers.length === 0) {
          errorMessage += ` No users found in database (possible RLS issue).`;
        } else {
          const availableEmails = allUsers.map(u => u.email).join(", ");
          errorMessage += ` Available emails: ${availableEmails}`;
        }
        
        throw new Error(errorMessage);
      }

      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from("besties")
        .select("id")
        .or(`and(user_id.eq.${user.id},bestie_id.eq.${userData.id}),and(user_id.eq.${userData.id},bestie_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        throw new Error("Friendship already exists with this user");
      }

      // Check if trying to add yourself
      if (userData.id === user.id) {
        throw new Error("You cannot add yourself as a bestie");
      }

      const avatar_url = userData.avatar_url ?? "/avatar-placeholder.png";
      const user_name = userData.user_name ?? normalizedEmail.split("@")[0];

      console.log("Creating friendship with:", { 
        user_id: user.id, 
        bestie_id: userData.id, 
        avatar_url, 
        user_name 
      });

      const { error: insertError } = await supabase.from("besties").insert({
        user_id: user.id,
        bestie_id: userData.id,
        status: "pending",
        avatar_url,
        user_name,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Failed to create friendship: ${insertError.message}`);
      }

      console.log("Friendship created successfully");
    },
    onSuccess: () => {
      setEmailToAdd("");
      qc.invalidateQueries({ queryKey: bestiesKey(user?.id) });
    },
    onError: (error) => {
      console.error("Add bestie error:", error);
    }
  });

  const acceptReq = useMutation<void, Error, number>({
    mutationFn: async (rowId) => {
      const { error } = await supabase
        .from("besties")
        .update({ status: "accepted" })
        .eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bestiesKey(user?.id) }),
  });

  const removeReq = useMutation<void, Error, number>({
    mutationFn: async (rowId) => {
      const { error } = await supabase
        .from("besties")
        .delete()
        .eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bestiesKey(user?.id) }),
  });

  const incoming = rows.filter(
    (r) => r.bestie_id === user?.id && r.status === "pending"
  );
  const outgoing = rows.filter(
    (r) => r.user_id === user?.id && r.status === "pending"
  );
  const accepted = rows.filter((r) => r.status === "accepted");

  if (!user) return <p className="text-center mt-6">Please sign in.</p>;
  if (isLoading) return <p className="text-center mt-6">Loading…</p>;
  if (error)
    return (
      <p className="text-center mt-6 text-red-600">{error.message}</p>
    );

  const Avatar = ({ url }: { url: string }) => (
    <img
      src={url || "/avatar-placeholder.png"}
      alt="avatar"
      className="w-10 h-10 rounded-full"
    />
  );

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white shadow-xl rounded-xl p-6 space-y-8">
      {/* ============================= Besties ======================== */}
      <section>
        <h2 className="text-xl font-bold text-pink-600 mb-3">
          Besties ({accepted.length}/5)
        </h2>
        {accepted.length === 0 && (
          <p className="text-sm text-gray-500">No friends yet.</p>
        )}
        <ul className="space-y-3">
          {accepted.map((b) => (
            <li key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="font-medium">{b.user_name}</span>
              </div>
              <button
                onClick={() => removeReq.mutate(b.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ======================== Incoming requests =================== */}
      <section>
        <h3 className="font-semibold mb-2">Incoming requests</h3>
        {incoming.length === 0 && (
          <p className="text-sm text-gray-500">None.</p>
        )}
        <ul className="space-y-3">
          {incoming.map((b) => (
            <li key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="font-medium">{b.user_name}</span>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => acceptReq.mutate(b.id)}
                  className="text-xs text-green-600 hover:underline"
                >
                  Accept
                </button>
                <button
                  onClick={() => removeReq.mutate(b.id)}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ======================== Outgoing requests =================== */}
      <section>
        <h3 className="font-semibold mb-2">Outgoing requests</h3>
        {outgoing.length === 0 && (
          <p className="text-sm text-gray-500">None.</p>
        )}
        <ul className="space-y-3">
          {outgoing.map((b) => (
            <li key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="font-medium">{b.user_name}</span>
              </div>
              <button
                onClick={() => removeReq.mutate(b.id)}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ============================= Add new ======================== */}
      <section className="pt-4 border-t border-pink-100">
        <h3 className="font-semibold mb-2">Add a bestie</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailToAdd}
            onChange={(e) => setEmailToAdd(e.target.value)}
            placeholder="friend@example.com"
            className="flex-grow border border-pink-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            disabled={!emailToAdd || addReq.isPending || accepted.length >= 5}
            onClick={() => addReq.mutate(emailToAdd)}
            className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 disabled:opacity-50"
            title={accepted.length >= 5 ? "Maximum 5 besties allowed" : ""}
          >
            {addReq.isPending ? "Adding…" : "Add"}
          </button>
        </div>
        {addReq.isError && (
          <p className="text-xs text-red-500 mt-1">
            {addReq.error?.message}
          </p>
        )}
        {accepted.length >= 5 && (
          <p className="text-xs text-amber-600 mt-1">
            Maximum besties reached (5/5). Remove someone to add a new bestie.
          </p>
        )}
      </section>
    </div>
  );
};