import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton = ({ className = "", variant = "rectangular" }: SkeletonProps) => {
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-2xl",
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-slate-200/60 backdrop-blur-sm ${variantClasses[variant]} ${className}`}
    />
  );
};

export const PostSkeleton = () => (
  <div className="max-w-md mx-auto w-full glass-effect rounded-3xl p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/4 h-3" />
      </div>
    </div>
    <Skeleton variant="rectangular" className="w-full aspect-square" />
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
    <div className="flex justify-between items-center pt-2">
      <div className="flex gap-4">
        <Skeleton variant="rectangular" className="w-12 h-6" />
        <Skeleton variant="rectangular" className="w-12 h-6" />
      </div>
      <Skeleton variant="text" className="w-20 h-3" />
    </div>
  </div>
);
