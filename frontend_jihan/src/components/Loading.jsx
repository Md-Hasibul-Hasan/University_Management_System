export default function LoadingPage() {
    return (
        <div className="min-h-screen p-6 bg-background text-foreground animate-pulse">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="h-10 w-64 rounded-lg bg-muted/20 border border-border/20 shadow-sm shadow-black/5 dark:bg-muted/30 dark:border-border/50 dark:shadow-white/5" />

                {/* Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="h-32 rounded-xl bg-muted/20 border border-border/20 shadow-sm shadow-black/5 dark:bg-muted/30 dark:border-border/50 dark:shadow-white/5" />
                    <div className="h-32 rounded-xl bg-muted/20 border border-border/20 shadow-sm shadow-black/5 dark:bg-muted/30 dark:border-border/50 dark:shadow-white/5" />
                    <div className="h-32 rounded-xl bg-muted/20 border border-border/20 shadow-sm shadow-black/5 dark:bg-muted/30 dark:border-border/50 dark:shadow-white/5" />
                </div>

                {/* Content */}
                <div className="rounded-xl bg-muted/20 border border-border/20 shadow-sm shadow-black/5 dark:bg-muted/30 dark:border-border/50 dark:shadow-white/5 h-96" />
            </div>
        </div>
    );
}