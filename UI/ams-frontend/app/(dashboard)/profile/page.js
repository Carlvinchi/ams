"use client"
import ChangePasswordForm from '@/components/forms/ChangePasswordForm'
import ProfileForm from '@/components/forms/ProfileForm'
import UploadImageModal from '@/components/forms/UploadImageModal'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'


const Profile = () => {
    const { data: session, status } = useSession()
    const [protectedData, setProtectedData] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchProtectedData = React.useCallback(async () => {
          if (!session?.accessToken) return

          setLoading(true);

          try {
            const response = await fetch('http://localhost:8000/users/me', {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            })
    
            if (response.status === 200) {
              const data = await response.json()
              setProtectedData(data)
            }

            if (response.status === 401) {
                router.push('/login')
            }

          } catch (error) {
            console.error('Error fetching protected data:', error)
          }
          setLoading(false)
        }, [session?.accessToken, router, setProtectedData])

    useEffect(() => {
        if (status === 'unauthenticated') {
          router.push('/login')
        }
      }, [status, router])
    
    useEffect(() => {
        
        if (session?.accessToken) {
          fetchProtectedData()
        }
      }, [session, router, fetchProtectedData])

    if (status === 'loading') {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <p>Loading...</p>
          </div>
        )
      }

    if (!session) {
      return null
    }

  return (
    <div className='flex-1 flex flex-col justify-center items-center gap-4 p-4 my-4 mx-2'>

        {/* Profile Image */}
        
        <div className='bg-white w-full p-6 rounded-2xl flex flex-col gap-4 justify-center items-center'>
          <div className='py-6 px-4 rounded-full flex-1 flex gap-4 w-full max-w-sm items-center justify-center'>
          <Image src={protectedData?.profile_picture ? 'http://localhost:8000'+protectedData.profile_picture : '/avatar.png'} alt="profile image" width={200} height={200} className='w-full rounded-md object-cover' />
          
        </div>
        {session && <UploadImageModal session={session} onUploadSuccess={fetchProtectedData} />}
        </div>

        
        {/* Profile Details */}
        <div className='bg-white p-4 w-full rounded-2xl'>
          {session && <ProfileForm  session={session} onUpdateSuccess={fetchProtectedData} profileData={protectedData}/>}
            
        </div>

        {/* Change Password */}
        <div className='bg-white p-4 w-full rounded-2xl'>
          {session && <ChangePasswordForm session={session} />}
          </div>

    </div>
  )
}

export default Profile