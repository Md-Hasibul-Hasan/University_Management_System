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
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    if (resolved === 'light' || resolved === 'dark') {
      document.documentElement.style.colorScheme = resolved;
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