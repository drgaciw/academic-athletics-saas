import { fireEvent, render, screen } from '@testing-library/react'
import { ChatWidget } from '../chat-widget'

const baseProps = {
  messages: [],
  input: '',
  isLoading: false,
  onInputChange: jest.fn(),
  onSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
}

describe('ChatWidget student eligibility disclaimer', () => {
  it('shows disclaimer when showStudentEligibilityDisclaimer is true', () => {
    render(<ChatWidget {...baseProps} showStudentEligibilityDisclaimer />)
    expect(screen.getByRole('button', { name: /open ai assistant/i })).toHaveAttribute(
      'title',
      expect.stringMatching(/preliminary guidance only/i)
    )
    fireEvent.click(screen.getByRole('button', { name: /open ai assistant/i }))
    expect(screen.getByRole('note')).toBeInTheDocument()
  })

  it('hides disclaimer when flag is false', () => {
    render(<ChatWidget {...baseProps} showStudentEligibilityDisclaimer={false} />)
    expect(screen.queryByRole('note')).toBeNull()
  })
})
