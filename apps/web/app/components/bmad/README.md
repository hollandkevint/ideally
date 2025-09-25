# BMad Method Frontend Components

This directory contains the React components for the BMad Method strategic framework integration.

## Components

### 1. PathwaySelector
Entry point component that allows users to:
- View available strategic pathways (New Idea, Business Model Analysis, Strategic Optimization)
- Input their challenge for AI-powered intent analysis
- Receive pathway recommendations from Mary
- Select a pathway to start their session

### 2. SessionManager
Progress tracking and session control component that provides:
- Overall session progress visualization
- Current phase tracking with time allocation
- Session controls (pause, resume, exit)
- Real-time elapsed time tracking
- Next steps display

### 3. ElicitationPanel
Interactive elicitation interface that handles:
- Display of numbered options (1-9) from the BMad system
- User selection with visual feedback
- Custom text input for flexible responses
- Category-based option organization
- Time estimates for each option

### 4. BmadInterface
Main orchestration component that:
- Manages the overall BMad workflow state
- Coordinates between PathwaySelector, SessionManager, and ElicitationPanel
- Handles API communication with the backend
- Provides step indicators and error handling
- Manages session lifecycle

### 5. useBmadSession Hook
Custom React hook for session management:
- Creates new BMad sessions
- Advances sessions with user input
- Retrieves existing sessions
- Manages session state (pause/resume/exit)
- Handles API communication and error states

## Integration

The BMad components are integrated into the workspace page with a tab system:
- "Mary Chat" tab for traditional AI conversations
- "BMad Method" tab for structured strategic frameworks

## API Endpoints Used

- `POST /api/bmad` with `action: 'analyze_intent'`
- `POST /api/bmad` with `action: 'create_session'`
- `POST /api/bmad` with `action: 'advance_session'`
- `GET /api/bmad?action=pathways`
- `GET /api/bmad?action=sessions`

## Features

- **Intent Analysis**: AI-powered pathway recommendations based on user input
- **Progressive Disclosure**: Step-by-step workflow with clear progress indicators
- **Responsive Design**: Mobile-friendly with Tailwind CSS
- **Error Handling**: Graceful degradation with fallback content
- **Session Persistence**: Automatic session recovery and state management
- **Real-time Updates**: Live progress tracking and time monitoring

## Future Enhancements

- Integration with knowledge base search
- Export functionality for session outputs
- Advanced analytics and reporting
- Collaborative session features
- Integration with canvas tools for visual thinking