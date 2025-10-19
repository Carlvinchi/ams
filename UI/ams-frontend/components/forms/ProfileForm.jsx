"use client"

import React, {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; 

const schema = z.object({
  email: z.email({ message: "Invalid email address" }),
  firstName: z.string({message: "First name is required"}),
  lastName: z.string({message: "Last name is required"}),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" })
});


const ProfileForm = ({profileData, session, onUpdateSuccess}) => {

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
        }
  });

  useEffect(() => {
        if (profileData) {
            reset({
                firstName: profileData.first_name || "",
                lastName: profileData.last_name || "",
                email: profileData.email || "",
                phone: profileData.phone || "",
            });
        }
    }, [profileData, reset]);

  const onSubmit = handleSubmit(async data => {
    setLoading(true);
    setError("");

    try {
        const result = await fetch("http://localhost:8000/users/update", {
          method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              "Authorization": `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify({
              email: data.email,
              phone: data.phone,
              first_name: data.firstName,
              last_name: data.lastName
            }),
        })

        if (result.ok) {
            onUpdateSuccess();
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
        <h1 className='text-xl font-bold text-left'>Profile Details</h1>
        
        <div className='flex gap-4 flex-col lg:flex-row'>
            
            <div className='flex flex-col w-full lg:w-[50%] gap-4'>
                <label htmlFor='firstName' className='text-sm text-gray-500'> First Name</label>
                <input type='text' {...register("firstName")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
                {errors.firstName?.message && <p className='text-xs text-red-400'>{errors.firstName?.message.toString()}</p>}
            </div>

            <div className='flex flex-col w-full lg:w-[50%] gap-4'>
                <label htmlFor='lastName' className='text-sm text-gray-500'> Last Name</label>
                <input type='text' {...register("lastName")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
                {errors.lastName?.message && <p className='text-xs text-red-400'>{errors.lastName?.message.toString()}</p>}
            </div>

        </div>

        <div className='flex gap-4 flex-col lg:flex-row'> 
            <div className='flex flex-col w-full lg:w-[50%] gap-4'>
                <label htmlFor='email' className='text-sm text-gray-500'> Email</label>
                <input type='text' {...register("email")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
                {errors.email?.message && <p className='text-xs text-red-400'>{errors.email?.message.toString()}</p>}
            </div>

            <div className='flex flex-col w-full lg:w-[50%] gap-4'>
                <label htmlFor='phone' className='text-sm text-gray-500'> Phone</label>
                <input type='text' {...register("phone")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
                {errors.phone?.message && <p className='text-xs text-red-400'>{errors.phone?.message.toString()}</p>}
            </div>
        </div>

        <div className='flex flex-col w-full lg:w-[50%] gap-4'>
            <label htmlFor='currentPassword' className='text-sm text-gray-500'> Role </label>
            <input type='text' className='ring-[1.5px] ring-gray-300 p-2 rounded-md' defaultValue={profileData?.roles?.[0]["role_name"] || ""} readOnly/>
    
        </div>

        {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

        <button type='submit' disabled={loading} className='bg-red-500 text-white py-2 px-4 rounded-md border-none w-max self-left'>
            {loading ? 'Updating...' : ' Update Profile'}
        </button>
    </form>
  )
}

export default ProfileForm