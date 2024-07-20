import psycopg2
from datetime import datetime
from auth import hash_password
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection parameters
db_params = {
    'dbname': f'{os.environ['DB_NAME']}',
    'user': f'{os.environ['DB_USER']}',
    'password': f'{os.environ['DB_PASS']}',
    'host': f'{os.environ['DB_HOST']}',
    'port': os.environ['DB_PORT'],
}

# Connect to the PostgreSQL database
conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

# User data
username = f'{os.environ['SUPERUSER_USERNAME']}'
email = f'{os.environ['SUPERUSER_EMAIL']}'
password = f'{os.environ['SUPERUSER_PASS']}'
is_superuser = True

# Hash the password
hashed_password = hash_password(password)

# Convert datetime to string
created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

try:
    # Insert the new user
    cursor.execute("""
    INSERT INTO "user" (username, email, hashed_password, is_superuser, created_at)
    VALUES (%s, %s, %s, %s, %s)
    """, (username, email, hashed_password, is_superuser, created_at))
except psycopg2.Error as e:
    print(f"PostgreSQL error: {e}")
except Exception as e:
    print(f"General error: {e}")

# Commit and close
conn.commit()
cursor.close()
conn.close()
