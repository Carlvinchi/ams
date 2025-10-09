from sqlalchemy  import create_engine, DateTime, func, Column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

PG_USER = os.getenv('PG_USER')


PG_PASSWORD = os.getenv('PG_PASSWORD')

PG_DB = os.getenv('PG_DB')

SQL_ALCHEMY_DATABASE_URL = f'postgresql://{PG_USER}:{PG_PASSWORD}@localhost:5432/{PG_DB}'

engine = create_engine(SQL_ALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#This class is for creating timestamps during db operations
class TimeStamps:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

Base = declarative_base(cls = TimeStamps)