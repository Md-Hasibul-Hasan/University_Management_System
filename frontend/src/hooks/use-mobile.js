import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getViewportWidth() {
  if (typeof window === "undefined") return 0
  return (
    window.visualViewport?.width ||
    window.innerWidth ||
    document.documentElement.clientWidth ||
    0
  )
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => {
    return getViewportWidth() < MOBILE_BREAKPOINT
  })

  React.useLayoutEffect(() => {
    const onChange = () => {
      setIsMobile(getViewportWidth() < MOBILE_BREAKPOINT)
    }

    onChange()
    window.addEventListener("resize", onChange)
    window.visualViewport?.addEventListener("resize", onChange)

    return () => {
      window.removeEventListener("resize", onChange)
      window.visualViewport?.removeEventListener("resize", onChange)
    }
  }, [])

  return isMobile
}
