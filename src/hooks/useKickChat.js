import { useCallback, useEffect, useRef, useState } from 'react'

// Kick's public chat runs on Pusher. These are the same public values the
// site itself uses in the browser — no account, token or app config involved,
// which is precisely why this path needs no setup to work.
const PUSHER_KEY = '32cbd69e4b950bf97679'
const WS_URL = `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=7.4.0&flash=false`
const CHAT_EVENT = 'App\\Events\\ChatMessageEvent'

const RECONNECT_MS = 3000

/**
 * Read a Kick channel's chat directly from the browser.
 *
 * Runs only while the picker is collecting. `onMessage` gets every chat
 * message; the caller decides what counts. Nothing here is trusted for
 * eligibility — matches are posted to the server, which re-checks the
 * keyword, the account link and the Discord role before recording anything.
 */
export function useKickChat({ chatroomId, active, onMessage }) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)
  const retryRef = useRef(null)
  const handlerRef = useRef(onMessage)

  // keep the latest handler without tearing the socket down on every render
  useEffect(() => { handlerRef.current = onMessage }, [onMessage])

  const connect = useCallback(() => {
    if (!chatroomId) return
    clearTimeout(retryRef.current)

    let ws
    try {
      ws = new WebSocket(WS_URL)
    } catch (err) {
      setError(err.message)
      return
    }
    socketRef.current = ws

    ws.onopen = () => setError(null)

    ws.onmessage = (raw) => {
      let frame
      try {
        frame = JSON.parse(raw.data)
      } catch {
        return
      }

      if (frame.event === 'pusher:connection_established') {
        setConnected(true)
        ws.send(JSON.stringify({
          event: 'pusher:subscribe',
          data: { channel: `chatrooms.${chatroomId}.v2` },
        }))
        return
      }

      if (frame.event !== CHAT_EVENT) return

      // Pusher nests the payload as a JSON *string*
      let msg
      try {
        msg = typeof frame.data === 'string' ? JSON.parse(frame.data) : frame.data
      } catch {
        return
      }

      const sender = msg?.sender
      if (!sender?.id) return
      handlerRef.current?.({
        kickUserId: String(sender.id),
        kickUsername: sender.username || sender.slug || '',
        kickAvatar: sender.profile_pic || null,
        content: String(msg.content ?? ''),
      })
    }

    ws.onerror = () => setError('Chat connection error')

    ws.onclose = () => {
      setConnected(false)
      socketRef.current = null
      // only climb back on if the caller still wants us listening
      retryRef.current = setTimeout(() => {
        if (socketRef.current === null) connect()
      }, RECONNECT_MS)
    }
  }, [chatroomId])

  useEffect(() => {
    if (!active || !chatroomId) return undefined
    connect()
    return () => {
      clearTimeout(retryRef.current)
      const ws = socketRef.current
      socketRef.current = null
      // null it first so onclose doesn't schedule a reconnect on teardown
      if (ws) {
        ws.onclose = null
        ws.close()
      }
      setConnected(false)
    }
  }, [active, chatroomId, connect])

  return { connected, error }
}
