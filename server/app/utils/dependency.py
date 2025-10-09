from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload, defer
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
from app.database.setup_db import SessionLocal
from app.database.models import AuditLog, User


load_dotenv()

SECRET_KEY = os.getenv('AUTH_SECRET_KEY')

ALGORITHM = os.getenv('AUTH_ALGORITHM')

security = HTTPBearer()

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]

bearer_dependency = Annotated[HTTPAuthorizationCredentials, Depends(security)]

async def get_current_user(token:bearer_dependency):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")

        if email is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user')
        
        return {'email': email, 'id': user_id, 'role': role}
    
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='An error occured during jwt decode')

user_dependency = Annotated[dict, Depends(get_current_user)]


#method to check user permission before taking actions
def required_roles(req_roles: list[str]):
    def check_role(db: db_dependency, user_dep: user_dependency):
        user = db.query(User).options(joinedload(User.roles), defer(User.password)).filter(User.id == user_dep.get("id")).first()
        
        #role = user[0].roles[0].role_name
        role = user.roles[0].role_name

        if role not in req_roles:
            raise HTTPException(
                status_code = status.HTTP_403_FORBIDDEN,
                detail = "Access denied"
            )
        
        return user
    return check_role

async def create_log(db: db_dependency, user_id: int, role: str, action: str, description: str, ip_address: str):
    db_log = AuditLog(
        user_id = user_id,
        role = role,
        action = action,
        description = description,
        ip_address = ip_address
    )

    db.add(db_log)
    db.commit()
    return True


async def get_ip(request: Request):
    # Extract IP address (works behind proxies too if X-Forwarded-For is set)
    client_ip = request.client.host
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    return client_ip




