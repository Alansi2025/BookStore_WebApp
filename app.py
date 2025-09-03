from flask import Flask, jsonify, render_template, request
from pymongo import MongoClient, errors
from bson import ObjectId, errors as bson_errors
from flask_cors import CORS

# ---------------------------
# MongoDB Connection
# ---------------------------
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "books"
COLLECTION_NAME = "books"

# Create a single MongoClient instance. PyMongo handles connection pooling
# and will connect lazily (on the first operation). This is more robust
# than connecting at application startup, as it will automatically try to
# connect when the first database operation is performed.
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]
books_collection = db[COLLECTION_NAME]

# ---------------------------
# Flask App
# ---------------------------
app = Flask(__name__)
CORS(app)  # allow cross-origin requests

# ---------------------------
# Routes
# ---------------------------
@app.route("/")
def index():
    """Serve frontend (index.html)"""
    return render_template("index.html")


@app.route("/books", methods=["GET"])
def get_books():
    try:
        query = {}
        
        # Text search
        search_term = request.args.get('q')
        if search_term:
            # Using a regex for a simple case-insensitive 'contains' search
            query['$or'] = [
                {'title': {'$regex': search_term, '$options': 'i'}},
                {'author': {'$regex': search_term, '$options': 'i'}}
            ]

        # Filter by genre
        genre = request.args.get('genre')
        if genre:
            query['genre'] = genre

        # Filter by type
        book_type = request.args.get('type')
        if book_type:
            query['type'] = book_type

        # Filter by year (published after)
        year = request.args.get('year')
        if year and year.isdigit():
            query['year'] = {'$gte': year}

        # Sorting
        sort_by = request.args.get('sort', 'recent')
        sort_field = None
        if sort_by == 'title':
            sort_field = ('title', 1)
        elif sort_by == 'author':
            sort_field = ('author', 1)
        elif sort_by == 'recent':
            sort_field = ('year', -1)

        # PyMongo will attempt to connect on the first query.
        # If the database is not available, it will raise an exception.
        books_cursor = books_collection.find(query)
        if sort_field:
            books_cursor = books_cursor.sort([sort_field])

        books = []
        for book in books_cursor:
            book["_id"] = str(book["_id"])
            books.append(book)

        return jsonify(books), 200
    except errors.ServerSelectionTimeoutError:
        return jsonify({"error": "Database connection timed out. Is MongoDB running?"}), 500
    except Exception as e:
        print(f"❌ Error in get_books: {e}")
        return jsonify({"error": "An unexpected error occurred while retrieving books."}), 500

@app.route("/books/<book_id>", methods=["GET"])
def get_single_book(book_id):
    """Fetch single book details by ID"""
    try:
        obj_id = ObjectId(book_id)
    except bson_errors.InvalidId:
        return jsonify({"error": "Invalid book ID format."}), 400

    try:
        book = books_collection.find_one({"_id": obj_id})
        if book:
            book["_id"] = str(book["_id"])
            return jsonify(book), 200
        else:
            return jsonify({"error": "Book not found"}), 404
    except errors.ServerSelectionTimeoutError:
        return jsonify({"error": "Database connection timed out. Is MongoDB running?"}), 500
    except Exception as e:
        print(f"❌ Error fetching single book: {e}")
        return jsonify({"error": "An unexpected error occurred while retrieving the book."}), 500


# ---------------------------
# Run Flask App
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
