import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/app/components/bmad/ErrorBoundary'

// Mock component that throws errors
const ThrowError = ({ shouldError = false }: { shouldError?: boolean }) => {
  if (shouldError) {
    throw new Error('Test error message')
  }
  return <div>Working component</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalConsoleError = console.error
  beforeEach(() => {
    console.error = jest.fn()
  })
  afterEach(() => {
    console.error = originalConsoleError
  })

  it('renders children when there are no errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('renders error fallback when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Refresh Page')).toBeInTheDocument()
  })

  it('provides actionable steps for different error types', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('What you can do:')).toBeInTheDocument()
    expect(screen.getByText(/Try the action again/)).toBeInTheDocument()
  })

  it('shows retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )
    
    // Click retry button
    fireEvent.click(screen.getByText('Try Again'))
    
    // Re-render with working component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldError={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('uses custom fallback when provided', () => {
    const customFallback = (error: Error) => (
      <div>Custom error: {error.message}</div>
    )
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument()
  })

  it('calls onError callback when provided', () => {
    const onErrorMock = jest.fn()
    
    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )
    
    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('shows technical details in collapsible section', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )
    
    const detailsToggle = screen.getByText('Technical Details (for support)')
    expect(detailsToggle).toBeInTheDocument()
    
    // Click to expand details
    fireEvent.click(detailsToggle)
    
    expect(screen.getByText(/Error:/)).toBeInTheDocument()
    expect(screen.getByText(/Test error message/)).toBeInTheDocument()
  })
})