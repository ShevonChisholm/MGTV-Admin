import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

export interface Route {
  section: string
  parts: string[]
  path: string
}

function parse(): Route {
  const raw = window.location.pathname.replace(/\/+$/, "")
  const segs = raw.split("/").filter(Boolean)
  if (segs[0] === "admin") segs.shift()
  return { section: segs[0] ?? "", parts: segs.slice(1), path: raw || "/" }
}

type Guard = () => boolean
let guards = new Set<Guard>()

export function isDirty() {
  for (const g of guards) if (g()) return true
  return false
}

interface PendingNav {
  to: string | number
}

interface RouterCtx {
  route: Route
  navigate: (to: string, opts?: { replace?: boolean }) => void
  pending: PendingNav | null
  resolvePending: (proceed: boolean) => void
}

const Ctx = createContext<RouterCtx | null>(null)

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<Route>(parse)
  const [pending, setPending] = useState<PendingNav | null>(null)
  const routeRef = useRef(route)
  routeRef.current = route
  const skipPop = useRef(false)

  useEffect(() => {
    const p = parse()
    if (p.section === "" || (window.location.pathname === "/admin")) {
      window.history.replaceState(null, "", "/admin/dashboard")
      setRoute(parse())
    }
  }, [])

  useEffect(() => {
    const onPop = () => {
      if (skipPop.current) {
        skipPop.current = false
        setRoute(parse())
        return
      }
      if (isDirty()) {
        // restore previous URL, then ask
        const target = window.location.pathname
        window.history.pushState(null, "", routeRef.current.path)
        setPending({ to: target })
        return
      }
      setRoute(parse())
    }
    const onBefore = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("popstate", onPop)
    window.addEventListener("beforeunload", onBefore)
    return () => {
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("beforeunload", onBefore)
    }
  }, [])

  const go = useCallback((to: string, replace?: boolean) => {
    if (replace) window.history.replaceState(null, "", to)
    else window.history.pushState(null, "", to)
    setRoute(parse())
    window.scrollTo(0, 0)
  }, [])

  const navigate = useCallback(
    (to: string, opts?: { replace?: boolean }) => {
      if (to === routeRef.current.path) return
      if (isDirty()) {
        setPending({ to })
        return
      }
      go(to, opts?.replace)
    },
    [go],
  )

  const resolvePending = useCallback(
    (proceed: boolean) => {
      const p = pending
      setPending(null)
      if (!p || !proceed) return
      go(p.to as string)
    },
    [pending, go],
  )

  return <Ctx.Provider value={{ route, navigate, pending, resolvePending }}>{children}</Ctx.Provider>
}

export function useRouter() {
  const c = useContext(Ctx)
  if (!c) throw new Error("RouterProvider missing")
  return c
}

export function useDirtyGuard(isDirtyFn: () => boolean) {
  const ref = useRef(isDirtyFn)
  ref.current = isDirtyFn
  useEffect(() => {
    const g: Guard = () => ref.current()
    guards.add(g)
    return () => {
      guards.delete(g)
    }
  }, [])
}

export function Link({
  to,
  children,
  style,
  className,
  onClick,
  ...rest
}: { to: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const { navigate } = useRouter()
  return (
    <a
      {...rest}
      href={to}
      className={className}
      style={style}
      onClick={(e) => {
        onClick?.(e)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
