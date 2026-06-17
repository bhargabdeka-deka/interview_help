'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getCurrentUser, token } = useAuthStore()

  useEffect(() => {
    // If there's a token in localStorage, try to get the current user
    if (token) {
      getCurrentUser()
    }
  }, [token, getCurrentUser])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeRoomId = localStorage.getItem('active_interview_room_id')
      const currentPath = window.location.pathname
      if (activeRoomId && currentPath !== `/interview/${activeRoomId}`) {
        window.location.href = `/interview/${activeRoomId}`
      }
    }
  }, [])

  return <>{children}</>
}
