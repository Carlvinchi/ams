/* Session provider for NextAuth.js
    Wraps the application to provide session context to all components.
 */

"use client"

import React from 'react'
import { SessionProvider } from 'next-auth/react';


const Providers = ({ children, session }) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

export default Providers