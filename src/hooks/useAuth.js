import { useEffect, useState } from 'react'

// Session info from /api/auth/me, shared app-wide via a module cache.
let cached = null
let promise = null
const listeners = new Set()

function load() {
  if (!promise) {
    promise = fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        cached = data
        listeners.forEach((fn) => fn())
      })
      .catch(() => {
        cached = { user: null, isAdmin: false }
        listeners.forEach((fn) => fn())
      })
  }
  return promise
}

export function useAuth() {
  const [, force] = useState(0)

  useEffect(() => {
    const bump = () => force((n) => n + 1)
    listeners.add(bump)
    load()
    return () => listeners.delete(bump)
  }, [])

  return {
    loading: cached === null,
    user: cached?.user ?? null,
    isAdmin: cached?.isAdmin ?? false,
  }
}

export const loginUrl = '/api/auth/login'
export const logoutUrl = '/api/auth/logout'
