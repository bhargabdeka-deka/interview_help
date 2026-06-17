'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/api'
import { Interview } from '@/lib/types'
import { Plus, Key, ChevronRight, LogOut, ShieldAlert, TerminalSquare } from 'lucide-react'
import toast from 'react-hot-toast'

// Helper to generate a consistent avatar style based on string
const getAvatarStyle = (str: string) => {
	const styles = [
		'bg-code-bg border border-border text-accent',
		'bg-surface border border-border text-text-primary',
		'bg-bg border border-border text-text-secondary'
	]
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

export default function DashboardPage() {
	const router = useRouter()
	const { user, logout } = useAuthStore()
	const [interviews, setInterviews] = useState<Interview[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [joinRoomId, setJoinRoomId] = useState('')
	const [isJoining, setIsJoining] = useState(false)

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

	const handleLogout = async () => {
		try {
			await logout()
			toast.success('Logged out successfully')
			router.push('/')
		} catch (error) {
			toast.error('Logout failed')
		}
	}

	const handleJoinRoomDirect = (e: React.FormEvent) => {
		e.preventDefault()
		if (!joinRoomId.trim()) return
		setIsJoining(true)
		router.push(`/interview/${joinRoomId.trim()}`)
		setTimeout(() => setIsJoining(false), 1000)
	}

	// Filter based on search query
	const filteredInterviews = interviews.filter((i) => {
		const query = searchQuery.toLowerCase()
		return (
			i.title.toLowerCase().includes(query) ||
			i.candidateId.toLowerCase().includes(query) ||
			(i.description && i.description.toLowerCase().includes(query))
		)
	})

	// Get unique candidates for the bubble view
	const candidatesMap = new Map<string, Interview>()
	interviews.forEach((i) => {
		if (!candidatesMap.has(i.candidateId)) {
			candidatesMap.set(i.candidateId, i)
		}
	})
	const uniqueCandidates = Array.from(candidatesMap.values())

	return (
		<div className="min-h-screen bg-bg text-text-primary font-sans antialiased">
			{/* Header */}
			<header className="bg-surface border-b border-border sticky top-0 z-50">
				<div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<TerminalSquare className="text-accent w-7 h-7" strokeWidth={2.5} />
						<span className="font-logo font-black text-text-primary text-xl tracking-tight">
							InterviewOS
						</span>
					</div>

					{/* Center Search Bar */}
					<div className="flex-1 max-w-sm relative">
						<input
							type="text"
							placeholder="Search candidates or sessions..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-3 pr-4 py-2 bg-code-bg border border-border focus:border-accent rounded-none text-sm font-medium text-text-primary transition-all focus:outline-none placeholder:text-text-secondary"
						/>
					</div>

					{/* Sign Out Action Button */}
					<button
						onClick={handleLogout}
						className="h-8 w-8 rounded-none border border-border bg-code-bg hover:bg-surface hover:text-accent hover:border-accent flex items-center justify-center text-text-primary transition-all duration-200"
						title="Sign Out"
					>
						<LogOut size={16} />
					</button>
				</div>
			</header>

			{/* Main Feed Container */}
			<main className="max-w-2xl mx-auto px-4 py-8 space-y-7">
				
				{/* Welcome header */}
				<div className="text-center space-y-1">
					<h2 className="text-2xl font-bold text-text-primary">
						Welcome, {user?.name || 'Recruiter'}
					</h2>
					<p className="text-sm text-text-secondary">
						Dashboard
					</p>
				</div>

				{/* Primary Quick Actions Grid */}
				<div className="grid grid-cols-2 gap-4">
					{/* Action: Schedule Round */}
					<Link href="/dashboard/interviews/new" className="block group">
						<Card className="bg-surface border border-border hover:border-accent transition-all duration-300 h-full rounded-none">
							<CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
								<div className="h-10 w-10 rounded-none bg-accent text-bg flex items-center justify-center group-hover:scale-105 transition-transform">
									<Plus size={18} />
								</div>
								<div>
									<h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Schedule Interview</h3>
									<p className="text-xs text-text-secondary font-medium mt-0.5">Create new session</p>
								</div>
							</CardContent>
						</Card>
					</Link>

					{/* Action: Direct Join */}
					<Card className="bg-surface border border-border transition-all duration-300 h-full rounded-none">
						<CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
							<div className="h-10 w-10 rounded-none bg-accent text-bg flex items-center justify-center">
								<Key size={18} />
							</div>
							<form onSubmit={handleJoinRoomDirect} className="w-full flex flex-col items-center gap-2">
								<h3 className="text-sm font-bold text-text-primary">Join Session</h3>
								<div className="flex w-full gap-2 mt-0.5">
									<input
										type="text"
										placeholder="Enter ID"
										value={joinRoomId}
										onChange={(e) => setJoinRoomId(e.target.value)}
										disabled={isJoining}
										className="flex-1 px-3 py-1 bg-code-bg border border-border rounded-none text-xs focus:outline-none focus:border-accent text-text-primary font-bold placeholder:text-text-secondary"
									/>
									<Button 
										type="submit" 
										disabled={isJoining || !joinRoomId}
										size="sm" 
										className="h-7 text-xs px-3 rounded-none transition-colors"
									>
										Join
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				{/* Candidates Bubbles Row */}
				<div className="space-y-3">
					<h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary px-1">
						Active Candidates
					</h3>
					<div className="flex items-center gap-4 overflow-x-auto py-2.5 px-1">
						{isLoading ? (
							<div className="flex gap-4">
								{[1, 2, 3].map((n) => (
									<div key={n} className="flex flex-col items-center gap-1.5 animate-pulse">
										<div className="h-12 w-12 rounded-none bg-surface border border-border"></div>
										<div className="h-2 w-10 bg-surface rounded-none"></div>
									</div>
								))}
							</div>
						) : uniqueCandidates.length === 0 ? (
							<div className="text-text-secondary text-xs font-semibold italic py-2 px-1 flex items-center gap-1.5">
								<ShieldAlert size={12} className="text-accent" /> No candidate profiles yet.
							</div>
						) : (
							uniqueCandidates.map((c) => {
								const initial = c.candidateId.charAt(0).toUpperCase()
								const name = getDisplayName(c.candidateId)
								const avatarStyle = getAvatarStyle(c.candidateId)
								return (
									<Link 
										key={c.id} 
										href={`/interview/${c.roomId}`} 
										className="flex flex-col items-center text-center gap-2 group shrink-0"
									>
										<div className={`h-12 w-12 rounded-none flex items-center justify-center font-bold text-sm transition-all duration-300 group-hover:scale-105 ${avatarStyle}`}>
											{initial}
										</div>
										<span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors max-w-[65px] truncate">
											{name}
										</span>
									</Link>
								)
							})
						)}
					</div>
				</div>

				{/* Recent Activity List */}
				<div className="space-y-3">
					<h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary px-1">
						Session Activity
					</h3>
					<Card className="bg-surface border border-border rounded-none overflow-hidden">
						<CardContent className="p-0 divide-y divide-border">
							{isLoading ? (
								<div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface">
									<div className="animate-spin rounded-none h-7 w-7 border-t-2 border-b-2 border-accent"></div>
									<span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Loading...</span>
								</div>
							) : filteredInterviews.length === 0 ? (
								<div className="text-center py-16 text-text-secondary text-xs italic bg-surface">
									{searchQuery ? 'No interviews match your search' : 'No interview sessions recorded'}
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
											className="flex items-center justify-between p-4 hover:bg-code-bg transition-all duration-200 group"
										>
											<div className="flex items-center gap-3">
												<div className={`h-9 w-9 rounded-none flex items-center justify-center font-bold text-xs shrink-0 ${avatarStyle}`}>
													{initial}
												</div>
												<div>
													<h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
														{interview.title}
													</h4>
													<p className="text-xs text-text-secondary mt-0.5">
														{name}
													</p>
												</div>
											</div>

											<div className="flex items-center gap-3 text-right">
												<div>
													<span className="text-xs font-bold text-text-primary block">
														{new Date(interview.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
													</span>
													<span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none mt-1 inline-block border ${
														interview.status === 'scheduled'
															? 'bg-code-bg text-text-primary border-border'
															: interview.status === 'in-progress'
															? 'bg-accent/10 text-accent border-accent/30 animate-pulse'
															: 'bg-green-950/20 text-success border-success/30'
													}`}>
														{interview.status}
													</span>
												</div>
												<ChevronRight size={16} className="text-text-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
											</div>
										</Link>
									)
								})
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	)
}
