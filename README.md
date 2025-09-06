#BookStream: A Modern Bookstore Web Application
A dynamic, Netflix-style web application for browsing a book collection, built with a Flask and MongoDB backend.

This project is a full-stack web application that serves as an online bookstore. It features a secure, token-based RESTful API built with Python and Flask, a NoSQL database using MongoDB, and a sleek, responsive frontend powered by Tailwind CSS and vanilla JavaScript.

#Features ✨
RESTful API: A robust backend built with Flask to manage book data.

Secure Authentication: Uses JSON Web Tokens (JWT) to protect API routes, ensuring only authorized users can access data.

Dynamic Frontend: A modern user interface with Netflix-style carousels for an engaging browsing experience.

Real-time Search: Instantly search for books by title or author.

Responsive Design: Looks great on all devices, from mobile phones to desktops, thanks to Tailwind CSS.

Dark/Light Mode: A theme-toggle feature for user comfort.

NoSQL Database: Utilizes MongoDB for flexible and scalable data storage.

#Tech Stack 🛠️
Backend: Python, Flask, PyMongo, PyJWT

Frontend: HTML, CSS, JavaScript, Tailwind CSS

Database: MongoDB

#Project Structure 📂
For the application to run correctly, your project must follow this folder structure:

/bookstore-project/
├── static/
│   └── index.html
├── app.py
├── books.books.json
└── requirements.txt

#Setup and Installation 🚀
Follow these steps to get the project up and running on your local machine.

1. Prerequisites
Python 3.8+

MongoDB installed and running.

pip and virtualenv for managing Python packages.

2. Clone the Repository
git clone [https://github.com/your-username/bookstore-project.git](https://github.com/your-username/bookstore-project.git)
cd bookstore-project

3. Backend Setup
a. Create and activate a virtual environment:

# For Windows
python -m venv venv
.\venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate

b. Install the required Python packages:
(First, create a requirements.txt file with the following content)

# requirements.txt
Flask
pymongo
PyJWT
werkzeug
flask-cors

Now, run the installation command:

pip install -r requirements.txt

4. Database Setup
a. Import the sample data into MongoDB:
Make sure the MongoDB service is running. Open a new terminal and run the mongoimport command.

mongoimport --uri "mongodb://localhost:27017/books" --collection books --file books.books.json --jsonArray

This will create a books database and a books collection populated with the sample data.

5. Run the Application
a. Start the Flask server:

python app.py

You should see a message indicating a successful connection to MongoDB.

b. Open the application in your browser:
Navigate to http://127.0.0.1:5000. The website should load and display the book carousels.

#API Endpoints 📖
The Flask API provides the following endpoints. All routes except /login require a valid JWT in the Authorization header.

POST /login

Logs in the admin user and returns a JWT.

Body: { "username": "admin", "password": "adminpass" }

GET /books

Retrieves a list of all books.

Query Params: ?q=<search_term> to search by title/author. ?limit=<number> to limit results.

Requires: Authorization: Bearer <token>

GET /books/<book_id>

Retrieves details for a single book by its ID.

Requires: Authorization: Bearer <token>

Contributing 🤝
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

License 📄
This project is licensed under the MIT License. See the LICENSE file for details.
