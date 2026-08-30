import { THEORY } from '@shared/catalog/theory'
import Markdown from 'react-markdown'

export function Teoria() {
  return (
    <div className="wide-page">
      <article className="prose">
        <Markdown>{THEORY}</Markdown>
      </article>
    </div>
  )
}
