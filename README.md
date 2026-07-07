# GatherSpace 🏢✨

GatherSpace is a production-grade, full-stack, double-sided consumer marketplace application that connects **Event Organizers** looking for event venues with **Venue Listers** leasing out halls, lounges, and corporate spaces. 

Built completely from scratch using the MERN stack, this project is architected with a strong focus on defensive design, strict database transaction integrity, and low-latency real-time communication.

---

## 🎯 Target System Architecture & Core Deliverables

### 1. User Service & Multi-Role Authentication
* **Deliverable:** Secure multi-role (`Organizer` vs. `Lister`) registration and login system.
* **SDE Focus:** JWT-based stateless authentication, HTTP-only cookie storage to mitigate XSS/CSRF vulnerabilities, and robust input validation/sanitization.

### 2. Location-Aware Venue Discovery
* **Deliverable:** Advanced venue search engine filtering by capacity, price, dates, and geographic radius.
* **SDE Focus:** MongoDB 2dsphere geospatial indexing for ultra-fast boundary queries and map-based exploration.

### 3. Real-Time Workspace & Deal Closure (`Socket.io`)
* **Deliverable:** A continuous chat canvas where organizers and listers can negotiate rates live, with an integrated, synchronized contract-drafting panel.
* **SDE Focus:** Low-latency WebSocket event handling, state synchronization across clients, and persistent message queuing.

### 4. Interactive Live Site Tours (`WebRTC`)
* **Deliverable:** Peer-to-peer browser-native video streaming letting venue listers provide live virtual tours to prospective organizers.
* **SDE Focus:** Signaling server coordination, NAT traversal via STUN/TURN, and media constraint optimization.

### 5. High-Integrity Booking & Payments Engine (`Razorpay`)
* **Deliverable:** Dynamic availability tracking with a zero-double-booking guarantee and localized checkout.
* **SDE Focus:** ACID-compliant MongoDB database sessions/transactions with pessimistic locking or deterministic state checks to handle concurrent race conditions safely during financial checkouts.

---

## 🛠️ Tech Stack & Ecosystem

* **Frontend:** React.js, Tailwind CSS (for highly responsive, atomic utility styling), Context API / Redux Toolkit.
* **Backend:** Node.js, Express.js (Modular MVC architecture).
* **Database:** MongoDB Atlas (NoSQL Document Store) via Mongoose ODM.
* **Real-Time Layer:** Socket.io, WebRTC (Simple-Peer or native APIs).
* **Payment Gateway:** Razorpay API (India-compliant localized integration).
* **Environment:** Developed on Linux Mint using Git for version control.