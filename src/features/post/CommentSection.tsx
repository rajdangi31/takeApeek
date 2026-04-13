import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useComments, useAddComment } from "../../hooks/usePost";
import { CommentItem } from "./CommentItem";
import type { EnrichedComment } from "../../hooks/usePost";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Sparkles } from "lucide-react";

interface Props {
  postId: string;
}

export const CommentSection = ({ postId }: Props) => {
  const [newCommentText, setNewCommentText] = useState("");
  const { user } = useAuth();
  
  const { data: comments, isLoading, error } = useComments(postId);
  const { mutate, isPending, isError } = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText || !user) return;
    
    mutate({ 
      userId: user.id, 
      postId, 
      content: newCommentText 
    }, {
      onSuccess: () => setNewCommentText("")
    });
  };

  /* Map of Comments - Organize Replies - Return Tree */
  const buildCommentTree = (flatComments: EnrichedComment[]): (EnrichedComment & { children: EnrichedComment[] })[] => {
    const map = new Map<string, EnrichedComment & { children: EnrichedComment[] }>();
    const roots: (EnrichedComment & { children: EnrichedComment[] })[] = [];

    flatComments.forEach((c) => {
      map.set(c.id, { ...c, children: [] });
    });

    flatComments.forEach((c) => {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) {
          parent.children.push(map.get(c.id)!);
        }
      } else {
        roots.push(map.get(c.id)!);
      }
    });

    return roots;
  };
   
  if (isLoading) return (
    <div className="flex flex-col items-center py-10 gap-3">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Conversation...</span>
    </div>
  );

  if (error) return (
    <div className="p-6 glass-effect rounded-3xl border-red-100 text-center">
        <p className="text-red-500 font-bold text-sm">Failed to load comments.</p>
    </div>
  );

  const commentTree = comments ? buildCommentTree(comments) : []; 

  return (
    <div className="glass-effect rounded-[2.5rem] p-6 md:p-8 border-white/60 shadow-xl space-y-8">
      <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                     <MessageCircle size={20} />
                </div>
                <div>
                     <h3 className="font-outfit font-black text-slate-900 tracking-tight">Conversation</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comments?.length || 0} Responses</p>
                </div>
            </div>
            <div className="opacity-20"><Sparkles size={20} /></div>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={newCommentText}
            rows={3}
            placeholder="Add to the story..."
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-300 resize-none shadow-inner"
          />
          <button
            type="submit"
            disabled={!newCommentText || isPending}
            className="absolute bottom-4 right-4 bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <Send size={18} />
            )}
          </button>
          {isError && <p className="text-[10px] font-bold text-red-500 mt-2 px-4 uppercase tracking-widest">Post encounterd an error.</p>}
        </form>
      )}

      <div className="space-y-6">
        <AnimatePresence initial={false}>
            {commentTree.length > 0 ? (
                commentTree.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} postId={postId}/>
                ))
            ) : (
                <div className="py-10 text-center space-y-2 opacity-30">
                     <p className="text-4xl">💭</p>
                     <p className="text-sm font-bold font-outfit uppercase tracking-widest">No words yet.</p>
                </div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
