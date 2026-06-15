'use client'

import { InterviewRoom } from '@/components/InterviewRoom'

export function InterviewPageClient({ roomId }: { roomId: string }) {
  return <InterviewRoom roomId={roomId} />
}
