# Final Exercise Specification: Survey Server with AI Summarization

## How to install and run the app:

1. Clone the GitHub repo.
2. Create a `.env` file.
3. Populate it with the variables listed in the `.env.example` file.
4. Run the following commands:

npm install
npm start


### Access the following:

* Frontend: [http://localhost:3000/register.html](http://localhost:3000/register.html)
* Swagger Documentation: [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/)
* API Routes: [http://localhost:3000/api/](http://localhost:3000/api/)


## How to run tests:

1. Create a `.env.test` file.
2. Populate it with the following variables:

NODE_ENV=test
PORT=3001
USE_MOCK_LLM=true
JWT_SECRET=test-secret-key
MAX_OPINIONS_PER_SURVEY=100
MAX_SURVEY_LENGTH=10

3. Run the following command:

blablabla
