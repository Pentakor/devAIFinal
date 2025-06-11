# design.md

## 🏗️ Architecture Overview

### Routes

* **/auth**

  * `POST /register`: Register new users
  * `POST /login`: User login
* **/surveys**

  * `POST /`: Create a new survey
  * `GET /`: List all surveys
  * `PATCH /:surveyId/close`: Close a survey
  * `GET /:surveyId/responses`: Get all responses to a survey
  * `POST /:surveyId/responses`: Add a response to a survey
  * `PATCH /:surveyId/responses/:responseId`: Update response
  * `DELETE /:surveyId/responses/:responseId`: Delete response
  * `POST /:surveyId/summarize`: Trigger AI summarization
  * `POST /:surveyId/validate-responses`: Trigger AI validation
  * `PATCH /:surveyId/summary-visibility`: Show/hide summary
* **/search**

  * `POST /`: Search surveys using LLM

### Services

* **authService.js**: Handles user registration, login, password hashing, and JWT token creation.
* **surveyService.js**: Main business logic for creating surveys, responses, closing surveys, and managing summaries.
* **llmService.js**: Abstracts LLM calls for summarization, search, and validation.

### Models

* **User.js**: Stores username, email, hashed password.
* **Survey.js**: Contains survey data including area, question, prompts, expiry, summary, creatorId, etc.
* **Response.js**: User responses linked to surveys.

### Middlewares

* **validateRequest.js**: Central validation using Joi with custom messages.
* **authMiddleware.js**: Validates JWT token and attaches user info.
* **sanitizeBody()**: Cleans input strings using sanitize-html.
* **errorHandler.js**: Centralized error handler using Winston logging.

---

## 💡 Key Design Decisions & Trade-offs

### ✅ Modularity

The system is modular, separating routes, controllers, services, models, and middleware, improving testability and maintainability.

### ✅ Joi Schema Reusability

Joi schemas are centrally defined in `src/validation`, enabling consistent validation across routes.

### ✅ LLM Abstraction

All interactions with the LLM are abstracted inside `llmService.js`, allowing mockability and easy switch of provider.

### ✅ Security by Design

* Passwords are hashed with bcrypt
* JWT used for auth
* All API keys are stored securely via `.env`
* Input sanitized via `sanitize-html`

### ⚠️ Trade-offs

* Using a single summary per survey; future versions may store summary versions.
* Validation errors throw structured error with `error: { code, message, details }` — allows clients to handle errors gracefully.
* Responses are stored as documents under each survey, which simplifies querying but may grow large over time.

---

## 🤖 How LLM Integration is Abstracted

LLM logic is fully encapsulated in `llmService.js`, which handles:

* **summarizeSurvey(survey)**: Receives a Survey object, builds the prompt from survey fields + stored responses, and returns a summary.
* **validateSurveyResponses(survey)**: Checks each response against the prompt’s validation instructions and returns violations.
* **searchSurveys(query, surveys)**: Formats search prompt + list of surveys, and returns relevant matches with reasons.

LLM prompts are stored in `/prompts/*.txt` files for consistency and ease of updates.

---

## 📌 Logging & Error Handling

* All logs go through Winston (`logger.js`) for structured logging.
* API errors follow format: `{ error: { code, message, details? } }`
* All unexpected errors log with stack trace and return 500.

---

## 🧪 Testing Strategy

* `mongodb-memory-server` used to isolate tests from real DB
* All LLM logic is mocked using `__mocks__/llmService.js`
* Tests cover API behavior (Supertest) and unit logic (Jest + Chai)
* .env file separates test vs. dev via `USE_MOCK_LLM`

---

## ✅ Summary

The system adheres to clean architecture principles:

* **Modular and layered** (controllers → services → models)
* **Secure and validated** inputs
* **Mockable and testable** LLM integration
* **Proper error logging and handling** via Winston
* **Clear abstraction of business logic** away from routes

The design enables maintainability, testability, and adaptability to future changes, such as swapping LLM providers or expanding survey types.
