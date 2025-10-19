from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.database.setup_db import Base




#Thsi is an association table to handle many-to-many relation between users and roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)


#This class defines the user model
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable= False)
    password = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    roles = relationship('Role', secondary=user_roles, back_populates='users')
    audit_logs = relationship('AuditLog', back_populates='user')

#This defines the role model
class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, nullable=False)
    users = relationship('User', secondary=user_roles, back_populates='roles')


#This defines the los model
class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    role = Column(String)
    action = Column(String(100))
    description = Column(String(255))
    ip_address = Column(String(50))
    user = relationship('User', back_populates='audit_logs')


class ResetPass(Base):
    __tablename__ = 'reset_password'
    id = Column(Integer, primary_key=True)
    email = Column(String, index=True)
    code = Column(String, index=True)
    expires = Column(DateTime(timezone=True))



