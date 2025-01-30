### Pallium Online Chat – Backend  

This is the **server-side** application for **Pallium Online Chat**, handling user authentication, message storage, and real-time communication using **WebSockets**.  

## 🚀 Features  

- **JWT-based authentication** – Secure user login and registration.  
- **Real-time chat** – Implemented using **Socket.io** with authentication.  
- **PostgreSQL + Prisma ORM** – Database management for user and message storage.  
- **Express.js** – Lightweight and efficient backend framework.  
- **CORS support** – Secure cross-origin requests.  
- **Bcrypt.js** – Secure password hashing.  
- **WebSocket event handling** – Supports real-time message broadcasting.  

## 🛠 Technologies  

- **Node.js** (v22.13.0)  
- **Express.js**  
- **Socket.io**  
- **Prisma ORM**  
- **PostgreSQL**  
- **JWT authentication**  
- **Bcrypt.js** (for password encryption)  

## 📦 Installation  

1. Clone the repository:  
   ```bash
   git clone https://github.com/weelfis/pallium-backend.git

## Install dependencies:
yarn install

## Set up the database:
npx prisma migrate dev --name init

## Generate Prisma client:
npx prisma generate

## Start the server:
yarn dev

### 🌍 Environment Variables

## Create a .env file in the root directory and add the following:
DATABASE_URL=postgresql://user:password@localhost:5432/pallium_db
JWT_SECRET=your_secret_key
PORT=3000

### Scripts

## Start production server:
yarn start

## Run in development mode:
yarn dev

## Build:
yarn build

## Linting:
yarn lint


## API Routes

# Authentication
	•	POST /api/auth/register – Register a new user.
	•	POST /api/auth/login – Authenticate user and return JWT token.

# Chat
	•	GET /api/chat – Get chat history.
	•	POST /api/chat – Send a message.


## 🔄 WebSocket Events
	•	connect – Establishes a WebSocket connection.
	•	send_message – Sends a new message and stores it in the database.
	•	new_message – Broadcasts a received message to all connected clients.
	•	disconnect – Handles client disconnection.

## 🗃 Database
This project uses PostgreSQL with Prisma ORM. Run migrations before starting the server:
npx prisma migrate dev --name init

## 🤝 Contributing
If you want to contribute, fork the repository and submit a pull request. Make sure to run linting before submitting your PR.



### For more details, check the frontend repository.
https://github.com/vueree/online-chat-pallium-vue-3
