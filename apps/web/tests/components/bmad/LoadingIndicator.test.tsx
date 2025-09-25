import { render, screen } from '@testing-library/react'
import LoadingIndicator, { 
  SessionCreationLoader, 
  PathwayAnalysisLoader, 
  ElicitationLoader, 
  SkeletonLoader 
} from '@/app/components/bmad/LoadingIndicator'

describe('LoadingIndicator', () => {
  it('renders spinner variant by default', () => {
    render(<LoadingIndicator />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingIndicator message="Loading test data..." />)
    expect(screen.getByText('Loading test data...')).toBeInTheDocument()
  })

  it('renders progress variant with percentage', () => {
    render(<LoadingIndicator variant="progress" progress={75} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders skeleton variant', () => {
    render(<LoadingIndicator variant="skeleton" />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders dots variant', () => {
    render(<LoadingIndicator variant="dots" />)
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })
})

describe('Specialized Loading Components', () => {
  it('renders SessionCreationLoader', () => {
    render(<SessionCreationLoader />)
    expect(screen.getByText('Creating your strategic session...')).toBeInTheDocument()
  })

  it('renders PathwayAnalysisLoader', () => {
    render(<PathwayAnalysisLoader />)
    expect(screen.getByText('Analyzing pathway options...')).toBeInTheDocument()
  })

  it('renders ElicitationLoader with progress', () => {
    render(<ElicitationLoader progress={50} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Processing your response')).toBeInTheDocument()
  })

  it('renders SkeletonLoader', () => {
    render(<SkeletonLoader />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})