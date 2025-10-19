from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.setup_db import Base, engine
from app.routes import users

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*']
)

# Mount static files for profile pictures
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

@app.get('/')
async def welcome():
    return {"status": "ok","resp": "App is running"}

app.include_router(users.router)