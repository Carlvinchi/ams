"use client"

import { Home, LogOut, Settings, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {getDashboardForRole} from '@/lib/roleRedirect';

const Menu = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  

  // Determine dashboard path based on user role
  const dashboardPath = getDashboardForRole(session?.user?.role);

  const menuItems = [
    {
      title: "MENU",
      items: [
        {
          icon: <Home />,
          label: "Dashboard",
          href: dashboardPath
        },
        {
          icon: <User />,
          label: "Profile",
          href: "/"
        },
        
        {
          icon: <Settings />,
          label: "Settings",
          href: "/"
        },
        {
          icon: <LogOut />,
          label: "Logout",
          href: "/"
        }
      ]
    }
  ]


  return (
    <>

    <Link href={dashboardPath} className="flex items-center justify-center lg:justify-start gap-2">
        <Image src="/mfc_logo.png" alt="logo" width={32} height={32}/>
        <span className="hidden lg:block">AMS</span>
    </Link>
    <nav className='mt-4 text-sm'>
      {menuItems.map(i =>(
        <div className='flex flex-col gap-2' key={i.title}>
          <span className='hidden lg:block text-gray-400 font-light my-4'>{i.title}</span>
          {i.items.map(item =>(
            <Link href={item.href} key={item.label} 
            className={`flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 ${pathname === item.href ? "bg-gray-200 rounded-lg font-medium text-gray-700" : "hover:bg-gray-100 rounded-lg"}`}
            > 
            {item.icon}
            <span className='hidden lg:block'>{item.label}</span>
            </Link>
          ) )}

        </div>
      ) )}

      <div className='flex flex-col gap-2'>
          <span className='hidden lg:block text-gray-400 font-light my-4'>Others</span>
          <div className='flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 cursor-pointer'
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
             
            <LogOut />
            <span className='hidden lg:block'>Sign Out</span>
          </div>

        </div>
      
    </nav>
    </>
  ) 
}

export default Menu