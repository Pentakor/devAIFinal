# System Design Documentation

## Architecture Overview

### Routes
The application follows a RESTful API structure with two main route modules:
- `auth.js`: Handles authentication-related endpoints
- `surveys.js`: Manages survey-related operations including creation, retrieval, and analysis

For complete API documentation, including all available endpoints, request/response schemas, and authentication requirements, please refer to the Swagger Documentation at: http://localhost:3000/api-docs/

### Services
The service layer implements business logic and external integrations:
- `surveyService.js`: Core survey management functionality
- `aiService.js`: Direct integration with OpenAI's GPT-3.5-turbo for AI-powered features
- `llmService.js`: Abstraction layer for AI operations, providing a clean interface for testing
- `userService.js`: User management and authentication logic

### Models
The data layer consists of three main models:
- `Survey.js`: Represents survey structure and metadata
- `Response.js`: Stores survey responses and related data
- `User.js`: Manages user information and authentication details

## Key Design Decisions and Trade-offs

1. **Service Layer Abstraction**
   - The `llmService.js` acts as a thin wrapper around `aiService.js`
   - This design enables easier testing through mocking while maintaining clean separation of concerns
   - Trade-off: Slight overhead in function calls for better testability

2. **AI Integration Architecture**
   - Direct integration with OpenAI's API through `aiService.js`
   - Structured prompt management system for different AI operations
   - Trade-off: Coupling to specific AI provider (OpenAI) for simplicity and reliability

3. **Error Handling Strategy**
   - Comprehensive error handling in AI service calls
   - Detailed logging for debugging and monitoring
   - Trade-off: Verbose error handling for better debugging vs. code complexity

## LLM Integration Abstraction

The LLM integration is abstracted through a three-layer approach:

1. **LLM Service Layer** (`llmService.js`)
   - Provides a clean interface for AI operations
   - Enables easy mocking for testing
   - Exposes three main functions:
     - `generateSummary`: For survey analysis
     - `validateResponses`: For response validation
     - `searchSurveysByQuery`: For semantic search

2. **AI Service Layer** (`aiService.js`)
   - Direct integration with OpenAI's API
   - Implements specific AI operations with proper error handling
   - Uses GPT-3.5-turbo model with different temperature settings for different tasks
   - Handles JSON parsing and response validation

3. **Prompt Management**
   - Externalized prompts stored in the `prompts` directory
   - Dynamic prompt loading and template filling
   - Separation of prompt content from business logic

This layered approach provides:
- Clean separation of concerns
- Easy testing through mocking
- Consistent error handling
- Flexible prompt management
- Scalable AI integration

## Frontend Architecture

### MVC Pattern Implementation
The frontend follows the Model-View-Controller (MVC) pattern with a clear separation of concerns:

1. **Models**
   - Data models defined in `src/models/`
   - Handles data structure and validation
   - Communicates with backend services

2. **Views**
   - Located in `public/views/`
   - Organized by feature:
     - `auth/`: Authentication-related views (login, registration)
     - `dashboard/`: Main application dashboard
     - `survey/`: Survey creation and management interfaces
   - Static assets stored in `public/assets/`

3. **Controllers**
   - Implemented in `src/controllers/`
   - Handles business logic
   - Manages communication between models and views
   - Processes user interactions

### UI Structure
The user interface is organized into distinct sections:

1. **Authentication Flow**
   - Entry point redirects to login page
   - Separate views for login and registration
   - Secure session management

2. **Dashboard**
   - Main application interface
   - Survey overview and management
   - User profile and settings

3. **Survey Management**
   - Survey creation and editing interface
   - Response collection and analysis
   - AI-powered features integration

The frontend architecture emphasizes:
- Clean separation of concerns
- Modular component design
- Responsive layout
- Progressive enhancement
- Secure authentication flow 