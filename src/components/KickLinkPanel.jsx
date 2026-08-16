import { useKickLink, kickLinkUrl } from '../hooks/useKickLink'
import { IconKick, IconExternal } from './icons'

const ROLE_HELP = {
  'not-in-server': 'Join the Discord server to be eligible.',
  'missing-role': "You're in the server but don't have the required role yet.",
  'bot-forbidden': 'Role checking is temporarily unavailable.',
  'role-gate-not-configured': 'Role checking is not set up yet.',
}

/**
 * Link your Kick account so typing the keyword in the stream chat enters you.
 * Only shown when there's actually a keyword giveaway to enter.
 */
export default function KickLinkPanel({ user, discordUrl }) {
  const { loading, linked, kickName, roleGate, hasRole, roleReason } = useKickLink(Boolean(user))

  if (!user) return null
  if (loading) return null

  return (
    <div className={`kick-panel ${linked ? 'ok' : ''}`}>
      <div className="kick-panel-ic"><IconKick /></div>

      <div className="kick-panel-text">
        {linked ? (
          <>
            <h4>Kick linked — <span className="kick-name">{kickName}</span></h4>
            <p>
              Typing the keyword in the stream chat enters you automatically.
              {roleGate && hasRole === true && ' Your Discord role checks out.'}
              {roleGate && hasRole === false && (
                <> <span className="warn">{ROLE_HELP[roleReason] || 'Your Discord role could not be verified.'}</span></>
              )}
            </p>
          </>
        ) : (
          <>
            <h4>Link your Kick account</h4>
            <p>
              Chat entries are matched to your Discord account, so link Kick once and
              typing the keyword in the stream enters you.
              {roleGate && ' The required Discord role is checked when you enter.'}
            </p>
          </>
        )}
      </div>

      <div className="kick-panel-actions">
        {!linked && (
          <a className="gv-enter kick" href={kickLinkUrl}>
            <IconKick /> Link Kick
          </a>
        )}
        {linked && roleGate && hasRole === false && discordUrl && (
          <a className="gv-enter discord" href={discordUrl} target="_blank" rel="noreferrer">
            Join Discord <IconExternal />
          </a>
        )}
      </div>
    </div>
  )
}
