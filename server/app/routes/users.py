
from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import joinedload, defer
from jose import jwt, JWTError
from app.database.models import User, Role, ResetPass, AuditLog
from dotenv import load_dotenv
import os
import uuid
from app.database.schemas import UserCreate, UserResponse, UserLogin, RoleUpdate, UserUpdate, PasswordUpdate, ResetPassword, AdminPassUpdate, AdminUpdateUser

from app.utils.dependency import db_dependency, pwd_context, user_dependency, create_log, required_roles, get_ip

load_dotenv()

SECRET_KEY = os.getenv('AUTH_SECRET_KEY')

ALGORITHM = os.getenv('AUTH_ALGORITHM')


router = APIRouter(
    prefix='/users',
    tags=['user']
)


#This function creates an existing role or create a new one if does not exist
async def get_or_create_roles(db: db_dependency, role_name: str) -> Role:
    role = db.query(Role).filter_by(role_name =role_name).first()
    if not role:
        role = Role(role_name = role_name)
        db.add(role)
        db.commit()
    return role


async def hash_pass(password: str):
    return  pwd_context.hash(password)

# searches for user from the databsae
async def get_user_by_email(db: db_dependency, email: str):
    return db.query(User).options(joinedload(User.roles)).filter(User.email== email).first()


#to create jwt access token
async def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=20)
    to_encode.update({"exp": expire, "type": "access"})

    return jwt.encode(to_encode, SECRET_KEY, algorithm= ALGORITHM)


#to create jwt refresh token
async def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})

    return jwt.encode(to_encode, SECRET_KEY, algorithm= ALGORITHM)


#to verify jwt
async def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get('sub')

        if email is None:
            return None
        
        return payload
    
    except JWTError:
        return None


#to get user data including roles
def get_user_info(db: db_dependency, user_id: int):
    return db.query(User).options(joinedload(User.roles), defer(User.password)).filter(User.id == user_id).first()



async def generate_reset_token(db: db_dependency, email: str):
    reset_token = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(hours=2)
    db_reset = ResetPass(email= email, code = reset_token, expires = expires)
    db.add(db_reset)
    db.commit()

    return reset_token


async def check_reset_token(db: db_dependency, reset_token: str):
    db_token = db.query(ResetPass).filter(ResetPass.code == reset_token).first()
    if not db_token or db_token.expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid or Wrong Reset Token"
        )
    
    return True


#Route to create user accounts
@router.post('/register', response_model= UserResponse,  status_code= status.HTTP_201_CREATED)
async def create_user(db: db_dependency, user_req: UserCreate, request: Request):

    db_user = await get_user_by_email(db, user_req.email)

    if db_user:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "User Alread Exists"
        )
    
    role = await get_or_create_roles(db, user_req.role)

    hashed_password = await hash_pass(user_req.password)

    user_obj = User(
        first_name = user_req.first_name,
        last_name = user_req.last_name,
        email = user_req.email,
        phone = user_req.phone,
        password = hashed_password
    )

    user_obj.roles.append(role)

    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)

    ip = await get_ip(request)
    await create_log(db, user_obj.id, user_req.role, "Register", "Register a new account", ip)

    return user_obj


#Route to create user accounts
@router.post('/add', response_model= UserResponse,  status_code= status.HTTP_201_CREATED)
async def admin_create_user(db: db_dependency, user_dep: user_dependency, user_req: UserCreate, request: Request, role_check = Depends(required_roles(req_roles=["admin"]))):

    db_user = await get_user_by_email(db, user_req.email)

    if db_user:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "User Alread Exists"
        )
    
    role = await get_or_create_roles(db, user_req.role)

    hashed_password = await hash_pass(user_req.password)

    user_obj = User(
        first_name = user_req.first_name,
        last_name = user_req.last_name,
        email = user_req.email,
        phone = user_req.phone,
        password = hashed_password
    )

    user_obj.roles.append(role)

    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)

    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Add User", "Admin added a new user", ip)

    return user_obj


#user login authentication route
@router.post('/login')
async def login(db: db_dependency, login_req: UserLogin, request: Request):
    db_user = await get_user_by_email(db, login_req.email)

    if not db_user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "User Not Found"
        )
    
    if not pwd_context.verify(login_req.password, db_user.password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid Password"
        )
    
    user_data = {"sub": db_user.email, "user_id": db_user.id, "role": db_user.roles[0].role_name}

    access_token = await create_access_token(user_data)
    refresh_token = await create_refresh_token(user_data)

    ip = await get_ip(request)
    await create_log(db, db_user.id, db_user.roles[0].role_name, "Login", "User attempted login", ip)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


#Route to recreate new access token with a refresh token
@router.post('/refresh', response_model=dict)
async def refresh_token(db: db_dependency, refresh_token: str, request: Request):
    payload = await verify_token(refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid Refresh Token"
        )
    

    user = await get_user_by_email(db, payload.get("sub"))
    if not user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "User Not Found"
        )
    
    user_data = {"sub": user.email, "user_id": user.id, "role": user.roles[0].role_name}

    new_access_token = await create_access_token(user_data)

    ip = await get_ip(request)
    await create_log(db, user.id, user.roles[0].role_name, "Refresh Token", "User generated new access token", ip)

    return {"access_token": new_access_token}


#route to retrieve all user 
@router.get('/all')
async def get_users(db: db_dependency, user_dep: user_dependency, request: Request, role_check = Depends(required_roles(req_roles=["admin"]))):
    

    ip = await get_ip(request)
    dd= await create_log(db, user_dep.get("id"), user_dep.get("role"), "Fetch Users", "Admin fetched all users", ip)
    users = db.query(User).options(joinedload(User.roles), defer(User.password)).all()
    return users


#route to retrive a single user using jwt
@router.get('/me')
async def get_user(db: db_dependency, user_dep: user_dependency, request: Request):
    

    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Fetch User Details", "User retrieved user details", ip)

    user = get_user_info(db, user_dep.get("id"))
    return user


#route to retrive a single user using user_id
@router.get('/{id}')
async def admin_get_user(db: db_dependency, user_dep: user_dependency, id: int, request: Request, role_check = Depends(required_roles(req_roles=["admin"]))):
    

    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Admin Fetch User Details", "Admin retrieved user details", ip)

    user = get_user_info(db, id)
    return user

#route to update user role
@router.post('/update/role')
async def update_role(db: db_dependency, user_dep: user_dependency, role_req: RoleUpdate, request: Request, role_check = Depends(required_roles(req_roles=["admin"]))):
    db_role = await get_or_create_roles(db, role_req.role_name)

    user = db.query(User).filter(User.id == role_req.user_id).first()
    user.roles = [db_role]
    db.commit()
    

    new_user = get_user_info(db, role_req.user_id)

    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Update User Role", "Admin updated user role", ip)

    return {"status": "ok", "data": new_user}

#route for updating user info
@router.post('/update')
async def update_user(db: db_dependency, user_dep: user_dependency, update_req: UserUpdate, request: Request):
    
    user_id = user_dep.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    user.first_name = update_req.first_name
    user.last_name = update_req.last_name
    user.email = update_req.email
    user.phone = update_req.phone
    db.commit()
    
    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Update User Info", "User updated profile details", ip)

    new_user = get_user_info(db, user_id)

    return {"status": "ok", "data": new_user}


#route for updating user password
@router.post('/update/password')
async def update_password(db: db_dependency, user_dep: user_dependency, pass_req: PasswordUpdate, request: Request):

    user_id = user_dep.get("id")
    user = db.query(User).filter(User.id == user_id).first()

    if not pwd_context.verify(pass_req.old_password, user.password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid Old Password"
        )
    
    hashed_password = await hash_pass(pass_req.new_password)

    user.password = hashed_password

    db.commit()
    
    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Change User Password", "User changed password", ip)

    new_user = get_user_info(db, user_id)

    return {"status": "ok", "data": new_user}


#route to retrieve all roles
@router.get('/roles')
async def get_roles(db: db_dependency, user_dep: user_dependency):
    roles = db.query(Role).all()

    return roles


#route to generate reset password token
@router.post('/forgot/password')
async def forgot_password(db: db_dependency, email: str):
    db_user = await get_user_by_email(db, email)

    if not db_user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "User Not Found"
        )
    
    reset_password_token = await generate_reset_token(db, email)

    return {"status": "ok", "reset_token": reset_password_token, "expires_in": "2 hours"}


#route to complete reset password process
@router.post('/reset/password')
async def reset_password(db: db_dependency, reset_req: ResetPassword):

    check = await check_reset_token(db, reset_req.reset_token)
    if check:

        db_user = db.query(User).filter(User.email== reset_req.email).first()

        if not db_user:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "User Not Found"
            )
        
        hashed_password = await hash_pass(reset_req.new_password)

        db_user.password = hashed_password
        db.commit()

        return {"status": "ok", "message": "successful"}
    

#route for the admin to update a user's password
@router.post('/admin/update/password')
async def admin_update_user_password(db: db_dependency, user_dep: user_dependency, pass_req: AdminPassUpdate, request:Request, role_check = Depends(required_roles(req_roles=["admin"]))):

    user_id = pass_req.user_id
    user = db.query(User).filter(User.id == user_id).first()

    hashed_password = await hash_pass(pass_req.new_password)

    user.password = hashed_password

    db.commit()
    

    new_user = get_user_info(db, user_id)

    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Admin Change Password", "Admin updated user password", ip)

    return {"status": "ok", "data": new_user}


#route for admin to update user info
@router.post('/admin/update')
async def admin_update_user(db: db_dependency, user_dep: user_dependency, update_req: AdminUpdateUser, request:Request, role_check = Depends(required_roles(req_roles=["admin"]))):
    
    user_id = update_req.user_id
    user = db.query(User).filter(User.id == user_id).first()
    user.first_name = update_req.first_name
    user.last_name = update_req.last_name
    user.email = update_req.email
    user.phone = update_req.phone
    db.commit()
    

    new_user = get_user_info(db, user_id)

    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Admin Update User", "Admin updated user details", ip)

    return {"status": "ok", "data": new_user}


#route to retrive all logs
@router.get('/logs')
async def get_logs(db: db_dependency, user_dep: user_dependency, request: Request, role_check = Depends(required_roles(req_roles=["admin"]))):
    
    ip = await get_ip(request)
    await create_log(db, user_dep.get("id"), user_dep.get("role"), "Fetch Logs", "Admin retrieved access logs", ip)

    logs = db.query(AuditLog).options(joinedload(AuditLog.user)).all()
    return [
        {
            "log_id": log.id,
            "user_id": log.user_id,
            "first_name": log.user.first_name if log.user else None,
            "role": log.role,
            "action": log.action,
            "description": log.description,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        }
        for log in logs
    ]


