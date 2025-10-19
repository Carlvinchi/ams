/* RoleGuard component to protect routes based on user roles
    Utilizes NextAuth.js for session management and redirects users
    to appropriate dashboards if they lack access permissions.
 */

"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'


const ROLE_DASHBOARDS = {
  admin: '/admin/',
  coach: '/coach/',
  athlete: '/athlete/',
}


const RoleGuard = ({children, allowedRoles}) => {
    const {data: session, status} = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'loading') return // Do nothing while loading

        if (!session) {
            router.push('/login')
            return
        }

        const userRole = session.user?.role

        // Redirect if user role is not allowed
        if (allowedRoles && !allowedRoles.includes(userRole)) {
            const redirectPath = ROLE_DASHBOARDS[userRole] || '/login'
            router.push(redirectPath)
            return
        }
    }, [session, status, router, allowedRoles])

    if (status === 'loading') {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        </div>
        )
    }

    if (!session) {
        return null
    }

    const userRole = session.user?.role
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return null
    }

  return children
}

export default RoleGuard