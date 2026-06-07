import { render, screen } from '@testing-library/react'
import { StudentEligibilityDisclaimer } from '../student-eligibility-disclaimer'

describe('StudentEligibilityDisclaimer', () => {
  it('renders PRD-aligned copy with note semantics and live region', () => {
    render(<StudentEligibilityDisclaimer />)
    const note = screen.getByRole('note')
    expect(note).toHaveAttribute('aria-live', 'polite')
    expect(note.textContent).toMatch(/compliance makes official eligibility decisions/i)
    expect(note.textContent).toMatch(/preliminary decision support only/i)
  })

  it('does not expose a dismiss control', () => {
    render(<StudentEligibilityDisclaimer />)
    expect(screen.queryByRole('button', { name: /dismiss|close/i })).toBeNull()
  })
})
