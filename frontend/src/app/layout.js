import "./globals.css";
import LayoutProvider from "./LayoutProvider";

const initialThemeScript = `
(function() {
  try {
    var storageKey = 'theme';
    var storedTheme = localStorage.getItem(storageKey);
    var enableSystem = true;
    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = storedTheme || (enableSystem ? 'system' : 'light');
    var resolved = theme === 'system' ? systemTheme : theme;
    // Auth pages always render in light mode (keep in sync with LayoutProvider).
    var p = window.location.pathname;
    var isAuth = /^\\/login$/.test(p) ||
      /^\\/verify-email(\\/|$)/.test(p) ||
      /^\\/student\\/register(\\/|$)/.test(p) ||
      /^\\/teacher\\/register(\\/|$)/.test(p);
    if (isAuth) resolved = 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    if (resolved === 'light' || resolved === 'dark') {
      document.documentElement.style.colorScheme = resolved;
    }
    // Selected color theme (theme1/blue/green/violet/amber/rose), applied
    // before paint so there is no flash of the default palette.
    var colorTheme = localStorage.getItem('theme-color') || 'default';
    if (colorTheme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', colorTheme);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}