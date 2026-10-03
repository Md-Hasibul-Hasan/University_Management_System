"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/sidebar/theme-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STORAGE_KEY = "theme-color"

// Selectable accent palettes, applied via data-theme on <html>. The actual
// colors live in globals.css under :root[data-theme="..."] / .dark[data-theme="..."].
export const COLOR_THEMES = [
  { id: "default", label: "Default", swatch: "bg-neutral-700 dark:bg-neutral-200" },
  { id: "blue", label: "Ocean Blue", swatch: "bg-blue-600 dark:bg-blue-400" },
  { id: "green", label: "Forest Green", swatch: "bg-emerald-600 dark:bg-emerald-400" },
  { id: "violet", label: "Royal Violet", swatch: "bg-violet-600 dark:bg-violet-400" },
  { id: "amber", label: "Warm Amber", swatch: "bg-amber-600 dark:bg-amber-400" },
  { id: "rose", label: "Rose Red", swatch: "bg-rose-600 dark:bg-rose-400" },
]

function applyColorTheme(id) {
  const root = document.documentElement
  if (id === "default") root.removeAttribute("data-theme")
  else root.setAttribute("data-theme", id)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [colorTheme, setColorTheme] = React.useState("default")

  // Read the persisted palette once mounted (avoids SSR mismatch).
  React.useEffect(() => {
    try {
      setColorTheme(localStorage.getItem(STORAGE_KEY) || "default")
    } catch {
      /* ignore */
    }
  }, [])

  const chooseColor = (id) => {
    setColorTheme(id)
    applyColorTheme(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Color theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={colorTheme} onValueChange={chooseColor}>
          {COLOR_THEMES.map((t) => (
            <DropdownMenuRadioItem key={t.id} value={t.id}>
              <span
                className={`mr-2 h-3.5 w-3.5 shrink-0 rounded-full ${t.swatch}`}
              />
              {t.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
