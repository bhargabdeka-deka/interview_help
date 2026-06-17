'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { TerminalSquare } from 'lucide-react'

export default function SignupPage() {
	const [email, setEmail] = useState('')
	const [name, setName] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()
	const { signup } = useAuthStore()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (password !== confirmPassword) {
			toast.error('Passwords do not match')
			return
		}

		setIsLoading(true)

		try {
			await signup(email, password, name)
			toast.success('Account created successfully')
			router.push('/dashboard')
		} catch (error: any) {
			toast.error(error.response?.data?.message || 'Signup failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-bg text-text-primary font-sans antialiased px-4 relative overflow-hidden py-12">
			<div className="w-full max-w-md bg-surface-2 border border-border relative z-10 p-1">
				{/* Top border accent line */}
				<div className="h-1 w-full bg-accent absolute top-0 left-0" />
				
				<div className="bg-surface p-8 sm:p-10 space-y-8">
					<div className="text-center space-y-3">
						<div className="flex items-center justify-center gap-2 mb-4">
							<TerminalSquare className="text-accent w-8 h-8" strokeWidth={2.5} />
							<h2 className="text-3xl font-logo font-black text-text-primary tracking-tight">InterviewOS</h2>
						</div>
						<p className="text-sm text-text-secondary">
							Register your organization workspace
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Full Name */}
						<div className="space-y-2">
							<label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
								Full Name
							</label>
							<Input
								type="text"
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 bg-code-bg border-border focus:border-accent text-base"
							/>
						</div>

						{/* Email Address */}
						<div className="space-y-2">
							<label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
								Email Address
							</label>
							<Input
								type="email"
								placeholder="recruiter@company.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 bg-code-bg border-border focus:border-accent text-base"
							/>
						</div>

						{/* Password */}
						<div className="space-y-2">
							<label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
								Password
							</label>
							<Input
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 bg-code-bg border-border focus:border-accent text-base"
							/>
						</div>

						{/* Confirm Password */}
						<div className="space-y-2">
							<label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
								Confirm Password
							</label>
							<Input
								type="password"
								placeholder="••••••••"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading}
								className="h-12 bg-code-bg border-border focus:border-accent text-base"
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full font-bold h-12 text-sm mt-8 bg-accent text-bg hover:bg-[#0d9b6c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? 'Creating workspace...' : 'Create Workspace'}
						</button>
					</form>

					<div className="text-center text-sm text-text-secondary pt-6 border-t border-border">
						Already have an account?{' '}
						<Link href="/login" className="text-text-primary font-bold hover:text-accent transition-colors border-b border-transparent hover:border-accent">
							Sign In
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
