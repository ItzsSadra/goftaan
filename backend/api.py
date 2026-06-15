import os
import uuid
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from datetime import datetime, timezone
import speech_recognition as sr
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- Configuration ---
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:BzxQWT9EcsLyl6Zn@services.irn5.chabokan.net:25598/deborah',
)
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'openai/gpt-4o-mini')
UPLOAD_FOLDER = '/tmp/audio_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# --- Database ---
def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS summaries (
            id SERIAL PRIMARY KEY,
            meeting_id INTEGER NOT NULL,
            transcript TEXT DEFAULT '',
            summary TEXT DEFAULT '',
            key_points TEXT[] DEFAULT '{}',
            action_items TEXT[] DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()


# --- Helpers ---
def normalize_email(email):
    if email:
        return email.strip().lower()
    return None


def format_iso_utc(dt):
    if dt:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat(timespec='seconds').replace('+00:00', 'Z')
    return None


def format_summary_row(d):
    result = dict(d)
    if result.get('created_at') and hasattr(result['created_at'], 'isoformat'):
        result['created_at'] = result['created_at'].isoformat().replace('+00:00', 'Z')
    return {
        'id': str(result['id']),
        'meetingId': str(result['meeting_id']),
        'transcript': result.get('transcript', ''),
        'summary': result.get('summary', ''),
        'keyPoints': result.get('key_points', []),
        'actionItems': result.get('action_items', []),
        'createdAt': result.get('created_at'),
    }


# =============================================================================
# AUTH ROUTES
# =============================================================================

@app.route('/api/users/login', methods=['POST'])
def login_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    email = data['email']
    password = data['password']
    normalized_email = normalize_email(email)

    if not normalized_email:
        return jsonify({'error': 'Invalid email format'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, name, email, password FROM users WHERE email = %s AND password = %s LIMIT 1',
                (normalized_email, password),
            )
            user_row = cur.fetchone()

            if user_row:
                return jsonify({
                    'id': user_row['id'],
                    'name': user_row['name'],
                    'email': user_row['email'],
                    'password': user_row['password'],
                }), 200
            else:
                return jsonify({'message': 'ایمیل یا رمز عبور اشتباه است.'}), 400
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'error': 'An error occurred while querying the database'}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/users/signup', methods=['POST'])
def signup_user():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Name, email, and password are required'}), 400

    name = data['name']
    email = data['email']
    password = data['password']
    normalized_email = normalize_email(email)

    if not normalized_email:
        return jsonify({'error': 'Invalid email format'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT id FROM users WHERE email = %s LIMIT 1', (normalized_email,))
            if cur.fetchone():
                return jsonify({'message': 'این ایمیل قبلا ثبت شده است.'}), 409

            cur.execute(
                'INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id, name, email',
                (name, normalized_email, password),
            )
            new_user = cur.fetchone()
            conn.commit()

            if new_user:
                return jsonify({
                    'id': new_user['id'],
                    'name': new_user['name'],
                    'email': new_user['email'],
                }), 201
            else:
                return jsonify({'error': 'Failed to retrieve newly created user data'}), 500
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        conn.rollback()
        return jsonify({'error': 'An error occurred during sign up'}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/users/<string:user_id>', methods=['PUT', 'OPTIONS'])
def update_user_profile(user_id):
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Name and email are required for profile update'}), 400

    name = data['name']
    email = data['email']
    normalized_email = normalize_email(email)

    if not normalized_email:
        return jsonify({'error': 'Invalid email format'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT id, name, email FROM users WHERE id = %s LIMIT 1', (user_id,))
            existing_user = cur.fetchone()

            if not existing_user:
                return jsonify({'error': 'User not found'}), 404

            if existing_user['email'] != normalized_email:
                cur.execute('SELECT id FROM users WHERE email = %s AND id != %s LIMIT 1', (normalized_email, user_id))
                if cur.fetchone():
                    return jsonify({'message': 'این ایمیل قبلا ثبت شده است.'}), 409

            cur.execute(
                'UPDATE users SET name = %s, email = %s WHERE id = %s RETURNING id, name, email',
                (name, normalized_email, user_id),
            )
            updated_user = cur.fetchone()
            conn.commit()

            if updated_user:
                return jsonify({
                    'id': updated_user['id'],
                    'name': updated_user['name'],
                    'email': updated_user['email'],
                }), 200
            else:
                return jsonify({'error': 'Failed to update user profile'}), 500
    except (Exception, psycopg2.DatabaseError) as error:
        print(f'Database error: {error}')
        conn.rollback()
        return jsonify({'error': 'An error occurred during profile update'}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/users/change_password', methods=['POST'])
def change_password():
    data = request.get_json()
    user_id = data.get('user_id')
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not user_id or not current_password or not new_password:
        return jsonify({'message': 'رمز فعلی و رمز جدید الزامی است.'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id FROM users WHERE id = %s AND password = %s LIMIT 1',
                (user_id, current_password),
            )
            if not cur.fetchone():
                return jsonify({'message': 'رمز عبور فعلی اشتباه است.'}), 400

            cur.execute('UPDATE users SET password = %s WHERE id = %s', (new_password, user_id))
            conn.commit()
            return jsonify({'message': 'تغییر رمز عبور با موفقیت انجام شد.'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'تغییر رمز عبور انجام نشد.', 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_account(user_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM meetings WHERE user_id = %s', (user_id,))
            cur.execute('DELETE FROM users WHERE id = %s', (user_id,))
            conn.commit()
        return jsonify({'message': 'حساب کاربری حذف شد.'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'حذف حساب انجام نشد.', 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


# =============================================================================
# MEETING ROUTES
# =============================================================================

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    user_id = request.args.get('user_id')
    upcoming = request.args.get('upcoming', 'false').lower() == 'true'

    if not user_id:
        return jsonify({'message': 'user_id is required'}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        query = '''
            SELECT id, user_id, title, location, notes, start_at, end_at
            FROM meetings
            WHERE user_id = %s
        '''
        params = [user_id]

        if upcoming:
            query += ' AND end_at >= %s'
            params.append(datetime.now(timezone.utc))

        query += ' ORDER BY start_at ASC'
        cur.execute(query, params)
        rows = cur.fetchall()

        formatted_rows = []
        for row in rows:
            d = dict(row)
            d['start_at'] = format_iso_utc(d.get('start_at'))
            d['end_at'] = format_iso_utc(d.get('end_at'))
            formatted_rows.append(d)

        return jsonify(formatted_rows), 200
    except (Exception, psycopg2.DatabaseError) as error:
        print(f'Database error in get_meetings: {error}')
        return jsonify({'message': 'An error occurred while fetching meetings.'}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/meetings', methods=['POST'])
def add_meeting():
    data = request.get_json()
    required = ['user_id', 'title', 'start_at', 'end_at']

    if not all(field in data for field in required):
        return jsonify({'message': 'Missing required fields'}), 400

    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        try:
            start_at_dt = datetime.fromisoformat(data['start_at'].replace('Z', '+00:00'))
            end_at_dt = datetime.fromisoformat(data['end_at'].replace('Z', '+00:00'))

            if start_at_dt.tzinfo is None:
                start_at_dt = start_at_dt.replace(tzinfo=timezone.utc)
            if end_at_dt.tzinfo is None:
                end_at_dt = end_at_dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use ISO 8601 format.'}), 400

        cur.execute(
            '''
            INSERT INTO meetings (user_id, title, location, notes, start_at, end_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, title, location, notes, start_at, end_at
            ''',
            (data['user_id'], data['title'].strip(), data.get('location'), data.get('notes'), start_at_dt, end_at_dt),
        )
        row = cur.fetchone()
        conn.commit()

        if row:
            formatted_row = dict(row)
            formatted_row['start_at'] = format_iso_utc(formatted_row.get('start_at'))
            formatted_row['end_at'] = format_iso_utc(formatted_row.get('end_at'))
            return jsonify(formatted_row), 201
        else:
            return jsonify({'message': 'Meeting was added, but could not retrieve its details.'}), 500
    except (Exception, psycopg2.DatabaseError) as error:
        if conn:
            conn.rollback()
        print(f'Database error in add_meeting: {error}')
        return jsonify({'message': f'An error occurred while adding the meeting: {error}'}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/meetings/<meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('DELETE FROM meetings WHERE id = %s RETURNING id', (meeting_id,))
        deleted = cur.fetchone()
        conn.commit()

        if not deleted:
            return jsonify({'message': 'Meeting not found'}), 404

        return jsonify({'message': 'Meeting deleted'}), 200
    except (Exception, psycopg2.DatabaseError) as error:
        if conn:
            conn.rollback()
        print(f'Database error in delete_meeting: {error}')
        return jsonify({'message': f'An error occurred while deleting the meeting: {error}'}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =============================================================================
# AI ROUTES
# =============================================================================

def transcribe_audio(audio_path: str) -> str:
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio = recognizer.record(source)
    try:
        text = recognizer.recognize_google(audio, language='fa-IR')
        return text
    except sr.UnknownValueError:
        raise ValueError('Google Speech Recognition could not understand the audio')
    except sr.RequestError as e:
        raise ValueError(f'Could not request results from Google Speech Recognition: {e}')


def summarize_text(transcript: str) -> dict:
    if not OPENROUTER_API_KEY:
        raise ValueError('OPENROUTER_API_KEY is not configured')

    client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
    )

    prompt = f'''You are a meeting assistant. Given the following meeting transcript in Persian, provide:
1. A concise summary (2-3 paragraphs in Persian)
2. Key points (bullet points in Persian)
3. Action items (bullet points in Persian)

Transcript:
{transcript}

Respond in valid JSON format only (no markdown):
{{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."]
}}'''

    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[{'role': 'user', 'content': prompt}],
        temperature=0.3,
    )

    content = response.choices[0].message.content

    try:
        json_str = content.strip()
        if '```json' in json_str:
            json_str = json_str.split('```json')[1].split('```')[0].strip()
        elif '```' in json_str:
            json_str = json_str.split('```')[1].split('```')[0].strip()

        result = json.loads(json_str)
        return {
            'summary': result.get('summary', ''),
            'keyPoints': result.get('keyPoints', []),
            'actionItems': result.get('actionItems', []),
        }
    except (json.JSONDecodeError, KeyError):
        return {
            'summary': content,
            'keyPoints': [],
            'actionItems': [],
        }


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    ext = audio_file.filename.rsplit('.', 1)[-1] if '.' in audio_file.filename else 'webm'
    filepath = os.path.join(UPLOAD_FOLDER, f'{uuid.uuid4()}.{ext}')
    audio_file.save(filepath)

    try:
        transcript = transcribe_audio(filepath)
        return jsonify({'transcript': transcript}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500
    finally:
        try:
            os.remove(filepath)
        except Exception:
            pass


@app.route('/api/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    if not data or not data.get('transcript'):
        return jsonify({'error': 'No transcript provided'}), 400

    try:
        result = summarize_text(data['transcript'])
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Summarization failed: {str(e)}'}), 500


@app.route('/api/process-recording', methods=['POST'])
def process_recording():
    meeting_id = request.form.get('meetingId')
    if not meeting_id:
        return jsonify({'error': 'No meetingId provided'}), 400

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    ext = audio_file.filename.rsplit('.', 1)[-1] if '.' in audio_file.filename else 'webm'
    filepath = os.path.join(UPLOAD_FOLDER, f'{uuid.uuid4()}.{ext}')
    audio_file.save(filepath)

    try:
        transcript = transcribe_audio(filepath)
        summary_result = summarize_text(transcript)

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            '''INSERT INTO summaries (meeting_id, transcript, summary, key_points, action_items)
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id, meeting_id, transcript, summary, key_points, action_items, created_at''',
            (int(meeting_id), transcript, summary_result['summary'], summary_result['keyPoints'], summary_result['actionItems']),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify(format_summary_row(row)), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500
    finally:
        try:
            os.remove(filepath)
        except Exception:
            pass


@app.route('/summaries/latest/<int:meeting_id>', methods=['GET'])
def get_latest_summary(meeting_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        '''SELECT id, meeting_id, transcript, summary, key_points, action_items, created_at
           FROM summaries WHERE meeting_id = %s ORDER BY created_at DESC LIMIT 1''',
        (meeting_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify(None), 200

    return jsonify(format_summary_row(row)), 200


@app.route('/summaries/by-meeting-ids', methods=['GET'])
def get_summaries_by_meeting_ids():
    meeting_ids_str = request.args.get('meetingIds', '')
    if not meeting_ids_str:
        return jsonify([]), 200

    meeting_ids = meeting_ids_str.split(',')

    conn = get_db()
    cur = conn.cursor()
    placeholders = ','.join(['%s'] * len(meeting_ids))
    cur.execute(
        f'''SELECT id, meeting_id, transcript, summary, key_points, action_items, created_at
           FROM summaries WHERE meeting_id IN ({placeholders}) ORDER BY created_at DESC''',
        meeting_ids,
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([format_summary_row(row) for row in rows]), 200


@app.route('/summaries', methods=['POST'])
def create_summary():
    data = request.get_json()
    if not data or not data.get('meetingId'):
        return jsonify({'error': 'meetingId is required'}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        '''INSERT INTO summaries (meeting_id, transcript, summary, key_points, action_items)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING id, meeting_id, transcript, summary, key_points, action_items, created_at''',
        (
            int(data['meetingId']),
            data.get('transcript', ''),
            data.get('summary', ''),
            data.get('keyPoints', []),
            data.get('actionItems', []),
        ),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify(format_summary_row(row)), 201


# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)