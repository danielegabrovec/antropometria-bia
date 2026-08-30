import { describe, expect, it } from 'vitest'
import { emptyDoctor, emptyPatient } from '@shared/library'
import { htmlDocument, trendChartSvg, visitHtml, workspaceHtml } from '@shared/export/html'

describe('export professionali e sicuri', () => {
  it('aggiunge una CSP offline e neutralizza il markup dei profili', () => {
    const patient = emptyPatient({ nome: '<script>alert(1)</script>', cognome: 'Rossi', sex: 'F' })
    const doctor = emptyDoctor({ nome: 'Ada', cognome: 'Bianchi', orderName: 'Ordine', orderNumber: 'A-12' })
    const html = visitHtml({
      workspace: { id: 'w1', name: 'Studio', kind: 'studio' },
      doctor,
      patient,
      visit: null,
      kpis: [{ label: 'ECW/TBW', value: '0,381' }],
      measures: [],
      warnings: ['Stima fuori coorte.'],
      methods: ['Sergi 1994']
    })
    expect(html).toContain('Content-Security-Policy')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('0,381')
    expect(html).toContain('Stima fuori coorte.')
    expect(html).toContain('Sergi 1994')
  })

  it('genera grafici SVG longitudinali con assi e legenda', () => {
    const svg = trendChartSvg({
      title: 'Peso',
      unit: 'kg',
      dates: ['2026-01-01', '2026-02-01'],
      series: [{ label: 'Peso', color: '#123456', values: [80, 78] }]
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('2026-02-01')
    expect(svg).toContain('Peso: 78 kg')
  })

  it('escapa il titolo del documento', () => {
    expect(htmlDocument('<img src=x>', '<p>ok</p>')).toContain('<title>&lt;img src=x&gt;</title>')
  })

  it('compone la cartella senza annidare un secondo documento o footer', () => {
    const html = workspaceHtml(
      { id: 'w1', name: 'Studio', kind: 'studio' },
      [emptyDoctor({ nome: 'Ada', cognome: 'Bianchi' })],
      [emptyPatient({ nome: 'Luca', cognome: 'Rossi', sex: 'M' })],
      []
    )
    expect(html.match(/<!doctype html>/g)).toHaveLength(1)
    expect(html.match(/class="foot"/g)).toHaveLength(1)
    expect(html).toContain('Dottori (1)')
    expect(html).toContain('Pazienti (1)')
  })
})
