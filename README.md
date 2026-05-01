Snake Game Web App

This is a Node.js web application that includes user authentication, a leaderboard system, and a store for our Snake game. 
Users can register, log in, and play the game while their scores are saved to their account.
The Leaderboard displays the top n players based on sorting.
The Store alows for players to spend their points to customize their snake.

1. Install required packages:
(No external packages required — uses built-in Node.js modules)

2. Start the server:
node server.js

3. Open the application:
http://localhost:8080

Features:
- User registration and login (passwords hashed with SHA256)
- Session-based authentication using cookies
- Protected game page (only accessible when logged in)
- Snake game with real-time score display
- Replay and logout buttons
- High score tracking per user
- Total score (acts like currency)
- Scores stored in user_data.json

Files:
- server.js → main server
- login.html → login page
- register.html → registration page
- game.html → snake game page
- game.js → game logic
- style.css → styling
- user_data.json → stores user accounts and scores

