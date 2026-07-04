// GET /api/auth/logout — clear the session cookie and go home.
import { redirect, setCookie } from '../_lib/http.js'
import { SESSION_COOKIE } from '../_lib/session.js'

export default async function handler(req, res) {
  setCookie(res, SESSION_COOKIE, '', { maxAge: 0 })
  redirect(res, '/')
}
