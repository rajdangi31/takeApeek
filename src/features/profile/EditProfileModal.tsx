import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, FileText, Globe } from "lucide-react";
import { useState } from "react";
import { useUpdateProfile } from "../../hooks/useProfile";
import type { Profile } from "../../types/database";

interface Props {
    profile: Profile;
    onClose: () => void;
}

export const EditProfileModal = ({ profile, onClose }: Props) => {
    const updateProfile = useUpdateProfile();
    const [formData, setFormData] = useState({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        website: profile.website || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile.mutateAsync({
                id: profile.id,
                updates: formData,
            });
            onClose();
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-lg glass-effect-dark rounded-[2.5rem] overflow-hidden border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative z-10"
                >
                    <div className="p-8 space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-outfit font-black text-2xl text-white tracking-tight">
                                Edit Identity
                            </h3>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                                     <User size={12} className="text-pink-400" /> Public Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                    placeholder="Soul Singer"
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-colors font-medium shadow-inner"
                                />
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                                     <FileText size={12} className="text-pink-400" /> Your Story
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Designer by day, peeker by night."
                                    rows={4}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-colors font-medium shadow-inner resize-none"
                                />
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                                     <Globe size={12} className="text-pink-400" /> Digital Home
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    placeholder="https://mysite.com"
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-colors font-medium shadow-inner"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={updateProfile.isPending}
                                    className="w-full py-5 bg-pink-500 hover:bg-pink-600 rounded-[1.8rem] text-white font-black font-outfit uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-pink-500/20"
                                >
                                    {updateProfile.isPending ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <>
                                            <Save size={18} /> Update Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
