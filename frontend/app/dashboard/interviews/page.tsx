'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { Interview } from '@/lib/types'
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

// Helper to generate a consistent avatar style based on string
const getAvatarStyle = (str: string) => {
	const styles = ['bg-black text-white', 'bg-gray-800 text-white', 'bg-gray-700 text-white']
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash)
	}
	return styles[Math.abs(hash) % styles.length]
}

// Get candidate display name
const getDisplayName = (email: string) => {
	const parts = email.split('@')[0]
	return parts.charAt(0).toUpperCase() + parts.slice(1)
}

export default function InterviewsListPage() {
	const [interviews, setInterviews] = useState<Interview[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

	useEffect(() => {
		const fetchInterviews = async () => {
			try {
				const data = await apiClient.getInterviews()
				setInterviews(data || [])
			} catch (err) {
				console.error('Failed to fetch interviews:', err)
				toast.error('Failed to load interviews')
			} finally {
				setIsLoading(false)
			}
		}
		fetchInterviews()
	}, [])

	const filteredInterviews = interviews.filter((i) => {
		if (filter === 'upcoming') return i.status === 'scheduled' || i.status === 'in-progress'
		if (filter === 'completed') return i.status === 'completed'
		return true
	})

	return (
		<div className="min-h-screen bg-white text-black font-sans antialiased">
			{/* Top Glass Header */}
			<header className="bg-white border-b border-black sticky top-0 z-50">
				<div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-black hover:text-gray-700 font-bold flex items-center gap-1.5 transition-colors"
					>
						<ArrowLeft size={16} /> Back
					</Link>
					<span className="font-semibold text-black text-sm">
						Session Logs
					</span>
					<Link href="/dashboard/interviews/new">
						<Button className="bg-black hover:bg-gray-900 text-white text-sm font-bold h-8 px-4 rounded-none flex items-center gap-1 transition-colors">
							<Plus size={16} /> Schedule
						</Button>
					</Link>
				</div>
			</header>

			{/* Main Feed Container */}
			<main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
				{/* Tab Filters */}
				<div className="flex bg-white border border-black p-1 rounded-none w-fit gap-1">
					{(['all', 'upcoming', 'completed'] as const).map((tab) => (
						<button
							key={tab}
							onClick={() => setFilter(tab)}
							className={`py-1 px-4 rounded-none text-sm font-bold uppercase transition-all duration-250 ${
								filter === tab
									? 'bg-black text-white border border-black'
									: 'text-gray-600 hover:text-black border border-transparent'
							}`}
						>
							{tab}
						</button>
					))}
				</div>

				{/* History Feed List */}
				<Card className="bg-white border border-black rounded-none overflow-hidden">
					<CardContent className="p-0 divide-y divide-black">
						{isLoading ? (
							<div className="flex flex-col items-center justify-center py-16 gap-3 bg-gray-50">
								<div className="animate-spin rounded-none h-6 w-6 border-t-2 border-b-2 border-black"></div>
								<span className="text-sm text-gray-600 font-bold uppercase">Loading...</span>
							</div>
						) : filteredInterviews.length === 0 ? (
							<div className="text-center py-16 text-gray-600 text-sm italic bg-gray-50">
								No sessions match this filter.
							</div>
						) : (
							filteredInterviews.map((interview) => {
								const name = getDisplayName(interview.candidateId)
								const initial = interview.candidateId.charAt(0).toUpperCase()
								const avatarStyle = getAvatarStyle(interview.candidateId)

								return (
									<Link
										key={interview.id}
										href={`/interview/${interview.roomId}`}
										className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-200 group"
									>
										<div className="flex items-center gap-3">
											<div className={`h-9 w-9 rounded-none flex items-center justify-center font-bold text-sm border border-black shrink-0 ${avatarStyle}`}>
												{initial}
											</div>
											<div>
												<h4 className="text-sm font-bold text-black group-hover:text-gray-700 transition-colors">
													{interview.title}
												</h4>
												<p className="text-xs text-gray-600 font-medium mt-0.5">
													{name}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-3 text-right">
											<div>
												<span className="text-xs font-bold text-black block">
													{new Date(interview.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
												</span>
												<span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-none mt-0.5 inline-block border ${
													interview.status === 'scheduled'
														? 'bg-white text-black border-black'
														: interview.status === 'in-progress'
														? 'bg-gray-800 text-white border-black animate-pulse'
														: 'bg-gray-100 text-gray-700 border-black'
												}`}>
													{interview.status}
												</span>
											</div>
											<ChevronRight size={16} className="text-gray-600 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
										</div>
									</Link>
								)
							})
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
