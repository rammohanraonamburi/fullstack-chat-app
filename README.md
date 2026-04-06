# Real-Time Full-Stack Chat Application


### Live Demo
* **Frontend (Vercel):** https://fullstack-chat-app-ruby-five.vercel.app/
* **Backend (Render):** https://chat-app-backend-pci2.onrender.com

---

```bash
fullstack-chat-app/
├── backend/                
│   ├── models/             
│   │   └── Message.js      
│   ├── index.js            
│   ├── .env                
│   └── package.json        
│
├── frontend/               
│   ├── src/
│   │   └── app/
│   │       ├── page.js     
│   │       └── globals.css 
│   ├── public/             
│   ├── tailwind.config.js  
│   └── package.json        
│
└── README.md               
```
    
## 📌 Project Overview
This application allows multiple users to join a global chat room and communicate in real-time without needing to refresh the page. 

**Core Features:**
* **Real-Time Messaging:** Powered by Socket.io for instant message delivery.
* **Granular Deletion:** * *Delete for Me:* Hides the message for the current session only.
  * *Delete for Everyone:* Replaces the message content globally and removes actions.
* **Message Pinning:** Users can pin important messages, which persists across all connected clients.
* **Live Search:** Client-side filtering to instantly find messages by content.
* **Session Tracking:** Auto-generates unique session IDs per browser tab to simulate different users.

---

## 🚀 Setup Instructions (Local Development)

### Prerequisites
* Node.js (v16+)
* MongoDB Atlas Account (or local MongoDB)

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
`bash
cd backend
npm install
Create a .env file in the backend directory and add your MongoDB connection string and Port:

Code snippet
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chat-app?retryWrites=true&w=majority
PORT=5001
Start the backend server:

Bash
npm run dev

2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:

Bash
cd frontend
npm install
Start the Next.js development server:

Bash
npm run dev
Open http://localhost:3000 in your browser.

🧠 Approach and Design Decisions
WebSockets over Polling: I chose Socket.io to establish a persistent, bidirectional connection between the client and server. This drastically reduces server load compared to HTTP polling and provides a true, instantaneous chat experience.

Soft Deletes vs. Hard Deletes: * For "Delete for Everyone", the database performs a "soft delete" by flipping a deletedForEveryone boolean and sanitizing the content. This maintains database integrity while updating the UI globally.

For "Delete for Me", I utilized an array field (hiddenBy: [userIds]). This elegantly handles the logic without destroying the record for other users.

Client-Side Hydration: To prevent Next.js hydration mismatch errors while simulating distinct users, the unique userId is generated dynamically inside a useEffect hook upon mounting, ensuring the server and client HTML match perfectly.

Tailwind CSS & Responsive Design: Styled using Tailwind for rapid, maintainable styling. The layout is fully responsive, utilizing Flexbox to handle sticky headers, scrollable message areas, and fixed input footers.

⚖️ Tradeoffs and Assumptions
Authentication: To keep the assignment focused strictly on real-time messaging constraints, I opted for temporary, browser-generated userIds rather than implementing a full JWT/OAuth authentication flow.

Tradeoff of Temporary Sessions: Because userIds are generated on page load, refreshing the page generates a new ID. This means messages marked "Delete for Me" will reappear on a hard refresh, as the user is technically recognized as a "new" session. In a production app with Auth, this is resolved by tying the ID to a persistent user account.

Pagination: The app currently fetches all messages on load. MongoDB and React handle 100+ messages highly efficiently as required by the assignment constraints. However, if scaling to 10,000+ messages, I would implement cursor-based pagination and infinite scrolling to optimize load times.

📖 API Documentation
Base URL: http://localhost:5001/api

GET /messages
Description: Retrieves all messages.

Response: 200 OK | Array of message objects.

POST /messages
Description: Creates a new message and broadcasts to all sockets.

Body: { "content": "Hello", "sender": "user123" }

Response: 201 Created | Created message object.

PATCH /messages/:id/pin
Description: Toggles the isPinned boolean of a message.

Response: 200 OK | Updated message object.

PATCH /messages/:id/deleteForEveryone
Description: Soft-deletes a message globally. Sets deletedForEveryone: true and sanitizes content.

Response: 200 OK | Updated message object.

PATCH /messages/:id/deleteForMe
Description: Hides a message for a specific user.

Body: { "userId": "user123" }

Response: 200 OK | Updated message object appended with the hidden userId.


***

### **Final Git Push**
Once you save that into your `README.md`, do one final commit to push it to your repository:
``bash
git add .
git commit -m "docs: add comprehensive README with setup, architecture decisions, and API docs"
git push
