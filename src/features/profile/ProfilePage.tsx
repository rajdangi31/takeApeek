import { useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useProfile, useUserPosts } from "../../hooks/useProfile";
import { motion } from "framer-motion";
import { PostSkeleton } from "../../components/ui/Skeleton";
import { Settings, Grid, Users, Heart, MessageCircle, MapPin, Link as LinkIcon, Edit3 } from "lucide-react";
import { useState } from "react";
import { EditProfileModal } from "./EditProfileModal";

export const ProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const targetUserId = id || currentUser?.id;
    const isOwnProfile = targetUserId === currentUser?.id;

    const { data: profile, isLoading: profileLoading } = useProfile(targetUserId);
    const { data: posts, isLoading: postsLoading } = useUserPosts(targetUserId);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (profileLoading || !targetUserId) return <div className="py-20"><PostSkeleton /></div>;

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <span className="text-6xl mb-4">🕵️‍♂️</span>
            <h2 className="text-2xl font-bold font-outfit text-slate-900">Profile Not Found</h2>
            <p className="font-medium">This user might have vanished into the void.</p>
        </div>
    );

    const displayName = profile.display_name || profile.username || "Anonymous";

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-12">
            {/* Profile Header */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-[3rem] p-8 md:p-12 border-white/60 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                     <Settings size={180} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
                    {/* Avatar Container */}
                    <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-tr from-pink-500 to-purple-600 p-1.5 shadow-2xl -rotate-2">
                             <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                        <span className="text-pink-500 text-4xl font-black font-outfit uppercase">
                                            {displayName.charAt(0)}
                                        </span>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black font-outfit text-slate-900 tracking-tight">
                                    {displayName}
                                </h1>
                                <p className="text-pink-500 font-bold text-sm tracking-wide">@{profile.username}</p>
                            </div>
                            
                            {isOwnProfile && (
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 self-center md:self-start"
                                >
                                    <Edit3 size={14} /> Edit Profile
                                </button>
                            )}
                        </div>

                        {/* Bio Section */}
                        <div className="space-y-4">
                            <p className="text-slate-600 font-medium leading-relaxed max-w-lg">
                                {profile.bio || "No bio yet. Just here to peek! 👀"}
                            </p>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-pink-400" />
                                    <span>Toledo, OH</span> {/* Placeholder or from user metadata */}
                                </div>
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
                                        <LinkIcon size={12} className="text-pink-400" />
                                        <span>Personal Site</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center md:justify-start gap-8 pt-4">
                            <div className="text-center md:text-left">
                                <div className="text-2xl font-black font-outfit text-slate-900">{posts?.length || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peeks</div>
                            </div>
                            <div className="text-center md:text-left border-x border-slate-100 px-8">
                                <div className="text-2xl font-black font-outfit text-slate-900">--</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Friends</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="text-2xl font-black font-outfit text-slate-900">
                                    {(posts || []).reduce((acc, p) => acc + (p.like_count || 0), 0)}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loves</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Grid Header */}
            <div className="flex items-center gap-4 px-4 overflow-hidden">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200">
                    <Grid size={14} /> My Feed
                </div>
                <div className="h-px bg-slate-100 flex-1 opacity-50" />
            </div>

            {/* Posts Grid */}
            {postsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="aspect-square glass-effect rounded-[2rem] animate-pulse" />)}
                </div>
            ) : posts && posts.length > 0 ? (
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
                >
                    {posts.map((post) => (
                        <motion.div
                            key={post.id}
                            variants={{
                                hidden: { opacity: 0, scale: 0.9 },
                                visible: { opacity: 1, scale: 1 }
                            }}
                            className="group relative aspect-square glass-effect rounded-[2.2rem] overflow-hidden border-white/40 shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                            <Link to={`/post/${post.id}`} className="absolute inset-0 z-10" />
                            {post.image_url ? (
                                <img src={post.image_url} alt="Peek" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center p-6 italic text-slate-400 text-xs text-center line-clamp-3">
                                    {post.content}
                                </div>
                            )}
                            
                            {/* Overlay Info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <div className="flex items-center gap-4 text-white text-xs font-bold">
                                    <span className="flex items-center gap-1.5"><Heart size={14} fill="currentColor" /> {post.like_count}</span>
                                    <span className="flex items-center gap-1.5"><MessageCircle size={14} fill="currentColor" /> {post.comment_count}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="glass-effect rounded-[3rem] p-20 border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-6xl grayscale opacity-50">📸</div>
                    <h3 className="text-xl font-black font-outfit text-slate-800 tracking-tight">No Peeks Yet</h3>
                    <p className="text-slate-400 font-medium text-sm">Start sharing your moments with the world.</p>
                    <Link to="/shareApost" className="text-pink-500 font-bold uppercase tracking-widest text-xs hover:text-pink-600 transition-colors">Create First Post</Link>
                </div>
            )}

            {isEditModalOpen && (
                <EditProfileModal 
                    profile={profile} 
                    onClose={() => setIsEditModalOpen(false)} 
                />
            )}
        </div>
    );
};
