import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, UserPlus, TrendingUp } from "lucide-react";
import { useSearch, useSuggestions } from "../../hooks/useSearch";
import { motion, AnimatePresence } from "framer-motion";

export const SidebarRight = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const { data: searchResults, isLoading: searching } = useSearch(searchTerm);
    const { data: suggestions, isLoading: loadingSuggestions } = useSuggestions();

    return (
        <aside className="fixed right-0 top-0 bottom-0 w-[380px] h-screen px-8 py-10 space-y-10 hidden xl:flex flex-col">
            {/* Search Section */}
            <div className="space-y-4">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Discover Peeks..."
                        className="w-full pl-14 pr-6 py-4 bg-white/50 border border-white rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:bg-white transition-all shadow-sm"
                    />
                </div>

                <AnimatePresence>
                    {searchTerm.length > 1 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-effect rounded-[2rem] p-4 border-white/80 shadow-2xl space-y-2 overflow-hidden"
                        >
                            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results</p>
                            {searching ? (
                                <div className="p-4 text-center text-slate-400 animate-pulse text-xs font-bold uppercase tracking-widest">Searching...</div>
                            ) : searchResults && searchResults.length > 0 ? (
                                searchResults.map(profile => (
                                    <Link 
                                        key={profile.id}
                                        to={`/profile/${profile.id}`}
                                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center overflow-hidden shrink-0 border border-white shadow-sm">
                                             {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                             ) : (
                                                <span className="text-pink-600 font-bold text-sm font-outfit">{(profile.display_name || profile.username).charAt(0).toUpperCase()}</span>
                                             )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 font-outfit truncate">{profile.display_name || profile.username}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">@{profile.username}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-4 text-center text-slate-400 text-xs font-medium">No one found. Try another peek?</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Suggestions Section */}
            <div className="glass-effect rounded-[2.5rem] p-8 border-white/60 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className="p-2 bg-pink-50 rounded-lg text-pink-500">
                             <Sparkles size={16} />
                         </div>
                         <h3 className="font-outfit font-black text-slate-900 tracking-tight">Who to Follow</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {loadingSuggestions ? (
                        [1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />)
                    ) : suggestions && suggestions.length > 0 ? (
                        suggestions.map(profile => (
                            <Link 
                                key={profile.id} 
                                to={`/profile/${profile.id}`}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                     {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                     ) : (
                                        <span className="text-pink-500 font-black text-lg font-outfit">{(profile.display_name || profile.username).charAt(0).toUpperCase()}</span>
                                     )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 font-outfit truncate">{profile.display_name || profile.username}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">@{profile.username}</p>
                                </div>
                                <div className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-colors">
                                    <UserPlus size={18} />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-xs text-slate-400 text-center font-medium">No suggestions right now.</p>
                    )}
                </div>

                <button className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-pink-600 transition-colors border-t border-slate-50 pt-4 mt-2">
                    Show More Discoveries
                </button>
            </div>

            {/* Trending / Meta Section */}
            <div className="px-8 space-y-6">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <TrendingUp size={12} /> Peaks of the Day
                 </div>
                 <div className="space-y-4">
                      {[ 
                        { tag: "#SummerVibes", count: "14.2k Peeks" },
                        { tag: "#ToledoArt", count: "3.5k Peeks" },
                        { tag: "#CoffeeMoments", count: "8.1k Peeks" }
                      ].map(trend => (
                        <div key={trend.tag} className="group cursor-pointer">
                            <p className="text-sm font-extrabold text-slate-700 font-outfit group-hover:text-pink-600 transition-colors">{trend.tag}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{trend.count}</p>
                        </div>
                      ))}
                 </div>
            </div>

            {/* Footer */}
            <div className="mt-auto px-8 py-6 opacity-30">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     © 2026 TakeAPeek Inc. <br/>
                     Designed for Discovery.
                 </p>
            </div>
        </aside>
    );
};
