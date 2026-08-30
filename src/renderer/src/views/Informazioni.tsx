import { DISCLAIMER, APP_NAME, APP_VERSION, ENGINE_VERSIONS, AUTHOR } from '@shared/catalog/about'

export function Informazioni() {
  return (
    <div className="wide-page" style={{ maxWidth: 640 }}>
      <div className="hair">Info</div>
      <h1 className="serif text-3xl mb-2">{APP_NAME}</h1>
      <p className="text-[var(--color-mute)] mb-4">
        Versione {APP_VERSION} · {AUTHOR.name}
      </p>
      <p className="mb-4">
        <a href={AUTHOR.github} onClick={(e) => e.preventDefault()}>
          {AUTHOR.github}
        </a>
      </p>
      <div className="panel whitespace-pre-wrap text-[13px] leading-relaxed">{DISCLAIMER.replace(/\*\*/g, '')}</div>
      <div className="hair mt-6 mb-2">Motore</div>
      <ul className="text-[13px] text-[var(--color-mute)]">
        {Object.entries(ENGINE_VERSIONS).map(([k, v]) => (
          <li key={k}>
            {k}: {v}
          </li>
        ))}
      </ul>
    </div>
  )
}
