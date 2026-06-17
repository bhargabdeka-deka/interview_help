'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewInterviewPage() {
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		candidateId: '',
		scheduledAt: '',
		duration: 60,
	})
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({
			...prev,
			[name]: name === 'duration' ? parseInt(value) : value,
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({
					...formData,
					scheduledAt: new Date(formData.scheduledAt).toISOString(),
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to create interview')
			}

			await response.json()
			toast.success('Interview scheduled successfully')
			router.push(`/dashboard`)
		} catch (error) {
			console.error('Error:', error)
			toast.error('Failed to schedule interview')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-bg text-text-primary font-sans antialiased">
			{/* Top Header */}
			<header className="bg-surface border-b border-border sticky top-0 z-50">
				<div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
					<Link
						href="/dashboard"
						className="text-sm text-text-primary hover:text-accent font-bold flex items-center gap-1.5 transition-colors"
					>
						<ArrowLeft size={16} /> Back
					</Link>
					<span className="font-extrabold text-accent text-sm tracking-wide">
						Schedule Interview
					</span>
					<div className="w-10"></div> {/* spacer */}
				</div>
			</header>

			{/* Main Centered Container */}
			<main className="max-w-xl mx-auto px-4 py-10">
				<Card className="bg-surface border border-border rounded-none overflow-hidden shadow-2xl">
					<CardContent className="p-6 space-y-6">
						<div className="text-center space-y-1">
							<h2 className="text-xl font-bold text-text-primary">
								Schedule New Interview
							</h2>
							<p className="text-sm text-text-secondary">
								Set up a new interview session
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							{/* Interview Title */}
							<div className="space-y-2">
								<label className="text-sm font-semibold text-text-primary">
									Interview Title *
								</label>
								<Input
									type="text"
									name="title"
									placeholder="e.g., Senior Engineer Round 1"
									value={formData.title}
									onChange={handleChange}
									required
									disabled={isLoading}
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<label className="text-sm font-semibold text-text-primary">
									Assessment Description / Topics
								</label>
								<textarea
									name="description"
									placeholder="e.g., Algorithms focus, system design..."
									value={formData.description}
									onChange={handleChange}
									disabled={isLoading}
									rows={3}
									className="w-full text-sm bg-code-bg border border-border rounded-none p-3 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-20 focus:border-accent text-text-primary placeholder:text-text-secondary leading-relaxed"
								/>
							</div>

							{/* Candidate Email */}
							<div className="space-y-2">
								<label className="text-sm font-semibold text-text-primary">
									Candidate Email *
								</label>
								<Input
									type="email"
									name="candidateId"
									placeholder="candidate@company.com"
									value={formData.candidateId}
									onChange={handleChange}
									required
									disabled={isLoading}
								/>
							</div>

							{/* Date & Time / Duration Grid */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-semibold text-text-primary">
										Date & Time *
									</label>
									<Input
										type="datetime-local"
										name="scheduledAt"
										value={formData.scheduledAt}
										onChange={handleChange}
										required
										disabled={isLoading}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-semibold text-text-primary">
										Duration (minutes)
									</label>
									<Input
										type="number"
										name="duration"
										value={formData.duration}
										onChange={handleChange}
										min="15"
										max="480"
										disabled={isLoading}
									/>
								</div>
							</div>

							{/* Buttons Grid */}
							<div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
								<Link href="/dashboard" className="w-1/2 sm:w-auto">
									<Button
										type="button"
										variant="outline"
										className="w-full rounded-none font-bold h-9 text-sm transition-colors"
									>
										Cancel
									</Button>
								</Link>
								<Button
									type="submit"
									disabled={isLoading}
									className="w-1/2 sm:w-auto font-bold rounded-none h-9 text-sm transition-colors"
								>
									{isLoading ? 'Creating...' : 'Schedule'}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
