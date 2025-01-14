import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, Connection

conn: Connection = None

def init_db():
  global conn

  print("Initializing db connection")
  DATABASE_URL: str = os.getenv("POSTGRES_DSN")

  if not DATABASE_URL:
    raise Exception("DATABASE_URL env var not supplied!")

  _engine: Engine = create_engine(DATABASE_URL)
  conn = _engine.connect()
