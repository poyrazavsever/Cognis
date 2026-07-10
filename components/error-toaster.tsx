'use client'

import { useEffect } from 'react'
import { showToast } from '@/components/ui/toast'

export function ErrorToaster({ message }: { message: string }) {
  useEffect(() => {
    if (message) {
      showToast({ message, tone: 'error' })
    }
  }, [message])

  return null
}
