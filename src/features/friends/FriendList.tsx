import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { 
  useFriends, 
  useAddFriend, 
  useAcceptFriend, 
  useRemoveFriend 
} from "../../hooks/useFriends";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, UserMinus, Check, X, Users, Send, Search } from "lucide-react";

export const FriendList = () => {
  const { user } = useAuth();
  const [usernameToAdd, setUsernameToAdd] = useState("");

  const { data: rows = [], isLoading, error } = useFriends(user?.id);
  const addReq = useAddFriend();
  const acceptReq = useAcceptFriend();
  const removeReq = useRemoveFriend();

  const MAX_FRIENDS = 10; // Increased for better showcase feel

  const incoming = rows.filter(r => r.addressee_id === user?.id && r.status === "pending");
  const outgoing = rows.filter(r => r.requester_id === user?.id && r.status === "pending");
  const accepted = rows.filter(r => r.status === "accepted");

  if (!user) return (
    <div className="glass-effect rounded-3xl p-8 text-center max-w-md mx-auto mt-20">
      <p className="text-slate-600 font-bold font-outfit">Please sign in to manage friends.</p>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-md mx-auto mt-20 flex flex-col items-center gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full" />
        <p className="font-outfit font-bold text-slate-400 uppercase tracking-widest text-xs">Syncing Connections...</p>
    </div>
  );

  if (error) return (
    <div className="glass-effect rounded-3xl p-8 text-center max-w-md mx-auto mt-20 border-red-100">
      <p className="text-red-500 font-bold font-outfit">Error: {error.message}</p>
    </div>
  );

  const Avatar = ({ url, name }: { url?: string | null, name: string }) => (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-50 to-purple-50 p-0.5 shadow-sm overflow-hidden shrink-0">
        {url ? (
            <img src={url} alt={name} className="w-full h-full object-cover rounded-[0.9rem]" />
        ) : (
            <div className="w-full h-full bg-white flex items-center justify-center text-pink-500 font-black font-outfit">
                {name.charAt(0).toUpperCase()}
            </div>
        )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-6 space-y-10">
        {/* Header */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
        >
            <div className="inline-flex glass-effect rounded-[2rem] p-5 mb-6 border-white/50 shadow-xl">
                 <Users size={40} className="text-pink-500" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-outfit tracking-tight">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Circle</span></h1>
            <p className="text-slate-500 font-medium">Connect with friends to see their peeks.</p>
        </motion.div>

        {/* Add Friend Section */}
        <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-[2.5rem] p-8 border-white/60 shadow-2xl space-y-4"
        >
            <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                      <UserPlus size={18} />
                 </div>
                 <h3 className="font-outfit font-bold text-slate-800">Add Friends</h3>
            </div>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-colors">
                     <Search size={18} />
                </div>
                <input
                    type="text"
                    value={usernameToAdd}
                    onChange={(e) => setUsernameToAdd(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full bg-slate-50/50 focus:bg-white border-2 border-slate-100 focus:border-pink-300 rounded-2xl pl-12 pr-24 py-4 focus:outline-none transition-all duration-300 placeholder-slate-300 font-medium text-sm"
                />
                <button
                    disabled={!usernameToAdd || addReq.isPending || accepted.length >= MAX_FRIENDS}
                    onClick={() => addReq.mutate({ userId: user.id, emailToAdd: usernameToAdd })}
                    className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-xl font-bold text-sm transition-all disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {addReq.isPending ? "..." : <><Send size={14} /> Add</>}
                </button>
            </div>
            {addReq.isError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-2">{addReq.error.message}</p>}
        </motion.section>

        {/* Incoming/Outgoing Requests */}
        <AnimatePresence mode="popLayout">
            {(incoming.length > 0 || outgoing.length > 0) && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6"
                >
                    {incoming.length > 0 && (
                        <section className="space-y-3">
                            <h4 className="font-outfit font-bold text-slate-400 text-[10px] uppercase tracking-widest px-4">Incoming Requests</h4>
                            <div className="space-y-2">
                                {incoming.map(req => (
                                    <div key={req.id} className="glass-effect rounded-2xl p-3 flex items-center justify-between border-white/40 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Avatar url={req.friend_profile.avatar_url} name={req.friend_profile.username || "X"} />
                                            <span className="font-bold text-slate-800 text-sm">{req.friend_profile.display_name || req.friend_profile.username}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => acceptReq.mutate({ userId: user.id, friendshipId: req.id })}
                                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                onClick={() => removeReq.mutate({ userId: user.id, friendshipId: req.id })}
                                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Friends List */}
        <section className="space-y-4">
            <div className="flex items-center justify-between px-4">
                 <h4 className="font-outfit font-bold text-slate-400 text-[10px] uppercase tracking-widest">Your Friends ({accepted.length})</h4>
                 {accepted.length >= MAX_FRIENDS && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Limit Reached</span>}
            </div>
            
            <div className="space-y-3">
                {accepted.length === 0 ? (
                    <div className="glass-effect rounded-[2rem] p-10 text-center border-dashed border-2 border-slate-100">
                         <p className="text-slate-400 font-medium text-sm">No connections yet.</p>
                    </div>
                ) : (
                    accepted.map((friend, index) => (
                        <motion.div 
                            key={friend.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-effect rounded-[1.5rem] p-4 flex items-center justify-between border-white/40 shadow-md group border-b-4 border-b-slate-50 hover:border-b-pink-100 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <Avatar url={friend.friend_profile.avatar_url} name={friend.friend_profile.display_name || friend.friend_profile.username} />
                                <div>
                                     <span className="block font-outfit font-bold text-slate-800 leading-tight">
                                         {friend.friend_profile.display_name || friend.friend_profile.username}
                                     </span>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified Friend</span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeReq.mutate({ userId: user.id, friendshipId: friend.id })}
                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Remove Friend"
                            >
                                <UserMinus size={18} />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </section>
    </div>
  );
};