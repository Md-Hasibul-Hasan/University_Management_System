"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/sidebar/theme-provider";
import StoreProvider from "@/components/auth/StoreProvider";
import AuthProvider from "@/components/auth/AuthProvider";

// Routes that must always render in light mode, regardless of saved theme.
const AUTH_ROUTE_PATTERNS = [
  /^\/login$/,
  /^\/verify-email(\/|$)/,
  /^\/student\/register(\/|$)/,
  /^\/teacher\/register(\/|$)/,
];

function isAuthRoute(pathname) {
  return AUTH_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname ?? ""));
}

export default function LayoutProvider({ children }) {
  const pathname = usePathname();

  return (
    <StoreProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          forcedTheme={isAuthRoute(pathname) ? "light" : undefined}
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </StoreProvider>
  );
}