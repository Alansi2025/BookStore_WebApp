import os
from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask import Flask, jsonify, request
from pymongo import MongoClient, errors
from bson import ObjectId, errors as bson_errors
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

# ---------------------------
# App Initialization & Configuration
# ---------------------------
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# IMPORTANT: Change this secret key in a real application!
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "my_super_secret_key_that_is_long_and_random")

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = generate_password_hash("adminpass", method="pbkdf2:sha256")

# ---------------------------
# MongoDB Configuration & Connection
# ---------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "books"
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ismaster')
    db = client[DB_NAME]
    books_collection = db["books"]
    print("✅ MongoDB connection successful.")
except errors.ServerSelectionTimeoutError as err:
    print(f"❌ MongoDB connection failed: {err}")
    client = None
    db = None
    books_collection = None
    
# ---------------------------
# Helper & Decorator
# ---------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return jsonify({"error": "Malformed token header"}), 401
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid"}), 401
        return f(*args, **kwargs)
    return decorated

def serialize_book(book):
    if book and "_id" in book:
        book["_id"] = str(book["_id"])
    return book

# ---------------------------
# Error Handlers
# ---------------------------
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "An internal server error occurred"}), 500

@app.before_request
def check_db_connection():
    if client is None or books_collection is None:
        return jsonify({"error": "Database connection is not available."}), 503

# ---------------------------
# Routes
# ---------------------------

@app.route("/")
def index():
    return app.send_static_file('index.html')

# --- AUTH ROUTE ---
@app.route("/login", methods=["POST"])
def login():
    auth = request.json
    if not auth or not auth.get('username') or not auth.get('password'):
        return jsonify({"error": "Username and password are required"}), 400
    username = auth.get('username')
    password = auth.get('password')
    if username == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD_HASH, password):
        token = jwt.encode({
            'user': username,
            'exp': datetime.utcnow() + timedelta(hours=24) # Increased token lifetime
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"token": token}), 200
    return jsonify({"error": "Invalid credentials"}), 401

# --- PROTECTED BOOK ROUTES ---
@app.route("/books", methods=["GET"])
@token_required
def get_books():
    query = {}
    if search_term := request.args.get('q'):
        query['$or'] = [
            {'title': {'$regex': search_term, '$options': 'i'}},
            {'author': {'$regex': search_term, '$options': 'i'}}
        ]
    try:
        limit = int(request.args.get('limit', 100)) # Increased limit to fetch more books for carousels
    except ValueError:
        return jsonify({"error": "Invalid 'limit' parameter"}), 400
    
    books_cursor = books_collection.find(query).limit(limit)
    books = [serialize_book(book) for book in books_cursor]
    
    return jsonify({"data": books}), 200

@app.route("/books/<book_id>", methods=["GET"])
@token_required
def get_single_book(book_id):
    try:
        obj_id = ObjectId(book_id)
    except bson_errors.InvalidId:
        return jsonify({"error": "Invalid book ID format."}), 400

    book = books_collection.find_one({"_id": obj_id})
    if not book:
        return jsonify({"error": "Book not found"}), 404
    
    return jsonify(serialize_book(book)), 200

if __name__ == "__main__":
    if client is None:
        print("🚨 Cannot start Flask server, MongoDB connection is not available.")
    else:
        app.run(debug=True, port=5000)

