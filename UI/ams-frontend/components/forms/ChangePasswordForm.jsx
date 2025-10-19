"use client"

import React, {useState} from 'react';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; 
import {getDashboardForRole} from '@/lib/roleRedirect';

const schema = z.object({
  currentPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password does not match new password" }),
  
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // sets error on confirmPassword
  });


const ChangePasswordForm = ({session}) => {

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async data => {
    setLoading(true);
    setError("");

    try {
        const result = await fetch("http://localhost:8000/users/update/password", {
          method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              "Authorization": `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify({
              old_password: data.currentPassword,
              new_password: data.newPassword
            }),
        })

        if (result.ok) {
            const dashboardPath = getDashboardForRole(session.user?.role);
            router.push(dashboardPath)
            router.refresh();
        } else {
            
            setError("Failed to update");
        }
        
    } catch (error) {
        setError(
          "An unexpected error occurred. Please try again - " +
          (error instanceof Error ? error.message : String(error))
        );
        
    }

    setLoading(false);
    
  })


  return (
    <form className='flex flex-col gap-8' onSubmit={onSubmit}>
        <h1 className='text-xl font-bold text-left'>Change Password</h1>
        
        <div className='flex flex-col w-full lg:w-[50%] gap-4'>
            <label htmlFor='currentPassword' className='text-sm text-gray-500'> Current Password</label>
            <input type='password' {...register("currentPassword")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
            {errors.currentPassword?.message && <p className='text-xs text-red-400'>{errors.currentPassword?.message.toString()}</p>}
        
        </div>

        <div className='flex flex-col gap-4 lg:flex-row'>
            <div className='flex flex-col w-full gap-4'>
                <label htmlFor='newPassword' className='text-sm text-gray-500'> New Password</label>
            <input type='password' {...register("newPassword")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
            {errors.newPassword?.message && <p className='text-xs text-red-400'>{errors.newPassword?.message.toString()}</p>}

            </div>
            
            <div className='flex flex-col w-full gap-4'>
                <label htmlFor='confirmPassword' className='text-sm text-gray-500'> Confirm New Password</label>
            <input type='password' {...register("confirmPassword")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
            {errors.confirmPassword?.message && <p className='text-xs text-red-400'>{errors.confirmPassword?.message.toString()}</p>}
            </div>

           
        </div>

        {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

        <button type='submit' disabled={loading} className='bg-red-500 text-white py-2 px-4 rounded-md border-none w-max self-left'>
            {loading ? 'Updating...' : 'Update Password'}
        </button>
    </form>
  )
}

export default ChangePasswordForm