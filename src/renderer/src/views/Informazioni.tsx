import { ABOUT, APP_NAME, APP_VERSION, COPYRIGHT_NOTICE, DISCLAIMER, ENGINE_VERSIONS } from '@shared/catalog/about'

export function Informazioni() {
  return (
    <div className="wide-page" style={{ maxWidth: 640 }}>
      <div className="hair">Info</div>
      <h1 className="serif text-3xl mb-2">{APP_NAME}</h1>
      <p className="text-[var(--color-mute)] mb-6" style={{ fontSize: 17 }}>
        {ABOUT.tagline}
      </p>
      <p className="hair mb-6">Versione {APP_VERSION}</p>

      <h2 className="serif text-xl mt-2">Autore</h2>
      <p className="prose" style={{ marginTop: 8 }}>
        <strong>{ABOUT.author.name}</strong>
        <br />
        {ABOUT.author.role}
        <br />
        {ABOUT.author.order}
        <br />
        <a href={`mailto:${ABOUT.author.email}`}>{ABOUT.author.email}</a>
        <br />
        <a href={ABOUT.author.github} target="_blank" rel="noreferrer">
          {ABOUT.author.github}
        </a>
      </p>

      <h2 className="serif text-xl" style={{ marginTop: 28 }}>
        Diritti
      </h2>
      <p className="prose whitespace-pre-wrap" style={{ marginTop: 8 }}>
        {COPYRIGHT_NOTICE}
      </p>
      <ul className="prose" style={{ paddingLeft: 20, marginTop: 12 }}>
        {ABOUT.rights.map((x) => (
          <li key={x} style={{ marginBottom: 6 }}>
            {x}
          </li>
        ))}
      </ul>

      <h2 className="serif text-xl" style={{ marginTop: 28 }}>
        Avvertenza
      </h2>
      <div className="panel whitespace-pre-wrap text-[13px] leading-relaxed" style={{ marginTop: 8 }}>
        {DISCLAIMER.replace(/\*\*/g, '')}
      </div>

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
