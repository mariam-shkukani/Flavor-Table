
# Flavor Table

Search and explore recipes by ingredients using a Node/Express backend that proxies Spoonacular API.

## How to run

1. npm install
2. Create .env from .env.example and add SPOONACULAR_API_KEY.
3. npm start then open `http://localhost:3000`.

## API Routes

- GET / → home page (search UI)
- GET /recipes/random → one random recipe (simplified)
- GET /recipes/search?ingredients=chicken,tomato → list of simplified recipes
- GET /recipes/:id → details (Bonus)

## Frontend Features

- Search by ingredients
- Random recipe
- Save to Favorites (localStorage)
- Favorites page with remove
- (Bonus) Details page with image, title, summary, readyInMinutes

## Questions

- How many hours did it take you to complete this assignment?
  - From 6-8 hours
- Were there any parts of the lab you found challenging?
  - The hardest part was understandimg the connection between the Backend and the API ,
  dealing with the API ,
  how to use Axios and organizing the interface and linking the buttons .
  