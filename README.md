# google-for-health

## Google Cloud setup

- Install the Google Cloud CLI:

https://cloud.google.com/sdk/docs/install

- Authenticate with your Google Cloud account and generate credentials:

https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment

## Python environment

- Create and activate a virtual environment:

```
python -m venv venv
source venv/bin/activate
```

- Install dependencies:

```
pip install -r requirements.txt
```

- Create a .env file in the project root with

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=your-region
MEDGEMMA_ENDPOINT_ID=your-medgemma-endpoint-id
```

## Backend tests (models + agent)

```
python gemini.py
```

or

```
python medgemma.py
```

- Run agent

```
python agent.py
```

## Frontend (React + Vite + TypeScript)

- Setup and run:

```
cd front
npm install
npm run dev
```

- Open http://localhost:5173 in your browser.

## Fullstack: Run backend and frontend together

- In one terminal, start the backend:

```
python server.py
```

- In another terminal, start the frontend:

```
cd front
npm run dev
```

- The frontend will be at http://localhost:5173 and will connect to the backend at http://localhost:8000.