from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


#This file contains the schema for request and response objects

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    password: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    created_at: datetime

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    role_name: str
    role_id: int = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'

class UserLogin(BaseModel):
    
    email: EmailStr
    password: str

class RoleUpdate(BaseModel):
    user_id: int
    role_name: str

class UserUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str


class AdminUpdateUser(UserUpdate):
    user_id: int


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str


class AdminPassUpdate(PasswordUpdate):
    user_id: int


class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str
    reset_token: str


