'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { CodeEditor } from '@/components/CodeEditor'
import { SystemDesignBoard } from '@/components/SystemDesignBoard'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
	PhoneOff, 
	Plus, 
	MessageSquare, 
	Send, 
	Info, 
	Trash2, 
	Users, 
	Mic, 
	MicOff, 
	Video as VideoIcon, 
	VideoOff, 
	X,
	Edit3,
	Monitor
} from 'lucide-react'
import toast from 'react-hot-toast'
import Rating from '@mui/material/Rating'

interface Message {
	senderId: string
	senderName: string
	text: string
	time: string
}

interface PeerConnectionData {
	connection: RTCPeerConnection
	stream?: MediaStream
	name: string
}

const getDisplayName = (email: string) => {
	const parts = email.split('@')[0]
	return parts.charAt(0).toUpperCase() + parts.slice(1)
}

export function InterviewRoom({ roomId }: { roomId: string }) {
	const { user } = useAuthStore()
	const router = useRouter()

	// Guest Login Forms
	const [guestName, setGuestName] = useState('')
	const [isGuestSubmitting, setIsGuestSubmitting] = useState(false)

	// Lobby Admission States
	const [lobbyStatus, setLobbyStatus] = useState<'none' | 'awaiting' | 'approved' | 'rejected'>('none')
	const [pendingRequests, setPendingRequests] = useState<{ id: string; name: string }[]>([])

	// Media streams and connection states
	const [localStream, setLocalStream] = useState<MediaStream | null>(null)
	const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; name: string }>>(new Map())
	const [, setIsConnected] = useState(false)

	// Workspace Tab and System Design board shapes
	const [activeTab, setActiveTab] = useState<'editor' | 'whiteboard'>('editor')
	const [wbShapes, setWbShapes] = useState<any[]>([])
	const [wbNotes, setWbNotes] = useState<string>('')

	// Editor, language & runner states
	const [code, setCode] = useState('// Type your solution here\n')
	const [language, setLanguage] = useState('javascript')
	const [isExecuting, setIsExecuting] = useState(false)
	const [executionResult, setExecutionResult] = useState<any>(null)
	const [fontSize, setFontSize] = useState<number>(14)
	const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')

	// Interview metadata
	const [interviewType, setInterviewType] = useState<string>('coding')
	const [interviewId, setInterviewId] = useState<string | null>(null)
	const [isInterviewLoading, setIsInterviewLoading] = useState(true)

	// Chat and UI Control states
	const [messages, setMessages] = useState<Message[]>([])
	const [chatInput, setChatInput] = useState('')
	const [showChatDrawer, setShowChatDrawer] = useState(false)
	const [showEvaluationModal, setShowEvaluationModal] = useState(false)

	// Evaluator rating notes states
	const [rating, setRating] = useState(0)
	const [notes, setNotes] = useState('')
	const [isSavingNotes, setIsSavingNotes] = useState(false)
	const [isInterviewer, setIsInterviewer] = useState(false)

	// Media controls states
	const [isAudioEnabled, setIsAudioEnabled] = useState(true)
	const [isVideoEnabled, setIsVideoEnabled] = useState(true)

	// WebRTC References
	const socketRef = useRef<WebSocket | null>(null)
	const localVideoRef = useRef<HTMLVideoElement | null>(null)
	const peerConnectionsRef = useRef<Map<string, PeerConnectionData>>(new Map())
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Check if current user is an interviewer/host
	useEffect(() => {
		if (user) {
			const host = user.role === 'interviewer' || user.role === 'recruiter' || user.role === 'admin'
			setIsInterviewer(host)
			if (host) {
				setLobbyStatus('approved')
			}
		}
	}, [user])

	// Scroll chat to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// Initialize WebRTC and Signaling
	useEffect(() => {
		if (!user) return

		// Fetch interview details (type)
		const fetchInterview = async () => {
			try {
				const token = localStorage.getItem('token')
				
				// First fetch the room to get the interview ID
				const roomRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: token ? `Bearer ${token}` : '',
					},
				})
				
				if (!roomRes.ok) {
					console.warn('Failed to fetch room details', roomRes.status)
					localStorage.removeItem('active_interview_room_id') // Prevent redirect loop
					setIsInterviewLoading(false)
					router.push('/dashboard')
					return
				}
				
				const roomData = await roomRes.json()
				const fetchedInterviewId = roomData.interviewId || roomData.interview_id
				
				if (!fetchedInterviewId) {
					console.warn('No interview ID found in room data')
					setIsInterviewLoading(false)
					return
				}
				
				// Store the interview ID
				setInterviewId(fetchedInterviewId)
				// Save active room in local storage
				localStorage.setItem('active_interview_room_id', roomId)
				
				const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${fetchedInterviewId}`, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: token ? `Bearer ${token}` : '',
					},
				})
				if (res.ok) {
					const data = await res.json()
					const type = data.type || 'coding'
					setInterviewType(type)
					setActiveTab(type === 'system-design' ? 'whiteboard' : 'editor')

					// Dynamic Host Verification
					const isActualHost = data.hostId === user.id || data.host_id === user.id || data.HostID === user.id
					if (isActualHost) {
						setIsInterviewer(true)
						setLobbyStatus('approved')
					}
				} else {
					console.warn('Failed to fetch interview details', res.status)
				}
			} catch (err) {
				console.error('Error fetching interview:', err)
			} finally {
				setIsInterviewLoading(false)
			}
		}

		fetchInterview()

		let streamAllocated: MediaStream | null = null
		let socketConnection: WebSocket | null = null

		const initSignaling = async () => {
			try {
				// 1. Connect signaling WebSocket
				const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
				const wsHost = process.env.NEXT_PUBLIC_WS_URL 
					? process.env.NEXT_PUBLIC_WS_URL.replace(/^http(s)?/, 'ws')
					: `${wsProtocol}//localhost:8080`
			
				// Include JWT token for server-side WebSocket authentication
				const token = localStorage.getItem('token') || ''
				const wsUrl = `${wsHost}/ws/${roomId}?token=${encodeURIComponent(token)}&userId=${user.id}&name=${encodeURIComponent(user.name)}`
				console.log('WS: Connecting to', wsUrl)
				
				const ws = new WebSocket(wsUrl)
				socketRef.current = ws
				socketConnection = ws

				ws.onopen = () => {
					console.log('WS: Connected to signaling')
					setIsConnected(true)
					// Broadcast join room
					ws.send(JSON.stringify({ type: 'join', roomId, userId: user.id, name: user.name }))
				}

				ws.onmessage = async (event) => {
					const data = JSON.parse(event.data)
					switch (data.type) {
						case 'awaiting-approval':
							setLobbyStatus('awaiting')
							break

						case 'join-approved':
							setLobbyStatus('approved')
							localStorage.setItem('active_interview_room_id', roomId)
							toast.success('Admitted into the session!')
							// Initialize media stream for candidate after approval
							await initMediaStream()
							break

						case 'join-rejected':
							setLobbyStatus('rejected')
							localStorage.removeItem('active_interview_room_id')
							break

						case 'join-request':
							// Interviewer gets notification
							setPendingRequests((prev) => {
								if (prev.some((r) => r.id === data.userId)) return prev
								return [...prev, { id: data.userId, name: data.name }]
							})
							break

						case 'room-users':
							// Initiate calls with existing peers
							const users = data.users || []
							users.forEach((otherUser: { id: string; name: string }) => {
								if (otherUser.id !== user.id && !peerConnectionsRef.current.has(otherUser.id)) {
									// Make sure we have local stream allocated
									const currentStream = streamAllocated || localStream
									if (currentStream) {
										createPeerConnection(otherUser.id, otherUser.name, currentStream)
									}
								}
							})
							break

						case 'webrtc-offer':
							const currentStream = streamAllocated || localStream
							if (currentStream) {
								await handleReceiveOffer(data.senderId, data.senderName, data.offer, currentStream)
							}
							break

						case 'webrtc-answer':
							await handleReceiveAnswer(data.senderId, data.answer)
							break

						case 'webrtc-ice':
							await handleReceiveIce(data.senderId, data.candidate)
							break

						case 'code-sync':
							if (data.code !== undefined) setCode(data.code)
							if (data.language !== undefined) setLanguage(data.language)
							break

						case 'whiteboard-sync':
							if (data.data) {
								try {
									const parsed = JSON.parse(data.data)
									if (parsed.shapes) setWbShapes(parsed.shapes)
									if (parsed.notes !== undefined) setWbNotes(parsed.notes)
								} catch (e) {
									console.error('Failed to parse whiteboard sync', e)
								}
							}
							break

						case 'chat-sync':
							setMessages((prev) => [
								...prev,
								{
									senderId: data.senderId,
									senderName: data.senderName,
									text: data.text,
									time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
								},
							])
							break

						case 'peer-disconnected':
							console.log('WS: Peer disconnected:', data.userId)
							closePeerConnection(data.userId)
							break
					}
				}

				ws.onclose = () => {
					console.log('WS: Disconnected from signaling')
					setIsConnected(false)
				}
			} catch (err) {
				console.error('Failed to connect signaling socket:', err)
			}
		}

		const initMediaStream = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { width: 480, height: 360 },
					audio: true,
				})
				setLocalStream(stream)
				streamAllocated = stream
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream
				}
				return stream
			} catch (err) {
				console.error('Failed WebRTC Media setup:', err)
				toast.error('Could not access microphone/camera. Proceeding in write-only mode.')
				return null
			}
		}

		// Setup connections depending on role approval status
		const start = async () => {
			await initSignaling()
			const host = user.role === 'interviewer' || user.role === 'recruiter' || user.role === 'admin'
			if (host) {
				await initMediaStream()
			}
		}

		start()

		return () => {
			if (socketConnection) socketConnection.close()
			if (streamAllocated) {
				streamAllocated.getTracks().forEach((track) => track.stop())
			}
			peerConnectionsRef.current.forEach((peer) => {
				peer.connection.close()
			})
		}
	}, [roomId, user])

	// WebRTC Signaling Logic Helpers
	const createPeerConnection = async (peerId: string, peerName: string, stream: MediaStream) => {
		console.log('WebRTC: Initiating connection to peer:', peerName)
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		})

		peerConnectionsRef.current.set(peerId, { connection: pc, name: peerName })

		// Add tracks
		stream.getTracks().forEach((track) => {
			pc.addTrack(track, stream)
		})

		// Track remote streams
		pc.ontrack = (event) => {
			console.log('WebRTC: Received track from peer:', peerName)
			const remoteStream = event.streams[0]
			setRemoteStreams((prev) => {
				const next = new Map(prev)
				next.set(peerId, { stream: remoteStream, name: peerName })
				return next
			})
		}

		pc.onicecandidate = (event) => {
			if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
				socketRef.current.send(JSON.stringify({
					type: 'webrtc-ice',
					roomId,
					targetId: peerId,
					candidate: event.candidate,
				}))
			}
		}

		// Create Offer
		const offer = await pc.createOffer()
		await pc.setLocalDescription(offer)

		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'webrtc-offer',
				roomId,
				targetId: peerId,
				offer,
			}))
		}
	}

	const handleReceiveOffer = async (senderId: string, senderName: string, offer: RTCSessionDescriptionInit, stream: MediaStream) => {
		console.log('WebRTC: Received offer from peer:', senderName)
		let pcData = peerConnectionsRef.current.get(senderId)
		let pc: RTCPeerConnection

		if (!pcData) {
			pc = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
			})
			peerConnectionsRef.current.set(senderId, { connection: pc, name: senderName })

			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream)
			})

			pc.ontrack = (event) => {
				console.log('WebRTC: Received track from peer:', senderName)
				const remoteStream = event.streams[0]
				setRemoteStreams((prev) => {
					const next = new Map(prev)
					next.set(senderId, { stream: remoteStream, name: senderName })
					return next
				})
			}

			pc.onicecandidate = (event) => {
				if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
					socketRef.current.send(JSON.stringify({
						type: 'webrtc-ice',
						roomId,
						targetId: senderId,
						candidate: event.candidate,
					}))
				}
			}
		} else {
			pc = pcData.connection
		}

		await pc.setRemoteDescription(new RTCSessionDescription(offer))
		const answer = await pc.createAnswer()
		await pc.setLocalDescription(answer)

		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'webrtc-answer',
				roomId,
				targetId: senderId,
				answer,
			}))
		}
	}

	const handleReceiveAnswer = async (senderId: string, answer: RTCSessionDescriptionInit) => {
		console.log('WebRTC: Received answer from peer:', senderId)
		const pcData = peerConnectionsRef.current.get(senderId)
		if (pcData) {
			await pcData.connection.setRemoteDescription(new RTCSessionDescription(answer))
		}
	}

	const handleReceiveIce = async (senderId: string, candidate: RTCIceCandidateInit) => {
		const pcData = peerConnectionsRef.current.get(senderId)
		if (pcData) {
			await pcData.connection.addIceCandidate(new RTCIceCandidate(candidate))
		}
	}

	const closePeerConnection = (peerId: string) => {
		const pcData = peerConnectionsRef.current.get(peerId)
		if (pcData) {
			pcData.connection.close()
			peerConnectionsRef.current.delete(peerId)
		}
		setRemoteStreams((prev) => {
			const next = new Map(prev)
			next.delete(peerId)
			return next
		})
	}

	// Code changes synchronization & execution proxy handlers
	const handleCodeChange = (newCode: string) => {
		setCode(newCode)
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'code-sync',
				roomId,
				code: newCode,
			}))
		}
	}

	const handleLanguageChange = (newLang: string) => {
		setLanguage(newLang)
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'code-sync',
				roomId,
				language: newLang,
			}))
		}
	}

	const handleWbSync = (newShapes: any[], newNotes: string) => {
		setWbShapes(newShapes)
		setWbNotes(newNotes)
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'whiteboard-sync',
				roomId,
				data: JSON.stringify({ shapes: newShapes, notes: newNotes }),
			}))
		}
	}

	const handleAdmissionResponse = (targetId: string, status: 'approved' | 'rejected') => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'join-response',
				roomId,
				targetId,
				text: status,
			}))
		}
		setPendingRequests((prev) => prev.filter((r) => r.id !== targetId))
	}

	const handleRunCode = async () => {
		setIsExecuting(true)
		setExecutionResult(null)


		const token = localStorage.getItem('token')
		if (!token) {
			setExecutionResult({ error: 'Missing auth token. Please login.' })
			setIsExecuting(false)
			return
		}

		if (!interviewId) {
			setExecutionResult({ error: 'Interview ID not loaded yet. Please wait.' })
			setIsExecuting(false)
			return
		}

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/run`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ code, language }),
			})

			if (!response.ok) {
				const text = await response.text()
				let parsed: any = null
				try {
					parsed = JSON.parse(text)
				} catch (e) {
					parsed = { message: text }
				}
				console.error('RunCode failed:', response.status, parsed)
				setExecutionResult({ error: parsed.message || parsed.error || 'Code execution failed' })
				return
			}

			const result = await response.json()
			setExecutionResult(result)
		} catch (error) {
			console.error('Error running code:', error)
			setExecutionResult({ error: 'Failed to run code execution container.' })
		} finally {
			setIsExecuting(false)
		}
	}

	const clearExecutionResult = () => {
		setExecutionResult(null)
	}

	// Live Chat logic
	const handleSendChat = (e: React.FormEvent) => {
		e.preventDefault()
		if (!chatInput.trim() || !user) return

		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({
				type: 'chat-sync',
				roomId,
				text: chatInput,
			}))
		}

		setMessages((prev) => [
			...prev,
			{
				senderId: user.id,
				senderName: user.name,
				text: chatInput,
				time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			},
		])
		setChatInput('')
	}

	// Evaluation scores submission
	const handleSubmitEvaluation = async () => {
		setIsSavingNotes(true)
		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/evaluation`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({ status: 'completed', rating, comment: notes }),
			})

			if (!response.ok) {
				throw new Error('Failed to save evaluation')
			}

			toast.success('Assessment evaluation logs saved successfully!')
			setShowEvaluationModal(false)
		} catch (error) {
			console.error(error)
			toast.error('Failed to submit evaluation notes')
		} finally {
			setIsSavingNotes(false)
		}
	}

	// Media toggling
	const handleToggleAudio = () => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0]
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled
				setIsAudioEnabled(audioTrack.enabled)
			}
		}
	}

	const handleToggleVideo = () => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0]
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled
				setIsVideoEnabled(videoTrack.enabled)
			}
		}
	}

	const handleLeaveRoom = async () => {
		try {
			localStorage.removeItem('active_interview_room_id')
			const token = localStorage.getItem('token')
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/leave`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token ? `Bearer ${token}` : '',
				},
			})
		} catch (err) {
			console.error(err)
		}
		router.push('/dashboard')
	}

	// 1. GUEST REGISTRATION CARD (If not authenticated)
	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-bg text-white p-4 font-sans select-none">
				<div className="w-full max-w-md bg-surface border border-border rounded-none shadow-2xl p-8 space-y-6">
					<div className="text-center space-y-2">
						<h2 className="text-2xl font-extrabold text-emerald-500 tracking-tight">InterviewOS Lobby</h2>
						<p className="text-xs text-slate-400">
							You have been invited to join an interview session.
						</p>
					</div>

					<form onSubmit={async (e) => {
						e.preventDefault()
						if (!guestName.trim()) return
						setIsGuestSubmitting(true)
						try {
							const res = await apiClient.guestRegister(guestName.trim())
							localStorage.setItem('token', res.token)
							await useAuthStore.getState().getCurrentUser()
							toast.success('Ready to request entry!')
						} catch (err) {
							console.error(err)
							toast.error('Failed to register guest session')
						} finally {
							setIsGuestSubmitting(false)
						}
					}} className="space-y-4">
						<div className="space-y-2">
							<label className="text-xs font-semibold text-slate-400 block">
								Enter Your Full Name
							</label>
							<input
								type="text"
								placeholder="e.g. Jane Candidate"
								value={guestName}
								onChange={(e) => setGuestName(e.target.value)}
								required
								disabled={isGuestSubmitting}
								className="w-full bg-code-bg border border-border rounded-none px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50"
							/>
						</div>

						<Button
							type="submit"
							disabled={isGuestSubmitting || !guestName.trim()}
							className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-sm transition-colors rounded-none"
						>
							{isGuestSubmitting ? 'Entering Lobby...' : 'Request to Join Interview'}
						</Button>
					</form>

					<div className="text-center text-xs text-slate-500 pt-4 border-t border-border flex justify-center gap-4">
						<button 
							onClick={() => router.push('/login')}
							className="text-emerald-400 hover:underline hover:text-emerald-300 font-semibold"
						>
							Sign In instead
						</button>
					</div>
				</div>
			</div>
		)
	}

	// 2. LOBBY WAITING SCREEN
	if (lobbyStatus === 'awaiting') {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-bg text-white p-4 font-sans select-none gap-6">
				<div className="animate-spin rounded-none h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
				<div className="w-full max-w-md bg-surface border border-border rounded-none shadow-2xl p-8 text-center space-y-4">
					<h2 className="text-xl font-bold text-slate-200">Waiting for Interviewer...</h2>
					<p className="text-xs text-slate-400 leading-relaxed">
						You are in the waiting lobby. The host of the interview has been notified and will admit you shortly.
					</p>
					<div className="pt-2">
						<span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase rounded-none">
							Lobby State: Pending Approval
						</span>
					</div>
				</div>
				<button 
					onClick={handleLeaveRoom}
					className="text-xs text-slate-500 hover:text-slate-350 hover:underline"
				>
					Cancel and Leave Room
				</button>
			</div>
		)
	}

	// 3. LOBBY ACCESS DENIED SCREEN
	if (lobbyStatus === 'rejected') {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-bg text-white p-4 font-sans select-none gap-6">
				<div className="w-full max-w-md bg-surface border border-border rounded-none shadow-2xl p-8 text-center space-y-4">
					<div className="mx-auto w-12 h-12 rounded-none bg-rose-950/30 border border-rose-500/20 flex items-center justify-center text-rose-500 text-xl font-bold">
						✕
					</div>
					<h2 className="text-xl font-bold text-rose-400">Access Declined</h2>
					<p className="text-xs text-slate-400 leading-relaxed">
						Your request to join this interview room was declined by the host. Please contact the coordinator if you believe this is an error.
					</p>
				</div>
				<button 
					onClick={handleLeaveRoom}
					className="px-4 py-2 bg-code-bg hover:bg-surface-3 border border-border text-xs font-bold text-slate-350 hover:text-slate-200 rounded-none transition-colors"
				>
					Return to Dashboard
				</button>
			</div>
		)
	}

	const candidateDisplayName = getDisplayName(roomId)

	return (
		<div className="min-h-screen bg-bg text-white flex flex-row overflow-hidden h-screen font-mono select-none relative">
			
			{/* Host Admission Requests Alert Banner */}
			{isInterviewer && pendingRequests.length > 0 && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm bg-surface border border-emerald-500/30 rounded-none shadow-2xl p-4 flex flex-col gap-3.5 animate-bounce-short">
					<div className="flex items-start gap-3">
						<div className="h-7 w-7 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
							<Users size={14} />
						</div>
						<div className="flex-1 space-y-1">
							<h4 className="text-xs font-bold text-slate-200 font-sans">Admission Request</h4>
							<p className="text-[10px] text-slate-400 font-medium font-sans">
								<span className="text-emerald-400 font-bold">{pendingRequests[0].name}</span> is requesting to join this interview.
							</p>
						</div>
					</div>
					<div className="flex items-center justify-end gap-2.5">
						<button
							onClick={() => handleAdmissionResponse(pendingRequests[0].id, 'rejected')}
							className="px-3.5 py-1.5 bg-code-bg hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-border rounded-none text-[10px] font-bold font-sans transition-all"
						>
							Decline
						</button>
						<button
							onClick={() => handleAdmissionResponse(pendingRequests[0].id, 'approved')}
							className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-none text-[10px] font-bold font-sans shadow transition-all"
						>
							Admit
						</button>
					</div>
				</div>
			)}

			{/* Left Column: Monaco Code Editor OR System Design Board */}
			<div className="w-[58%] h-full flex flex-col p-2 bg-bg gap-2">
				{/* Tab Selector bar */}
				<div className="flex items-center gap-1.5 px-2 bg-surface-2 border border-border h-10 rounded-none shrink-0 select-none">
					<button
						onClick={() => setActiveTab('editor')}
						className={`flex items-center gap-2 px-4 h-7 rounded-none text-[10px] font-bold uppercase transition-all font-sans ${activeTab === 'editor' ? 'bg-code-bg text-emerald-400 border border-border' : 'text-slate-400 hover:text-slate-200'}`}
					>
						<Edit3 size={11} />
						Coding Pad
					</button>
					<button
						onClick={() => setActiveTab('whiteboard')}
						className={`flex items-center gap-2 px-4 h-7 rounded-none text-[10px] font-bold uppercase transition-all font-sans ${activeTab === 'whiteboard' ? 'bg-code-bg text-emerald-400 border border-border' : 'text-slate-400 hover:text-slate-200'}`}
					>
						<Monitor size={11} />
						System Design Board
					</button>
				</div>

				<div className="flex-1 min-h-0 relative">
					{activeTab === 'editor' ? (
						<CodeEditor 
							code={code}
							language={language}
							fontSize={fontSize}
							wordWrap={wordWrap}
							onFontSizeChange={setFontSize}
							onWordWrapChange={setWordWrap}
							onChange={handleCodeChange}
							onLanguageChange={handleLanguageChange}
							onRunCode={handleRunCode}
							isExecuting={isExecuting}
							candidateName={candidateDisplayName}
							isInterviewer={isInterviewer}
							onOpenEvaluation={() => setShowEvaluationModal(true)}
						/>
					) : (
						<SystemDesignBoard
							shapes={wbShapes}
							notes={wbNotes}
							onSync={handleWbSync}
						/>
					)}
				</div>
			</div>

			{/* Right Column: Terminal Console + Video Feeds Stack */}
			<div className="w-[42%] h-full flex flex-col bg-surface-2 border-l border-border relative">
				
				{/* Right Panel Header Bar */}
				<div className="h-13 min-h-[48px] px-4 py-2 border-b border-border bg-surface-2 flex items-center justify-between z-10 shrink-0">
					{/* Red End Call Action */}
					<button 
						onClick={handleLeaveRoom}
						className="bg-[#d9534f] hover:bg-[#c9302c] text-white text-[10.5px] font-bold px-3.5 py-1.5 rounded-none flex items-center gap-1.5 transition-colors border-none"
					>
						<PhoneOff size={12} fill="currentColor" />
						End Call
					</button>

					{/* Participants Details & Invitation Action */}
					<div className="flex items-center gap-3.5 text-[10px] font-bold text-slate-350 select-none">
						{/* Interview type display & toggle */}
						<div className="flex items-center gap-2 mr-2 text-[10px]">
							<span className="text-slate-400 uppercase text-[9px]">Mode:</span>
							<span className="px-2 py-0.5 bg-[#222] rounded-none text-[9px]">{isInterviewLoading ? 'Loading' : interviewType}</span>
							{isInterviewer && !isInterviewLoading && (
								<button
									onClick={async () => {
										const newType = interviewType === 'coding' ? 'system-design' : 'coding'
										try {
											const token = localStorage.getItem('token')
											const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${roomId}`, {
												method: 'PUT',
												headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
												body: JSON.stringify({ type: newType }),
											})
											if (res.ok) {
												setInterviewType(newType)
												setActiveTab(newType === 'system-design' ? 'whiteboard' : 'editor')
												toast.success(`Interview set to ${newType}`)
											} else {
												const t = await res.text()
												console.warn('Failed toggling interview type', res.status, t)
												toast.error('Failed to change interview mode')
											}
										} catch (err) {
											console.error(err)
											toast.error('Unable to change interview mode')
										}
									}}
									className="ml-2 px-2 py-0.5 text-[9px] bg-[#2b2b2b] hover:bg-[#343434] rounded-none text-slate-200"
								>
									Toggle
								</button>
							)}
						</div>
						<button 
							onClick={() => setShowChatDrawer(true)}
							className="text-slate-400 hover:text-slate-200 mr-1.5 flex items-center gap-1 transition-colors"
						>
							<MessageSquare size={11} /> Chat
						</button>
						<button 
							onClick={() => {
								if (typeof window !== 'undefined') {
									navigator.clipboard.writeText(window.location.href)
									toast.success('Room URL copied to clipboard! Share it with the candidate.')
								}
							}}
							className="text-slate-400 hover:text-slate-200 mr-1.5 flex items-center gap-1 transition-colors"
						>
							<Plus size={11} /> Invite
						</button>
						<span className="flex items-center gap-1">
							<span className={`h-2 w-2 rounded-none bg-emerald-500`}></span> You
						</span>
						{Array.from(remoteStreams.values()).map((peer, idx) => (
							<span key={idx} className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-none bg-emerald-500 animate-pulse"></span> {peer.name}
							</span>
						))}
					</div>
				</div>

				{/* Right Panel Main Workspace Body */}
				<div className="flex-1 flex flex-row overflow-hidden">
					
					{/* Left: Bash Shell Terminal Console */}
					<div className="flex-1 h-full bg-[#151515] p-4 text-[11px] font-mono text-[#dcdcdc] overflow-y-auto relative selection:bg-slate-700/50 flex flex-col">
						<div className="space-y-1.5 flex-1 select-text scrollbar-thin">
							<div className="text-slate-500">This is a real bash shell.</div>
							<div className="text-slate-500">Everyone can modify this in real time.</div>
							<div className="text-slate-500">------------------------------------</div>
							<div className="text-emerald-500 flex items-center gap-1.5">
								<span className="h-2.5 w-2.5 rounded-none border-2 border-emerald-500 flex items-center justify-center text-[6px]">✔</span>
								Machine Ready
							</div>

							{isExecuting && (
								<div className="text-slate-400 italic pt-1 animate-pulse">
									⌛ Compiling started by {user.name}
								</div>
							)}

							{executionResult && (
								<div className="pt-2 space-y-2 select-text font-mono">
									{/* API Error Messages */}
									{executionResult.error && (
										<div className="text-rose-400">
											Error: {executionResult.error}
										</div>
									)}

									{/* Run outputs */}
									{executionResult.run && (
										<>
											{executionResult.run.stderr && (
												<div className="text-rose-400 whitespace-pre-wrap">
													{executionResult.run.stderr}
												</div>
											)}
											{executionResult.run.stdout && (
												<div className="text-[#e2e2e2] whitespace-pre-wrap">
													{executionResult.run.stdout}
												</div>
											)}
											{!executionResult.run.stdout && !executionResult.run.stderr && (
												<div className="text-slate-500 italic">
													Program completed with no outputs.
												</div>
											)}
											<div className="text-[10px] text-slate-500 pt-2 border-t border-slate-900 flex items-center justify-between">
												<span>Exit code: {executionResult.run.code ?? '0'}</span>
												<span>{executionResult.run.code === 0 ? '✓ SUCCESS' : '✗ FAILED'}</span>
											</div>
										</>
									)}
								</div>
							)}
						</div>

						{/* Tiny Terminal Clear Action */}
						{executionResult && (
							<button
								onClick={clearExecutionResult}
								className="absolute bottom-3 right-3 p-1.5 bg-code-bg hover:bg-[#323233] text-slate-400 hover:text-slate-200 border border-border rounded-none transition-colors flex items-center gap-1 text-[9px] font-bold"
								title="Clear Console Output"
							>
								<Trash2 size={10} /> Clear
							</button>
						)}
					</div>

					{/* Right: Vertically Stacked Video Streams Column */}
					<div className="w-[130px] border-l border-border bg-surface-2 py-3 px-2 flex flex-col gap-2.5 overflow-y-auto shrink-0 z-10">
						
						{/* Local Camera stream */}
						<div className="relative rounded-none bg-[#1f1f1f] border border-border shadow overflow-hidden aspect-[4/3] flex flex-col justify-end group">
							<video
								ref={localVideoRef}
								autoPlay
								muted
								playsInline
								className="w-full h-full object-cover bg-black absolute inset-0"
							/>
							
							{/* Hover controls for microphone/video */}
							<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
								<button
									onClick={handleToggleAudio}
									className={`p-1.5 rounded-none ${isAudioEnabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'}`}
									title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
								>
									{isAudioEnabled ? <Mic size={11} /> : <MicOff size={11} />}
								</button>
								<button
									onClick={handleToggleVideo}
									className={`p-1.5 rounded-none ${isVideoEnabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'}`}
									title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
								>
									{isVideoEnabled ? <VideoIcon size={11} /> : <VideoOff size={11} />}
								</button>
							</div>

							<div className="absolute bottom-1 right-1 z-15 bg-black/75 px-1.5 py-0.5 rounded-none text-[8px] font-bold text-slate-350 tracking-wider">
								You
							</div>
							{!isVideoEnabled && (
								<div className="absolute inset-0 bg-code-bg flex items-center justify-center text-[7.5px] text-slate-500 font-bold uppercase">
									Video Off
								</div>
							)}
						</div>

						{/* Remote Stream feeds */}
						{remoteStreams.size > 0 ? (
							Array.from(remoteStreams.entries()).map(([peerId, data]) => (
								<div key={peerId} className="relative rounded-none bg-[#1f1f1f] border border-border shadow overflow-hidden aspect-[4/3] flex flex-col justify-end">
									<video
										autoPlay
										playsInline
										ref={(el) => {
											if (el && data.stream) el.srcObject = data.stream
										}}
										className="w-full h-full object-cover bg-black absolute inset-0"
									/>
									<div className="absolute bottom-1 right-1 z-15 bg-black/75 px-1.5 py-0.5 rounded-none text-[8px] font-bold text-slate-350 tracking-wider">
										{data.name}
									</div>
								</div>
							))
						) : (
							<div className="rounded-none border border-dashed border-border flex flex-col items-center justify-center p-3 text-center aspect-[4/3] bg-slate-900/10">
								<Users size={13} className="text-slate-650 animate-pulse mb-1" />
								<span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-widest leading-none">Waiting Peer</span>
							</div>
						)}
					</div>

				</div>

				{/* Sliding Live Chat Drawer Overlay */}
				{showChatDrawer && (
					<div className="absolute inset-y-0 right-0 w-[320px] bg-[#161616] border-l border-border shadow-2xl z-30 flex flex-col transition-all duration-300">
						{/* Drawer Header */}
						<div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-2">
							<span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live Workspace Chat</span>
							<button 
								onClick={() => setShowChatDrawer(false)}
								className="text-slate-500 hover:text-slate-330 transition-colors"
							>
								<X size={14} />
							</button>
						</div>

						{/* Chat Logs */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3.5">
							{messages.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-center p-4">
									<MessageSquare size={16} className="text-slate-600 mb-1.5" />
									<span className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">No messages yet</span>
								</div>
							) : (
								messages.map((msg, index) => {
									const isMe = msg.senderId === user?.id
									return (
										<div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
											<span className="text-[7.5px] text-slate-550 mb-0.5 block px-0.5">
												{isMe ? 'You' : msg.senderName} • {msg.time}
											</span>
											<div className={`max-w-[85%] rounded-none px-3 py-1.5 text-[10.5px] font-sans leading-normal ${
												isMe ? 'bg-emerald-600 text-white' : 'bg-[#222] text-slate-200 border border-[#333]'
											}`}>
												{msg.text}
											</div>
										</div>
									)
								})
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Chat Input form */}
						<form onSubmit={handleSendChat} className="p-3 border-t border-border bg-surface-2 flex items-center gap-1.5">
							<input
								type="text"
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								placeholder="Send message..."
								className="flex-1 bg-code-bg border border-border rounded-none px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600 font-sans"
							/>
							<Button
								type="submit"
								className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 w-7 p-0 rounded-none flex items-center justify-center transition-colors shadow shrink-0"
							>
								<Send size={11} />
							</Button>
						</form>
					</div>
				)}

				{/* Floating / Centered Private Assessment Modal for Interviewer */}
				{showEvaluationModal && isInterviewer && (
					<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
						<div className="bg-surface border border-border w-full max-w-md rounded-none shadow-2xl relative overflow-hidden flex flex-col">
							
							{/* Modal Header */}
							<div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-2">
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-sans">
										Private Assessor Panel
									</span>
								</div>
								<button 
									onClick={() => setShowEvaluationModal(false)}
									className="text-slate-500 hover:text-slate-350 transition-colors"
								>
									<X size={15} />
								</button>
							</div>

							{/* Modal Form Content */}
							<div className="p-5 space-y-4 text-slate-200">
								<div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-none text-[10px] text-emerald-300 font-sans leading-relaxed">
									<Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
									<span>This scorecard rating and notes are strictly private. The candidate cannot see this feedback.</span>
								</div>

								{/* Score stars */}
								<div className="space-y-1.5">
									<label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Candidate Rating score *</label>
									<div className="flex gap-2">
										<Rating
											value={rating}
											onChange={(_, newValue) => {
												if (newValue !== null) setRating(newValue)
											}}
											sx={{
												'& .MuiRating-iconEmpty': {
													color: '#444444',
												},
												'& .MuiRating-iconFilled': {
													color: '#fbbf24',
												},
												fontSize: '1.75rem',
											}}
										/>
									</div>
								</div>

								{/* Written notes */}
								<div className="space-y-1.5">
									<label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Assessment Feedback notes</label>
									<textarea
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Review coding patterns, edge cases covered, communication style, etc..."
										rows={5}
										className="w-full bg-code-bg border border-border rounded-none p-3 text-xs leading-relaxed text-slate-200 focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-600 font-sans"
									/>
								</div>
							</div>

							{/* Modal Footer actions */}
							<div className="px-5 py-4 border-t border-border bg-surface-2 flex items-center justify-end gap-3.5">
								<button
									onClick={() => setShowEvaluationModal(false)}
									className="px-4 py-1.5 bg-code-bg hover:bg-surface-3 border border-border rounded-none text-[10.5px] font-bold text-slate-400 hover:text-slate-200 font-sans transition-colors"
								>
									Cancel
								</button>
								<Button
									onClick={handleSubmitEvaluation}
									disabled={isSavingNotes}
									className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-1.5 rounded-none text-[10.5px] font-bold font-sans transition-colors"
								>
									{isSavingNotes ? 'Saving...' : 'Submit Evaluation'}
								</Button>
							</div>

						</div>
					</div>
				)}

			</div>
		</div>
	)
}
