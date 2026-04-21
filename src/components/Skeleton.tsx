export default function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-slate-200 rounded-xl ${className}`}
            style={{
                animationDuration: '1.5s',
                backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                backgroundSize: '200% 100%',
                backgroundRepeat: 'no-repeat',
            }}
        />
    );
}
