export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-1.5 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
        <p>
          &copy; {new Date().getFullYear()} University Management System. All rights reserved.
        </p>
        <p className="text-muted-foreground/80">KiU Management System</p>
      </div>
    </footer>
  );
}
