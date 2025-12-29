# Sales Assessment Dashboard

A personalized interactive dashboard demo built with a Flask backend (SQLAlchemy + SQLite/Postgres) and a D3.js frontend. This project showcases my skills in full-stack development, data visualization, and user-centric design. It's set up for local development with Docker Compose and includes an admin flow (JWT auth) for creating and editing products.

## Quick start (Docker)

1. Copy `.env.example` to `.env` and adjust secrets if needed.
2. Start services:

```bash
docker-compose up --build
```

3. Serve the frontend files (recommended) and run the backend.

   - Serve frontend (recommended so relative imports and CORS behave predictably):
     - From the `frontend/` folder run `python -m http.server 8000` and open `http://localhost:8000` in your browser
     - or use `npx serve frontend` for a quick static server

   - Start backend:
     - Using Docker Compose: `docker-compose up --build` (recommended)
     - Without Docker: `pip install -r requirements.txt` then `python -m backend.app`

   - Check service health: `curl http://localhost:5000/health` should return `{"status":"ok"}`

Default admin credentials: username `admin`, password from `ADMIN_PASSWORD` env var (default `adminpass`).

Troubleshooting:
- If the UI is blank or data not loading, open the browser devtools Console (F12) and look for errors. The page shows a status banner with errors and health checks. 
- Ensure the backend is reachable at `http://localhost:5000` and not blocked by a firewall. 
- If you're using Docker, inspect logs via `docker-compose logs -f web` and `docker-compose logs -f db`.

## Local dev (without Docker)

- Create a virtualenv, install with `pip install -r requirements.txt`, and run `python -m backend.app`.

## Features added in this upgrade

- SQLAlchemy models and JWT-based auth (register/login)
- Admin-protected create/update/delete product endpoints
- Visual polish (fonts, favicon, responsive layout, tooltips)
- Admin CRUD modal and per-row edit/delete controls
- Docker Compose file for local Postgres + app

## Next steps

- Add WebSocket/SSE for live updates
- Add CI and deployment pipeline (Heroku/GCP/Azure)
- Add e2e tests for admin flows

This project is a Sales Assessment Dashboard that combines frontend (HTML/CSS/JavaScript), backend (Python with Flask), and data visualization (D3.js) to help evaluate products and their sales performance.

## My Journey

Inspired by my hands-on experience analyzing sales data during an internship at a retail analytics firm, I built this dashboard to bridge the gap between raw data and actionable insights. As someone passionate about making complex information accessible, I wanted to create a tool that feels intuitive and empowering for users. This project reflects my growth in full-stack development, from crafting interactive visualizations to implementing secure backend APIs. One of the biggest challenges was debugging the D3.js animations – it tested my patience and problem-solving skills, but ultimately made me a better developer.

## Data Insights

This dashboard isn't just about numbers – it's about stories. For instance, products like 'Organic Toothpaste' and 'Spiral Notebook' are shining stars, generating solid profits that keep the business afloat. On the flip side, items like 'Laundry Detergent' and 'Pure Cooking Oil' are showing losses, signaling areas for improvement or strategic decisions. By visualizing these contrasts, the dashboard helps users turn data into actionable wisdom, making it feel like a trusted advisor rather than a cold tool.

## Features

- Interactive sales bar chart showing sales data
- Filter by product category and text search
- Sortable table columns (Product, Sales, Category, Revenue, Profit)
- Export filtered data to CSV (includes Profit)
- Persist newly generated products to backend via `POST /api/data` (Profit field supported)
- Data table displaying all information
- Responsive design for professional appearance

## Backend API

- `GET /api/data` — returns all product records as JSON
- `POST /api/data` — accepts a single object or array of product objects to add to the dataset. Expected fields: `Product`, `Sales`, `Category`, `Revenue`, `Profit`
- `GET /api/categories` — returns unique categories

## Persistent storage

The backend persists data to `backend/data.csv` so that saved products survive server restarts. On first run the server creates `backend/data.csv` with sample records; subsequent `POST /api/data` requests append and save new records to the CSV file.

## How to save generated products

1. Use the **Add More Products** button in the frontend to generate products locally.
2. Click **Save New Products** to persist newly generated items to the backend (`POST /api/data`).
3. The dashboard will refresh and show saved products.

## Technologies Used

- **Backend**: Python with Flask API
- **Frontend**: HTML, CSS, JavaScript
- **Data Visualization**: D3.js
- **Data Processing**: Pandas

## Setup Instructions

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```
   python backend/app.py
   ```

3. Open the frontend in a web browser:
   - Open `frontend/index.html` in your browser
   - Or serve it with a local server for better functionality

## Usage

- Use the category filter to view data for specific product categories
- The bar chart updates dynamically based on the filter
- The data table shows all relevant information

## Future Enhancements

- Add more chart types (line charts, pie charts)
- Implement user authentication
- Add data export functionality
- Integrate with real databases
