# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: ThinkHaven AI Coaching Platform API
  version: 1.0.0
  description: RESTful API for AI-powered strategic coaching platform with real-time streaming
servers:
  - url: /api
    description: Next.js API routes

paths:
  /chat/stream:
    post:
      summary: Stream AI coaching conversation
      description: Real-time Claude Sonnet 4.0 streaming with Mary persona
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  description: User message for coaching
                workspaceId:
                  type: string
                  description: Active workspace context
                conversationHistory:
                  type: array
                  items:
                    $ref: '#/components/schemas/ConversationMessage'
                coachingContext:
                  $ref: '#/components/schemas/CoachingContext'
      responses:
        '200':
          description: Server-sent event stream
          content:
            text/event-stream:
              schema:
                type: string
                description: SSE stream with AI responses
  
  /workspaces:
    get:
      summary: List user workspaces
      responses:
        '200':
          description: Array of workspaces
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Workspace'
    post:
      summary: Create new workspace
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
      responses:
        '201':
          description: Created workspace
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Workspace'

  /bmad/templates:
    get:
      summary: Get strategic thinking templates
      parameters:
        - name: category
          in: query
          schema:
            type: string
            enum: [new-idea, business-model, competitive-analysis]
      responses:
        '200':
          description: Available BMad templates
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BMadTemplate'

components:
  schemas:
    Workspace:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        dual_pane_state:
          $ref: '#/components/schemas/DualPaneState'
    
    CoachingContext:
      type: object
      properties:
        session_goals:
          type: array
          items:
            type: string
        current_phase:
          type: string
        strategic_focus:
          type: string
    
    ConversationMessage:
      type: object
      properties:
        role:
          type: string
          enum: [user, assistant]
        content:
          type: string
```
