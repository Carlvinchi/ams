"use client"

import React, {useState} from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; 
import {getDashboardForRole} from '@/lib/roleRedirect';

// Define the schema using Zod
const schema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  
});

const LoginForm = () => {

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

  // Handle form submission
  const onSubmit = handleSubmit(async data => {
    setLoading(true);
    setError("");

    try {
        const result = await signIn("credentials", {
            redirect: false,
            email: data.email,
            password: data.password
        });

        if (result?.error) {
            
            setError("Invalid email or password");
        } else {

            // Fetch the session to get the user role
            const response = await fetch('/api/auth/session');
            const session = await response.json();
            const dashboardPath = getDashboardForRole(session.user?.role);

            router.push(dashboardPath);
            router.refresh();
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
    <form className='flex flex-col gap-4' onSubmit={onSubmit}>
        <h1 className='text-xl font-bold text-center'>Login Form</h1>
        <label htmlFor='email' className='text-sm text-gray-500'>Email</label>
        <input type='text' {...register("email")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
        {errors.email?.message && <p className='text-xs text-red-400'>{errors.email?.message.toString()}</p>}

        <label htmlFor='password' className='text-sm text-gray-500'>Password</label>
        <input type='password' {...register("password")} className='ring-[1.5px] ring-gray-300 p-2 rounded-md'/>
        {errors.password?.message && <p className='text-xs text-red-400'>{errors.password?.message.toString()}</p>}

        {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

        <button type='submit' disabled={loading} className='bg-red-500 text-white py-2 px-4 rounded-md border-none w-max self-center'>
            {loading ? 'Signing in...' : 'Sign in'}
        </button>
    </form>
  )
}

export default LoginForm