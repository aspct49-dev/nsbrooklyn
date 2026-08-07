// Site settings (leaderboard periods, raffles, giveaways) as one JSON blob.
// The storage backends themselves live in ./store.js.
import { getJson, setJson } from './store.js'

const KEY = 'nsb:settings'

export const getSettings = () => getJson(KEY, null)
export const saveSettings = (settings) => setJson(KEY, settings)
