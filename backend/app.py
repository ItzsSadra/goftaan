import uuid
from flask import Flask, request, jsonify
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# --- Database Connection ---
def get_db_connection():
    try:
        conn = psycopg2.connect("postgresql://postgres:BzxQWT9EcsLyl6Zn@services.irn5.chabokan.net:25598/deborah")
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# --- Helper function to normalize email ---
def normalize_email(email):
    if email:
        return email.strip().lower()
    return None

# --- API Endpoint for Login ---
@app.route('/api/users/login', methods=['POST'])
def login_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400

    email = data['email']
    password = data['password']
    normalized_email = normalize_email(email)

    if not normalized_email:
        return jsonify({"error": "Invalid email format"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    user_data = None
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, email, password FROM users WHERE email = %s AND password = %s LIMIT 1",
                (normalized_email, password)
            )
            user_row = cur.fetchone()

            if user_row:
                user_data = {
                    "id": user_row[0],
                    "name": user_row[1],
                    "email": user_row[2],
                    "password": user_row[3]
                }
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({"error": "An error occurred while querying the database"}), 500
    finally:
        if conn:
            conn.close()

    if user_data:
        return jsonify(user_data), 200
    else:
        return jsonify({"message": "ایمیل یا رمز عبور اشتباه است."}), 400

# --- API Endpoint for Sign Up ---
@app.route('/api/users/signup', methods=['POST'])
def signup_user():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Name, email, and password are required"}), 400

    name = data['name']
    email = data['email']
    password = data['password']
    normalized_email = normalize_email(email)

    if not normalized_email:
        return jsonify({"error": "Invalid email format"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    created_user_id = None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (normalized_email,))
            existing_user = cur.fetchone()

            if existing_user:
                return jsonify({"message": "این ایمیل قبلا ثبت شده است."}), 409

            cur.execute(
                "INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id",
                (name, normalized_email, password)
            )
            created_user_id = cur.fetchone()[0]

        conn.commit()

        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, email FROM users WHERE id = %s",
                (created_user_id,)
            )
            new_user_row = cur.fetchone()

            if new_user_row:
                return jsonify({
                    "id": new_user_row[0],
                    "name": new_user_row[1],
                    "email": new_user_row[2]
                }), 201

            else:
                return jsonify({"error": "Failed to retrieve newly created user data"}), 500

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        conn.rollback()
        return jsonify({"error": "An error occurred during sign up"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/users/<string:user_id>', methods=['PUT', 'OPTIONS'])
def update_user_profile(user_id):
    if request.method == 'OPTIONS':
        return '', 204 # No Content

    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({"error": "Name and email are required for profile update"}), 400

    name = data['name']
    email = data['email']
    normalized_email = normalize_email(email)

    if not normalized_email:
        return jsonify({"error": "Invalid email format"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor() as cur:
            # Convert the incoming user_id string to a UUID object for validation
            try:
                user_uuid_obj = uuid.UUID(user_id)
                # Convert the UUID object to a string for the database query
                user_id_str = str(user_uuid_obj)
            except ValueError:
                return jsonify({"error": "Invalid user ID format"}), 400

            # 1. Check if the user exists
            # Pass the STRING representation of the UUID to the query
            cur.execute("SELECT id, name, email FROM users WHERE id = %s LIMIT 1", (user_id_str,))
            existing_user = cur.fetchone()

            if not existing_user:
                return jsonify({"error": "User not found"}), 404

            # 2. Check if the new email is already used by another user
            # existing_user[2] is the email, existing_user[0] is the id (which is a UUID object from fetchone)
            if existing_user[2] != normalized_email:
                # Pass the STRING representation of the UUID for the current user's ID
                cur.execute("SELECT id FROM users WHERE email = %s AND id != %s LIMIT 1", (normalized_email, user_id_str))
                email_conflict_user = cur.fetchone()
                if email_conflict_user:
                    return jsonify({"message": "این ایمیل قبلا ثبت شده است."}), 409 # Conflict

            # 3. Update the user profile
            # Pass the STRING representation of the UUID for the WHERE clause
            cur.execute(
                "UPDATE users SET name = %s, email = %s WHERE id = %s RETURNING id, name, email",
                (name, normalized_email, user_id_str)
            )
            updated_user_row = cur.fetchone()

            if not updated_user_row:
                return jsonify({"error": "Failed to update user profile"}), 500

            conn.commit() # Commit the transaction

            # Return the updated user's details
            # Ensure the ID is returned as a string
            return jsonify({
                "id": str(updated_user_row[0]), # updated_user_row[0] is likely a UUID object from RETURNING
                "name": updated_user_row[1],
                "email": updated_user_row[2]
            }), 200 # OK status code

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        conn.rollback()
        return jsonify({"error": "An error occurred during profile update"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/users/change_password", methods=["POST"])
def change_password():
    data = request.get_json()
    user_id = data.get("user_id")
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    conn = get_db_connection()

    if not user_id or not current_password or not new_password:
        return jsonify({"message": "رمز فعلی و رمز جدید الزامی است."}), 400

    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM users WHERE id=%s AND password=%s LIMIT 1;",
        (user_id, current_password)
    )
    user = cur.fetchone()

    if not user:
        return jsonify({"message": "رمز عبور فعلی اشتباه است."}), 400

    try:
        cur.execute(
            "UPDATE users SET password=%s WHERE id=%s;",
            (new_password, user_id)
        )
        conn.commit()
        return jsonify({"message": "تغییر رمز عبور با موفقیت انجام شد."}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "تغییر رمز عبور انجام نشد.", "error": str(e)}), 500
    finally:
        cur.close()


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_account(user_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Delete related meetings first
        cur.execute("DELETE FROM meetings WHERE user_id=%s;", (user_id,))
        # Delete the user
        cur.execute("DELETE FROM users WHERE id=%s;", (user_id,))
        conn.commit()
        cur.close()
        return jsonify({"message": "حساب کاربری حذف شد."}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "حذف حساب انجام نشد.", "error": str(e)}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)