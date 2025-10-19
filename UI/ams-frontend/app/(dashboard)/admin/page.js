"use client"
import RoleGuard from '@/components/RoleGuard';
import React, {useState, useEffect} from 'react'
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const AdminDashboard = () => {
  const {data: session, status} = useSession();
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div>Admin Dashboard {session?.user?.email}</div>
      <button onClick={() => signOut({callbackUrl: '/login'})}>Sign Out</button>
    </RoleGuard>
    
  )
}

export default AdminDashboard