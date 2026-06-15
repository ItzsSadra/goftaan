# app.py (modified snippet for add_meeting)
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime, timezone

app = Flask(__name__)

CORS(app)


def get_db():
    """Create a new database connection for each request"""
    return psycopg2.connect(
        'postgresql://postgres:BzxQWT9EcsLyl6Zn@services.irn5.chabokan.net:25598/deborah',
        cursor_factory=RealDictCursor,
    )

# Helper to format datetime to ISO string with 'Z' for UTC
def format_iso_utc(dt):
    if dt:
        # Ensure dt is timezone-aware (UTC) before formatting
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        # Use timespec='seconds' for cleaner output, and replace +00:00 with Z
        return dt.isoformat(timespec='seconds').replace('+00:00', 'Z')
    return None

@app.route("/api/meetings", methods=["GET"])
def get_meetings():
    """GET /api/meetings?user_id=xxx&upcoming=true"""
    user_id = request.args.get("user_id")
    upcoming = request.args.get("upcoming", "false").lower() == "true"

    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        query = """
            SELECT id, user_id, title, location, notes, start_at, end_at
            FROM meetings
            WHERE user_id = %s
        """
        params = [user_id]

        if upcoming:
            query += " AND end_at >= %s"
            params.append(datetime.now(timezone.utc))

        query += " ORDER BY start_at ASC"
        cur.execute(query, params)
        rows = cur.fetchall()

        formatted_rows = []
        for row in rows:
            # RealDictCursor rows are dict-like. dict(row) should work.
            # If it fails, it's likely not a RowProxy or dict.
            try:
                current_row_dict = dict(row) # Attempt conversion
                current_row_dict['start_at'] = format_iso_utc(current_row_dict.get('start_at'))
                current_row_dict['end_at'] = format_iso_utc(current_row_dict.get('end_at'))
                formatted_rows.append(current_row_dict)
            except TypeError:
                print(f"Warning: Could not convert row to dict in get_meetings: {row}")
                # Optionally, you could try to build the dict manually if you know the expected fields
                # but it's better to debug why row isn't a RowProxy.

        return jsonify(formatted_rows), 200

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error in get_meetings: {error}")
        return jsonify({"message": f"An error occurred while fetching meetings."}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/meetings", methods=["POST"])
def add_meeting():
    """POST /api/meetings"""
    data = request.get_json()
    required = ["user_id", "title", "start_at", "end_at"]

    if not all(field in data for field in required):
        return jsonify({"message": "Missing required fields"}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Parse input ISO strings and ensure they are UTC aware
        try:
            start_at_dt = datetime.fromisoformat(data["start_at"].replace('Z', '+00:00'))
            end_at_dt = datetime.fromisoformat(data["end_at"].replace('Z', '+00:00'))

            if start_at_dt.tzinfo is None:
                 start_at_dt = start_at_dt.replace(tzinfo=timezone.utc)
            if end_at_dt.tzinfo is None:
                 end_at_dt = end_at_dt.replace(tzinfo=timezone.utc)

        except ValueError:
            return jsonify({"message": "Invalid date format. Use ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DDTHH:MM:SS+HH:MM)."}), 400

        cur.execute(
            """
            INSERT INTO meetings (user_id, title, location, notes, start_at, end_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, title, location, notes, start_at, end_at
            """,
            (
                data["user_id"],
                data["title"].strip(),
                data.get("location"),
                data.get("notes"),
                start_at_dt,
                end_at_dt,
            ),
        )
        row = cur.fetchone()

        conn.commit()

        # *** Focus on this section ***
        if row is not None: # Explicitly check if row is NOT None
            # If RealDictCursor returns a dict-like object, dict(row) should work.
            # If it's still causing a TypeError, it means 'row' is not compatible.
            try:
                formatted_row = dict(row) # Try converting row to dict
                formatted_row['start_at'] = format_iso_utc(formatted_row.get('start_at'))
                formatted_row['end_at'] = format_iso_utc(formatted_row.get('end_at'))
                return jsonify(formatted_row), 201
            except TypeError:
                # This fallback is highly unlikely if RealDictCursor is functioning correctly,
                # but it's a safety net. If this is hit, the fundamental issue is with 'row'.
                print(f"Error: Failed to convert fetched row to dict in add_meeting. Row type: {type(row)}, Row content: {row}")
                # You might want to try building the dictionary manually here if you know the schema
                # Example:
                # fields = [desc[0] for desc in cur.description]
                # formatted_row = dict(zip(fields, row))
                # ... then format dates ...
                # However, the PRIMARY goal should be understanding why dict(row) fails.
                return jsonify({"message": "Internal server error processing meeting data."}), 500
        else:
            # If row is None, the INSERT might have succeeded but RETURNING failed or returned nothing.
            # This shouldn't happen with a simple INSERT...RETURNING unless there's a DB constraint
            # or trigger that interferes, or if the RETURNING clause itself is somehow problematic.
            print("Warning: INSERT succeeded but fetchone() returned None in add_meeting.")
            return jsonify({"message": "Meeting was added, but could not retrieve its details."}), 500

    except (Exception, psycopg2.DatabaseError) as error:
        if conn:
            conn.rollback()
        print(f"Database error in add_meeting: {error}")
        return jsonify({"message": f"An error occurred while adding the meeting: {error}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/meetings/<meeting_id>", methods=["DELETE"])
def delete_meeting(meeting_id):
    """DELETE /api/meetings/<id>"""
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("DELETE FROM meetings WHERE id = %s RETURNING id", (meeting_id,))
        deleted = cur.fetchone() # fetchone() returns dict-like if RealDictCursor and a row is found, else None

        conn.commit()

        if not deleted:
            return jsonify({"message": "Meeting not found"}), 404

        return jsonify({"message": "Meeting deleted"}), 200
    except (Exception, psycopg2.DatabaseError) as error:
        if conn:
            conn.rollback()
        print(f"Database error in delete_meeting: {error}")
        return jsonify({"message": f"An error occurred while deleting the meeting: {error}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == "__main__":
    app.run(debug=True)
    # app.run(debug=True)
