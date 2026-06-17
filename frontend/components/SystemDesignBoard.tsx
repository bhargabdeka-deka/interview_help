'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
	PenTool, 
	Square, 
	Circle as CircleIcon, 
	Minus, 
	Type, 
	Eraser, 
	RotateCcw, 
	Trash2, 
	FileText 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Shape {
	id: string
	type: 'path' | 'rect' | 'circle' | 'line' | 'text'
	points?: { x: number; y: number }[]
	x?: number
	y?: number
	width?: number
	height?: number
	cx?: number
	cy?: number
	r?: number
	x1?: number
	y1?: number
	x2?: number
	y2?: number
	text?: string
	color: string
	strokeWidth: number
}

interface SystemDesignBoardProps {
	shapes: Shape[]
	notes: string
	onSync: (shapes: Shape[], notes: string) => void
	isReadOnly?: boolean
}

const COLORS = [
	{ label: 'White', value: '#ffffff' },
	{ label: 'Blue', value: '#60a5fa' },
	{ label: 'Emerald', value: '#34d399' },
	{ label: 'Amber', value: '#fbbf24' },
	{ label: 'Rose', value: '#f43f5e' },
]

const STROKE_WIDTHS = [
	{ label: 'S', value: 2 },
	{ label: 'M', value: 5 },
	{ label: 'L', value: 10 },
]

export function SystemDesignBoard({
	shapes,
	notes,
	onSync,
	isReadOnly = false,
}: SystemDesignBoardProps) {
	const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'line' | 'text' | 'eraser'>('pen')
	const [color, setColor] = useState('#ffffff')
	const [strokeWidth, setStrokeWidth] = useState(2)
	const [isDrawing, setIsDrawing] = useState(false)
	const [currentShape, setCurrentShape] = useState<Shape | null>(null)
	
	// Notes syncing states
	const [localNotes, setLocalNotes] = useState(notes)
	const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' })
	const textInputRef = useRef<HTMLInputElement | null>(null)

	// Sync local notes state with prop when it updates from other peers
	useEffect(() => {
		setLocalNotes(notes)
	}, [notes])

	// Debounced notes sync to prevent socket flooding
	useEffect(() => {
		const handler = setTimeout(() => {
			if (localNotes !== notes) {
				onSync(shapes, localNotes)
			}
		}, 500)
		return () => clearTimeout(handler)
	}, [localNotes])

	const getMousePos = (e: React.MouseEvent<SVGSVGElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		}
	}

	const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
		if (isReadOnly) return
		const pos = getMousePos(e)
		setIsDrawing(true)

		const id = Math.random().toString(36).substr(2, 9)
		const activeColor = tool === 'eraser' ? '#1e1e1e' : color
		const activeWidth = tool === 'eraser' ? 24 : strokeWidth

		if (tool === 'text') {
			setTextInput({ show: true, x: pos.x, y: pos.y, value: '' })
			setIsDrawing(false)
			setTimeout(() => textInputRef.current?.focus(), 50)
			return
		}

		let newShape: Shape | null = null

		if (tool === 'pen' || tool === 'eraser') {
			newShape = {
				id,
				type: 'path',
				points: [pos],
				color: activeColor,
				strokeWidth: activeWidth,
			}
		} else if (tool === 'rect') {
			newShape = {
				id,
				type: 'rect',
				x: pos.x,
				y: pos.y,
				width: 0,
				height: 0,
				color: activeColor,
				strokeWidth: activeWidth,
			}
		} else if (tool === 'circle') {
			newShape = {
				id,
				type: 'circle',
				cx: pos.x,
				cy: pos.y,
				r: 0,
				color: activeColor,
				strokeWidth: activeWidth,
			}
		} else if (tool === 'line') {
			newShape = {
				id,
				type: 'line',
				x1: pos.x,
				y1: pos.y,
				x2: pos.x,
				y2: pos.y,
				color: activeColor,
				strokeWidth: activeWidth,
			}
		}

		setCurrentShape(newShape)
	}

	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
		if (!isDrawing || !currentShape || isReadOnly) return
		const pos = getMousePos(e)

		let updated: Shape = { ...currentShape }

		if (currentShape.type === 'path' && currentShape.points) {
			updated.points = [...currentShape.points, pos]
		} else if (currentShape.type === 'rect') {
			const x0 = currentShape.x!
			const y0 = currentShape.y!
			updated.x = Math.min(x0, pos.x)
			updated.y = Math.min(y0, pos.y)
			updated.width = Math.abs(pos.x - x0)
			updated.height = Math.abs(pos.y - y0)
		} else if (currentShape.type === 'circle') {
			const cx = currentShape.cx!
			const cy = currentShape.cy!
			updated.r = Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2))
		} else if (currentShape.type === 'line') {
			updated.x2 = pos.x
			updated.y2 = pos.y
		}

		setCurrentShape(updated)
	}

	const handleMouseUp = () => {
		if (!isDrawing || !currentShape || isReadOnly) return
		setIsDrawing(false)

		// Discard very small shapes
		let isValid = true
		if (currentShape.type === 'rect' && (currentShape.width || 0) < 3 && (currentShape.height || 0) < 3) isValid = false
		if (currentShape.type === 'circle' && (currentShape.r || 0) < 3) isValid = false

		if (isValid) {
			const updatedShapes = [...shapes, currentShape]
			onSync(updatedShapes, localNotes)
		}
		setCurrentShape(null)
	}

	const handleTextSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!textInput.value.trim() || isReadOnly) {
			setTextInput({ show: false, x: 0, y: 0, value: '' })
			return
		}

		const id = Math.random().toString(36).substr(2, 9)
		const newShape: Shape = {
			id,
			type: 'text',
			x: textInput.x,
			y: textInput.y,
			text: textInput.value,
			color,
			strokeWidth: 14, // maps to font size
		}

		const updatedShapes = [...shapes, newShape]
		onSync(updatedShapes, localNotes)
		setTextInput({ show: false, x: 0, y: 0, value: '' })
	}

	const handleUndo = () => {
		if (shapes.length === 0 || isReadOnly) return
		const updatedShapes = shapes.slice(0, -1)
		onSync(updatedShapes, localNotes)
		toast.success('Undone last action')
	}

	const handleClear = () => {
		if (shapes.length === 0 || isReadOnly) return
		if (window.confirm('Are you sure you want to clear the entire whiteboard?')) {
			onSync([], localNotes)
			toast.success('Whiteboard cleared')
		}
	}

	return (
		<div className="flex flex-col h-full bg-code-bg text-white overflow-hidden border border-border rounded-none">
			
			{/* Whiteboard Header Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-surface-2 border-b border-border shrink-0">
				
				{/* Draw tools */}
				<div className="flex items-center gap-1">
					<button
						onClick={() => setTool('pen')}
						disabled={isReadOnly}
						className={`p-1.5 rounded-none transition-colors ${tool === 'pen' ? 'bg-emerald-600 text-white' : 'bg-code-bg text-slate-400 hover:text-slate-200'}`}
						title="Pencil Tool"
					>
						<PenTool size={13} />
					</button>
					<button
						onClick={() => setTool('rect')}
						disabled={isReadOnly}
						className={`p-1.5 rounded-none transition-colors ${tool === 'rect' ? 'bg-emerald-600 text-white' : 'bg-code-bg text-slate-400 hover:text-slate-200'}`}
						title="Rectangle Tool"
					>
						<Square size={13} />
					</button>
					<button
						onClick={() => setTool('circle')}
						disabled={isReadOnly}
						className={`p-1.5 rounded-none transition-colors ${tool === 'circle' ? 'bg-emerald-600 text-white' : 'bg-code-bg text-slate-400 hover:text-slate-200'}`}
						title="Circle Tool"
					>
						<CircleIcon size={13} />
					</button>
					<button
						onClick={() => setTool('line')}
						disabled={isReadOnly}
						className={`p-1.5 rounded-none transition-colors ${tool === 'line' ? 'bg-emerald-600 text-white' : 'bg-code-bg text-slate-400 hover:text-slate-200'}`}
						title="Line Tool"
					>
						<Minus size={13} />
					</button>
					<button
						onClick={() => setTool('text')}
						disabled={isReadOnly}
						className={`p-1.5 rounded-none transition-colors ${tool === 'text' ? 'bg-emerald-600 text-white' : 'bg-code-bg text-slate-400 hover:text-slate-200'}`}
						title="Text Tool"
					>
						<Type size={13} />
					</button>
					<button
						onClick={() => setTool('eraser')}
						disabled={isReadOnly}
						className={`p-1.5 rounded-none transition-colors ${tool === 'eraser' ? 'bg-emerald-600 text-white' : 'bg-code-bg text-slate-400 hover:text-slate-200'}`}
						title="Eraser Tool"
					>
						<Eraser size={13} />
					</button>
				</div>

				{/* Stroke options */}
				{tool !== 'eraser' && (
					<div className="flex items-center gap-3 border-l border-r border-border px-3">
						{/* Colors */}
						<div className="flex items-center gap-1.5">
							{COLORS.map((c) => (
								<button
									key={c.value}
									onClick={() => setColor(c.value)}
									disabled={isReadOnly}
									className={`w-4 h-4 rounded-none border transition-all ${color === c.value ? 'scale-110 border-white' : 'border-transparent'}`}
									style={{ backgroundColor: c.value }}
									title={c.label}
								/>
							))}
						</div>

						{/* Stroke Widths */}
						<div className="flex items-center gap-1">
							{STROKE_WIDTHS.map((w) => (
								<button
									key={w.value}
									onClick={() => setStrokeWidth(w.value)}
									disabled={isReadOnly}
									className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none border ${strokeWidth === w.value ? 'bg-[#333] border-emerald-500 text-emerald-400' : 'bg-code-bg border-transparent text-slate-400'}`}
								>
									{w.label}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Utility Actions */}
				<div className="flex items-center gap-1">
					<button
						onClick={handleUndo}
						disabled={shapes.length === 0 || isReadOnly}
						className="p-1.5 bg-code-bg hover:bg-surface-3 text-slate-400 hover:text-slate-200 rounded-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
						title="Undo Last"
					>
						<RotateCcw size={12} />
					</button>
					<button
						onClick={handleClear}
						disabled={shapes.length === 0 || isReadOnly}
						className="p-1.5 bg-code-bg hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
						title="Clear Board"
					>
						<Trash2 size={12} />
					</button>
				</div>
			</div>

			{/* Main Workspace split: Canvas + Notes */}
			<div className="flex-1 flex flex-row overflow-hidden min-h-0">
				
				{/* Left Side: Drawing Canvas */}
				<div className="flex-1 h-full bg-code-bg relative overflow-hidden select-none">
					
					{/* Text Input overlay */}
					{textInput.show && (
						<form
							onSubmit={handleTextSubmit}
							className="absolute z-50 p-2 bg-surface-2 border border-border rounded-none shadow-2xl"
							style={{ left: textInput.x, top: textInput.y - 20 }}
						>
							<input
								ref={textInputRef}
								type="text"
								value={textInput.value}
								onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
								onBlur={handleTextSubmit}
								placeholder="Press Enter to add"
								className="bg-code-bg border border-border rounded-none px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-sans"
							/>
						</form>
					)}

					<svg
						className="w-full h-full cursor-crosshair"
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseUp}
					>
						{/* Background grid pattern for a professional blueprint / design layout vibe */}
						<defs>
							<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
								<path d="M 30 0 L 0 0 0 30" fill="none" stroke="#252525" strokeWidth="0.5" />
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />

						{/* Commited shapes */}
						{shapes.map((shape) => {
							if (shape.type === 'path' && shape.points) {
								const d = shape.points
									.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
									.join(' ')
								return (
									<path
										key={shape.id}
										d={d}
										stroke={shape.color}
										strokeWidth={shape.strokeWidth}
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								)
							}
							if (shape.type === 'rect') {
								return (
									<rect
										key={shape.id}
										x={shape.x}
										y={shape.y}
										width={shape.width}
										height={shape.height}
										stroke={shape.color}
										strokeWidth={shape.strokeWidth}
										fill="none"
										strokeLinejoin="round"
									/>
								)
							}
							if (shape.type === 'circle') {
								return (
									<circle
										key={shape.id}
										cx={shape.cx}
										cy={shape.cy}
										r={shape.r}
										stroke={shape.color}
										strokeWidth={shape.strokeWidth}
										fill="none"
									/>
								)
							}
							if (shape.type === 'line') {
								return (
									<line
										key={shape.id}
										x1={shape.x1}
										y1={shape.y1}
										x2={shape.x2}
										y2={shape.y2}
										stroke={shape.color}
										strokeWidth={shape.strokeWidth}
										strokeLinecap="round"
									/>
								)
							}
							if (shape.type === 'text') {
								return (
									<text
										key={shape.id}
										x={shape.x}
										y={shape.y}
										fill={shape.color}
										fontSize={shape.strokeWidth}
										fontFamily="sans-serif"
										fontWeight="semibold"
									>
										{shape.text}
									</text>
								)
							}
							return null
						})}

						{/* Shape in progress drawing */}
						{currentShape && (
							<>
								{currentShape.type === 'path' && currentShape.points && (
									<path
										d={currentShape.points
											.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
											.join(' ')}
										stroke={currentShape.color}
										strokeWidth={currentShape.strokeWidth}
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								)}
								{currentShape.type === 'rect' && (
									<rect
										x={currentShape.x}
										y={currentShape.y}
										width={currentShape.width}
										height={currentShape.height}
										stroke={currentShape.color}
										strokeWidth={currentShape.strokeWidth}
										fill="none"
										strokeLinejoin="round"
									/>
								)}
								{currentShape.type === 'circle' && (
									<circle
										cx={currentShape.cx}
										cy={currentShape.cy}
										r={currentShape.r}
										stroke={currentShape.color}
										strokeWidth={currentShape.strokeWidth}
										fill="none"
									/>
								)}
								{currentShape.type === 'line' && (
									<line
										x1={currentShape.x1}
										y1={currentShape.y1}
										x2={currentShape.x2}
										y2={currentShape.y2}
										stroke={currentShape.color}
										strokeWidth={currentShape.strokeWidth}
										strokeLinecap="round"
									/>
								)}
							</>
						)}
					</svg>

					{shapes.length === 0 && !currentShape && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 font-sans text-xs uppercase tracking-widest gap-2">
							<PenTool size={13} />
							Collaborative Drawing Workspace
						</div>
					)}
				</div>

				{/* Right Side: Notes Board */}
				<div className="w-[30%] border-l border-border bg-surface-2 flex flex-col h-full min-w-[200px]">
					<div className="px-3 py-2 bg-[#121212] border-b border-border flex items-center gap-1.5 text-slate-350 shrink-0 font-sans">
						<FileText size={12} className="text-emerald-400" />
						<span className="text-[10px] font-bold uppercase tracking-wider">System Design Notes</span>
					</div>
					<textarea
						value={localNotes}
						onChange={(e) => setLocalNotes(e.target.value)}
						disabled={isReadOnly}
						placeholder="Requirements, API Endpoints, DB Schema or calculations..."
						className="flex-1 bg-transparent p-4 text-xs leading-relaxed text-slate-200 focus:outline-none placeholder:text-slate-600 font-sans resize-none selection:bg-slate-700/50"
					/>
				</div>

			</div>
		</div>
	)
}
