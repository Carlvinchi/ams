/* role: api/auth/[...nextauth]/route.js 
Handles authentication using NextAuth.js with credentials provider.
Communicates with FastAPI backend for login, token refresh, and user profile retrieval.
Manages JWT tokens and session callbacks.
*/

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Call your FastAPI login endpoint
          const response = await fetch('http://localhost:8000/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials?.email ?? '',
              password: credentials?.password ?? '',
            }),
          })

          if (response.ok) {
            const data = await response.json();
            
            // Get user profile with the access token
            const userResponse = await fetch('http://localhost:8000/users/me', {
              headers: {
                'Authorization': `Bearer ${data.access_token}`,
              },
            })

            if (userResponse.ok) {
              const user = await userResponse.json();
              
              return {
                id: user.id.toString(),
                email: user.email,
                role: user.roles[0]["role_name"],
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
              }
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error);
          return null
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 60 * 60 * 1000, // 60 minutes
          role: user.role,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.accessToken = token.accessToken
        session.error = token.error
        session.user.role = token.role
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
})

async function refreshAccessToken(token) {
  try {
    const response = await fetch('http://localhost:8000/users/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hrs
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

export { handler as GET, handler as POST }