"use client"
import { X } from 'lucide-react';
import React, { useState } from 'react'


const UploadImageModal = ({session, onUploadSuccess}) => {
    const[open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);


    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError("");
            
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        if (file) {
            formData.append('upload_file', file);
        }

        try {
            const result = await fetch("http://localhost:8000/users/upload/profile-picture", {
                method: "POST",
                body: formData,
                headers:{
                    "Authorization": `Bearer ${session?.accessToken}`
                }
            })

            if (result.ok) {
                
                setOpen(false);
                onUploadSuccess();
            } else {
                setError("Failed to upload image");
            }
            
        } catch (error) {
            setError(
            "An unexpected error occurred. Please try again - " +
            (error instanceof Error ? error.message : String(error))
            );
            
        }

    setLoading(false);
    setFile(null);
    
  }

  return (
    <>
    <div className='flex justify-center items-center font-bold'>
        <button className='bg-red-500 text-white py-2 px-4 rounded-md border-none w-max self-center mt-4'
        onClick={() => setOpen(true)}
        >Change Photo</button>
    </div>

    {open && <div className='w-screen h-screen absolute left-0 top-0 bg-black opacity-95 z-50 flex items-center justify-center'>
        <div className='bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]'>
            <div className='absolute top-4 right-4 cursor-pointer' onClick={() => setOpen(false)}>
                <X width={15} height={15} />
            </div>
            <form className='flex flex-col gap-8' onSubmit={handleSubmit}>
                <h1 className='text-xl font-bold text-left mb-4'>Upload Profile Image</h1>
                <div className='flex flex-col w-full gap-4'>
                
                <input type="file" accept='image/*' onChange={onFileChange} required/>
                
                </div>
                
                {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
                )}
                <button type='submit' disabled={loading} className='bg-red-500 text-white py-2 px-4 rounded-md border-none w-max self-left'>
            {loading ? 'Uploading...' : 'Upload Image'}
        </button>
            </form>
        </div>
        
        </div>}
    </>
  )
}

export default UploadImageModal