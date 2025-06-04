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

export interface BestieRow {
  id: number;
  user_id: string;
  bestie_id: string;
  status: "pending" | "accepted";
  avatar_url: string;
  user_name: string;
  created_at: string;
}

const bestiesKey = (uid?: string): QueryKey => ["besties", uid ?? "none"];
const MAX_BESTIES = 5;

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
      const { data: relationships, error: relError } = await supabase
        .from("besties")
        .select("*")
        .or(`user_id.eq.${user.id},bestie_id.eq.${user.id}`);
      if (relError) throw relError;
      if (!relationships) return [];

      const enrichedRows = await Promise.all(
        relationships.map(async (row) => {
          const friendId = row.user_id === user.id ? row.bestie_id : row.user_id;
          const { data: friendProfile } = await supabase
            .from("user_profiles")
            .select("user_name, avatar_url, email")
            .eq("id", friendId)
            .single();
          return {
            ...row,
            user_name: friendProfile?.user_name || friendProfile?.email || "Unknown User",
            avatar_url: friendProfile?.avatar_url || "/avatar-placeholder.png",
          };
        })
      );
      return enrichedRows as BestieRow[];
    },
  });

  const addReq = useMutation<void, Error, string>({
    mutationFn: async (email) => {
      if (!user) throw new Error("Not signed in");
      if (accepted.length >= MAX_BESTIES) throw new Error(`Max ${MAX_BESTIES} besties reached`);
      const normalized = email.toLowerCase().trim();
      let { data: found } = await supabase
        .from("user_profiles")
        .select("id, avatar_url, user_name, email")
        .eq("email", normalized)
        .maybeSingle();
      if (!found) {
        const res = await supabase
          .from("user_profiles")
          .select("id, avatar_url, user_name, email")
          .ilike("email", normalized)
          .maybeSingle();
        found = res.data;
      }
      if (!found) throw new Error("No user with that email");
      if (found.id === user.id) throw new Error("Cannot add yourself");
      const { data: existing } = await supabase
        .from("besties")
        .select("status")
        .or(`and(user_id.eq.${user.id},bestie_id.eq.${found.id}),and(user_id.eq.${found.id},bestie_id.eq.${user.id})`)
        .maybeSingle();
      if (existing) {
        if (existing.status === "accepted") throw new Error("Already besties");
        else throw new Error("Request already exists");
      }
      const { error } = await supabase.from("besties").insert({
        user_id: user.id,
        bestie_id: found.id,
        status: "pending",
        avatar_url: found.avatar_url ?? "/avatar-placeholder.png",
        user_name: found.user_name ?? found.email?.split("@")[0] ?? "Unknown",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmailToAdd("");
      qc.invalidateQueries({ queryKey: bestiesKey(user?.id) });
    },
  });

  const acceptReq = useMutation<void, Error, number>({
    mutationFn: async (rowId) => {
      if (!user) throw new Error("Not signed in");
      const { data: request } = await supabase
        .from("besties")
        .select("*")
        .eq("id", rowId)
        .single();
      if (!request || request.bestie_id !== user.id) throw new Error("Not your request");
      if (accepted.length >= MAX_BESTIES) throw new Error(`Max ${MAX_BESTIES} besties reached`);
      await supabase.from("besties").update({ status: "accepted" }).eq("id", rowId);
      const { data: requester } = await supabase
        .from("user_profiles")
        .select("user_name, avatar_url, email")
        .eq("id", request.user_id)
        .single();
      await supabase.from("besties").insert({
        user_id: request.bestie_id,
        bestie_id: request.user_id,
        status: "accepted",
        avatar_url: requester?.avatar_url ?? "/avatar-placeholder.png",
        user_name: requester?.user_name ?? requester?.email?.split("@")[0] ?? "Unknown",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bestiesKey(user?.id) }),
  });

  const removeReq = useMutation<void, Error, number>({
    mutationFn: async (rowId) => {
      if (!user) throw new Error("Not signed in");
      const { data: rel } = await supabase.from("besties").select("*").eq("id", rowId).single();
      await supabase.from("besties").delete().eq("id", rowId);
      if (rel?.status === "accepted") {
        await supabase.from("besties").delete().or(
          `and(user_id.eq.${rel.bestie_id},bestie_id.eq.${rel.user_id}),and(user_id.eq.${rel.user_id},bestie_id.eq.${rel.bestie_id})`
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: bestiesKey(user?.id) }),
  });

  const incoming = rows.filter((r) => r.bestie_id === user?.id && r.status === "pending");
  const outgoing = rows.filter((r) => r.user_id === user?.id && r.status === "pending");
  const acceptedMap = new Map<string, { id: number; friendId: string; user_name: string; avatar_url: string }>();
  rows.filter((r) => r.status === "accepted").forEach((r) => {
    const friendId = r.user_id === user?.id ? r.bestie_id : r.user_id;
    if (!acceptedMap.has(friendId)) {
      acceptedMap.set(friendId, { id: r.id, friendId, user_name: r.user_name, avatar_url: r.avatar_url });
    }
  });
  const accepted = Array.from(acceptedMap.values());

  if (!user) return <p className="text-center mt-6 text-fuchsia-500">Please sign in.</p>;
  if (isLoading) return <p className="text-center mt-6 text-fuchsia-400">Loading…</p>;
  if (error) return <p className="text-center mt-6 text-red-400">{error.message}</p>;

  const Avatar = ({ url }: { url: string }) => (
    <img src={url || "/avatar-placeholder.png"} alt="avatar" className="w-10 h-10 rounded-full" />
  );

  return (
    <div className="max-w-lg mx-auto mt-8 bg-black/60 border border-fuchsia-700/30 backdrop-blur-md shadow-2xl rounded-xl p-6 space-y-8">
      <section>
        <h2 className="text-lg font-bold text-fuchsia-400 mb-2">
          Besties ({accepted.length}/{MAX_BESTIES})
        </h2>
        {accepted.length === 0 && <p className="text-sm text-fuchsia-500">No friends yet.</p>}
        <ul className="space-y-3">
          {accepted.map((b) => (
            <li key={b.friendId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="text-white font-medium">{b.user_name}</span>
              </div>
              <button onClick={() => removeReq.mutate(b.id)} className="text-xs text-red-400 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-fuchsia-400 font-semibold mb-2">Incoming requests</h3>
        {incoming.length === 0 && <p className="text-sm text-fuchsia-500">None.</p>}
        <ul className="space-y-3">
          {incoming.map((b) => (
            <li key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="text-white font-medium">{b.user_name}</span>
              </div>
              <div className="space-x-2">
                <button onClick={() => acceptReq.mutate(b.id)} className="text-xs text-green-400 hover:underline">
                  Accept
                </button>
                <button onClick={() => removeReq.mutate(b.id)} className="text-xs text-fuchsia-400 hover:underline">
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-fuchsia-400 font-semibold mb-2">Outgoing requests</h3>
        {outgoing.length === 0 && <p className="text-sm text-fuchsia-500">None.</p>}
        <ul className="space-y-3">
          {outgoing.map((b) => (
            <li key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar url={b.avatar_url} />
                <span className="text-white font-medium">{b.user_name}</span>
              </div>
              <button onClick={() => removeReq.mutate(b.id)} className="text-xs text-fuchsia-400 hover:underline">
                Cancel
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-4 border-t border-fuchsia-800/40">
        <h3 className="text-fuchsia-400 font-semibold mb-2">Add a bestie</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailToAdd}
            onChange={(e) => setEmailToAdd(e.target.value)}
            placeholder="friend@example.com"
            className="flex-grow bg-black/40 border border-fuchsia-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <button
            disabled={!emailToAdd || addReq.isPending || accepted.length >= MAX_BESTIES}
            onClick={() => addReq.mutate(emailToAdd)}
            className="bg-fuchsia-600 text-white px-4 py-2 rounded hover:bg-fuchsia-700 disabled:opacity-50"
          >
            {addReq.isPending ? "Adding…" : "Add"}
          </button>
        </div>
        {addReq.isError && (
          <p className="text-xs text-red-400 mt-1">{addReq.error?.message}</p>
        )}
        {accepted.length >= MAX_BESTIES && (
          <p className="text-xs text-yellow-400 mt-1">
            Maximum besties reached. Remove one to add more.
          </p>
        )}
      </section>
    </div>
  );
};
