/* login page 
    - contains the login form component
*/

import LoginForm from '@/components/forms/LoginForm'
import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className='w-screen h-screen flex items-center justify-center bg-[url("/mfc_bg.jpg")] bg-cover bg-center bg-no-repeat'>
        <div className='w-[90%] md:w-[50%] lg:w-[40%] xl:w-[30%] bg-white p-4 rounded-md'>
            <LoginForm />

            <div>
                <p className="text-xs text-gray-500 mt-4">Forgot your password? <span className='text-red-500 cursor-pointer'>
                    <Link href="/reset-password">Reset Password</Link>
                    </span></p>
            </div>
        </div>
        
    </div>
  )
}

export default page