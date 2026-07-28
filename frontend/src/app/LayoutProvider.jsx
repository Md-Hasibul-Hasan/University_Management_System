"use client";

import { ThemeProvider } from "@/components/sidebar/theme-provider";
import StoreProvider from "@/components/auth/StoreProvider";
import AuthProvider from "@/components/auth/AuthProvider";

export default function LayoutProvider({ children }) {
  return (
    <StoreProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </StoreProvider>
  );
}