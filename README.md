# Store Manager
Sales management software

## Setup instructions
Instructions for installing Store Manager

### Dependencies 
1. Postgre SQL database >= 9.4 
2. NodeJS v6 or later 

### Database configuration
1. `cd storeManager`
2. `psql -U postgres < sql/db.sql`

### Web app
1. `cd storeManager/`
2. `npm install && npm run build`
3. `cd public/ && bower install`

## Running the app
1. `cd storeManager/ && npm start`
2. Open `http://localhost:3333/` in your web browser