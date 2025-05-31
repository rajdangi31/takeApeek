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
const MAX_BESTIES = 5; // Consistent limit

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

      // Check bestie limit (consistent limit check)
      const acceptedCount = accepted.length;
      if (acceptedCount >= MAX_BESTIES) {
        throw new Error(`You can have a maximum of ${MAX_BESTIES} besties. Remove someone first to add a new bestie.`);
      }

      // Normalize email to lowercase for consistent searching
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log("Searching for email:", normalizedEmail);

      // Find the user to add
      let userData = null;

      // Try exact match first
      const { data: u1, error: e1 } = await supabase
        .from("user_profiles")
        .select("id, avatar_url, user_name, email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (e1) {
        console.error("Database error:", e1);
        throw new Error(`Database error: ${e1.message}`);
      }

      if (u1) {
        userData = u1;
      } else {
        // Try case-insensitive search
        const { data: u2, error: e2 } = await supabase
          .from("user_profiles")
          .select("id, avatar_url, user_name, email")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (e2) {
          console.error("Database error:", e2);
          throw new Error(`Database error: ${e2.message}`);
        }

        userData = u2;
      }

      if (!userData) {
        throw new Error(`No user found with email: ${normalizedEmail}. Make sure they have signed up for the app.`);
      }

      // Check if trying to add yourself
      if (userData.id === user.id) {
        throw new Error("You cannot add yourself as a bestie");
      }

      // Check if friendship already exists (any direction, any status)
      const { data: existingFriendship } = await supabase
        .from("besties")
        .select("id, status")
        .or(`and(user_id.eq.${user.id},bestie_id.eq.${userData.id}),and(user_id.eq.${userData.id},bestie_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        if (existingFriendship.status === "accepted") {
          throw new Error("You are already besties with this user");
        } else {
          throw new Error("A friend request already exists with this user");
        }
      }

      const avatar_url = userData.avatar_url ?? "/avatar-placeholder.png";
      const user_name = userData.user_name ?? normalizedEmail.split("@")[0];

      console.log("Creating friendship request:", { 
        user_id: user.id, 
        bestie_id: userData.id, 
        avatar_url, 
        user_name 
      });

      // Create the friend request (one-way for now, becomes bidirectional on accept)
      const { error: insertError } = await supabase.from("besties").insert({
        user_id: user.id,
        bestie_id: userData.id,
        status: "pending",
        avatar_url,
        user_name,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Failed to send friend request: ${insertError.message}`);
      }

      console.log("Friend request sent successfully");
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
      if (!user) throw new Error("Not signed in");

      // Get the pending request details
      const { data: requestData, error: fetchError } = await supabase
        .from("besties")
        .select("*")
        .eq("id", rowId)
        .eq("status", "pending")
        .single();

      if (fetchError || !requestData) {
        throw new Error("Friend request not found");
      }

      // Verify this is a request TO the current user
      if (requestData.bestie_id !== user.id) {
        throw new Error("You can only accept requests sent to you");
      }

      // Check if accepting would exceed the limit for either user
      const currentAccepted = accepted.length;
      if (currentAccepted >= MAX_BESTIES) {
        throw new Error(`You already have the maximum of ${MAX_BESTIES} besties`);
      }

      // Update the original request to accepted
      const { error: updateError } = await supabase
        .from("besties")
        .update({ status: "accepted" })
        .eq("id", rowId);

      if (updateError) {
        throw new Error(`Failed to accept request: ${updateError.message}`);
      }

      // Create the reciprocal relationship so both users see each other as friends
      const { error: reciprocalError } = await supabase
        .from("besties")
        .insert({
          user_id: requestData.bestie_id, // The person who accepted (current user)
          bestie_id: requestData.user_id, // The person who sent the request
          status: "accepted",
          avatar_url: user.user_metadata?.avatar_url ?? "/avatar-placeholder.png",
          user_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Unknown",
        });

      if (reciprocalError) {
        console.error("Failed to create reciprocal relationship:", reciprocalError);
        // Don't throw here - the main acceptance worked
      }

      console.log("Friend request accepted and reciprocal relationship created");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bestiesKey(user?.id) }),
  });

  const removeReq = useMutation<void, Error, number>({
    mutationFn: async (rowId) => {
      if (!user) throw new Error("Not signed in");

      // Get the relationship details before deleting
      const { data: relationshipData, error: fetchError } = await supabase
        .from("besties")
        .select("*")
        .eq("id", rowId)
        .single();

      if (fetchError || !relationshipData) {
        throw new Error("Relationship not found");
      }

      // Delete the main relationship
      const { error: deleteError } = await supabase
        .from("besties")
        .delete()
        .eq("id", rowId);

      if (deleteError) {
        throw new Error(`Failed to remove: ${deleteError.message}`);
      }

      // If this was an accepted friendship, also remove the reciprocal relationship
      if (relationshipData.status === "accepted") {
        const { error: reciprocalDeleteError } = await supabase
          .from("besties")
          .delete()
          .or(`and(user_id.eq.${relationshipData.bestie_id},bestie_id.eq.${relationshipData.user_id}),and(user_id.eq.${relationshipData.user_id},bestie_id.eq.${relationshipData.bestie_id})`)
          .neq("id", rowId); // Don't delete the one we just deleted

        if (reciprocalDeleteError) {
          console.error("Failed to remove reciprocal relationship:", reciprocalDeleteError);
        }
      }

      console.log("Relationship removed successfully");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bestiesKey(user?.id) }),
  });

  // Improved filtering logic
  const incoming = rows.filter(
    (r) => r.bestie_id === user?.id && r.status === "pending"
  );
  
  const outgoing = rows.filter(
    (r) => r.user_id === user?.id && r.status === "pending"
  );
  
  // Only show unique accepted friendships (avoid duplicates from bidirectional relationships)
  const acceptedMap = new Map();
  rows
    .filter((r) => r.status === "accepted")
    .forEach((r) => {
      const friendId = r.user_id === user?.id ? r.bestie_id : r.user_id;
      const friendData = r.user_id === user?.id ? 
        { id: r.id, user_name: r.user_name, avatar_url: r.avatar_url } :
        { id: r.id, user_name: r.user_name, avatar_url: r.avatar_url };
      
      if (!acceptedMap.has(friendId)) {
        acceptedMap.set(friendId, { ...friendData, friendId });
      }
    });
  
  const accepted = Array.from(acceptedMap.values());

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
          Besties ({accepted.length}/{MAX_BESTIES})
        </h2>
        {accepted.length === 0 && (
          <p className="text-sm text-gray-500">No friends yet.</p>
        )}
        <ul className="space-y-3">
          {accepted.map((b) => (
            <li key={b.friendId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="font-medium">{b.user_name}</span>
              </div>
              <button
                onClick={() => removeReq.mutate(b.id)}
                className="text-xs text-red-500 hover:underline"
                disabled={removeReq.isPending}
              >
                {removeReq.isPending ? "Removing..." : "Remove"}
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
                  disabled={acceptReq.isPending || accepted.length >= MAX_BESTIES}
                >
                  {acceptReq.isPending ? "Accepting..." : "Accept"}
                </button>
                <button
                  onClick={() => removeReq.mutate(b.id)}
                  className="text-xs text-gray-500 hover:underline"
                  disabled={removeReq.isPending}
                >
                  {removeReq.isPending ? "Declining..." : "Decline"}
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
                disabled={removeReq.isPending}
              >
                {removeReq.isPending ? "Canceling..." : "Cancel"}
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
            disabled={!emailToAdd || addReq.isPending || accepted.length >= MAX_BESTIES}
            onClick={() => addReq.mutate(emailToAdd)}
            className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 disabled:opacity-50"
            title={accepted.length >= MAX_BESTIES ? `Maximum ${MAX_BESTIES} besties allowed` : ""}
          >
            {addReq.isPending ? "Adding…" : "Add"}
          </button>
        </div>
        {addReq.isError && (
          <p className="text-xs text-red-500 mt-1">
            {addReq.error?.message}
          </p>
        )}
        {accepted.length >= MAX_BESTIES && (
          <p className="text-xs text-amber-600 mt-1">
            Maximum besties reached ({MAX_BESTIES}/{MAX_BESTIES}). Remove someone to add a new bestie.
          </p>
        )}
      </section>
    </div>
  );
};