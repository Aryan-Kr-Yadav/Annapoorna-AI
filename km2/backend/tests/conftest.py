import os

# Ensure app.core.config.Settings() can construct even when tests run
# without a real .env file / real database — these tests never touch a
# live DB or a live Groq API key.
os.environ.setdefault("DEV_AUTH_BYPASS", "true")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://user:pass@localhost/db")
