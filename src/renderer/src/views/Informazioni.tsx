import { ABOUT, APP_NAME, APP_VERSION, COPYRIGHT_NOTICE, DISCLAIMER, ENGINE_VERSIONS } from '@shared/catalog/about'

export function Informazioni() {
  return (
    <div className="wide-page content-grid">
      <section>
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

        <h2 className="serif text-xl" style={{ marginTop: 28 }}>Avvertenza</h2>
        <div className="panel whitespace-pre-wrap text-[13px] leading-relaxed" style={{ marginTop: 8 }}>
          {DISCLAIMER.replace(/\*\*/g, '')}
        </div>
      </section>
      <aside>
        <div className="panel">
          <div className="hair mb-2">Licenza e diritti</div>
          <p className="text-[12px] text-[var(--color-mute)] whitespace-pre-wrap">{COPYRIGHT_NOTICE}</p>
          <ul className="text-[12px] text-[var(--color-mute)] mt-3 pl-4">
            {ABOUT.rights.map((x) => <li key={x} className="mb-1">{x}</li>)}
          </ul>
        </div>
        <div className="panel mt-3">
          <div className="hair mb-2">Motore</div>
          <ul className="text-[12px] text-[var(--color-mute)]">
            {Object.entries(ENGINE_VERSIONS).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
          </ul>
        </div>
      </aside>
    </div>
  )
}
