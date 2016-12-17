# Store Manager

## Dependencies 
1. Postgre SQL database >= 9.4 
2. NodeJS v6 or later 

## Setup instructions
Instructions for installing Store Manager

### Database configuration
1. `cd storeManager`
2. `psql -U postgres < sql/db.sql`

### Web app
1. `cd storeManager/`
2. `npm install && npm run build`
3. `cd public/ && bower install`

## Running the app
1. `cd storeManager/ && ./bin/www`
2. Open `http://127.0.0.1:3333/` in your web browser