import { THEORY } from '@shared/catalog/theory'
import Markdown from 'react-markdown'

export function Teoria() {
  return (
    <div className="wide-page content-grid">
      <article className="prose">
        <Markdown>{THEORY}</Markdown>
      </article>
      <aside>
        <div className="panel">
          <div className="hair mb-2">Come leggere i risultati</div>
          <p className="text-[13px] text-[var(--color-mute)] leading-relaxed">
            Metodo, popolazione e finestra d’età fanno parte del risultato. Un numero fuori coorte non diventa automaticamente falso, ma richiede una lettura più prudente.
          </p>
        </div>
        <div className="panel mt-3">
          <div className="hair mb-2">Regola del motore</div>
          <p className="text-[13px] text-[var(--color-mute)] leading-relaxed">
            Le grandezze non misurate dal dispositivo non vengono inventate. Le stime BIA e plicometriche restano separate e tracciabili.
          </p>
        </div>
      </aside>
    </div>
  )
}
