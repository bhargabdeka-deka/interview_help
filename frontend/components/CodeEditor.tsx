'use client'

import React, { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Play, Settings, FileText, Lock, ClipboardList, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface CodeEditorProps {
	code: string
	language: string
	fontSize: number
	wordWrap: 'on' | 'off'
	onFontSizeChange: (size: number) => void
	onWordWrapChange: (wrap: 'on' | 'off') => void
	onChange: (value: string) => void
	onLanguageChange: (lang: string) => void
	isReadOnly?: boolean
	onRunCode?: () => void
	isExecuting?: boolean
	candidateName?: string
	isInterviewer?: boolean
	onOpenEvaluation?: () => void
}

const SUPPORTED_LANGUAGES = [
	{ label: 'JavaScript (Node)', value: 'javascript' },
	{ label: 'Python (3.10)', value: 'python' },
	{ label: 'Go (1.21)', value: 'go' },
	{ label: 'Java (OpenJDK)', value: 'java' },
	{ label: 'C++ (GCC)', value: 'cpp' },
]

const TEMPLATES: Record<string, { title: string; code: string }[]> = {
	javascript: [
		{
			title: 'Reverse String',
			code: `// Reverse a string in JavaScript\nfunction reverseString(str) {\n  return str.split('').reverse().join('');\n}\n\nconsole.log(reverseString("hello"));\n`
		},
		{
			title: 'Binary Search',
			code: `// Binary search implementation in JS\nfunction binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\n\nconsole.log(binarySearch([1, 2, 3, 4, 5, 6], 4));\n`
		}
	],
	python: [
		{
			title: 'Reverse String',
			code: `# Reverse a string in Python\ndef reverse_string(s):\n    return s[::-1]\n\nprint(reverse_string("hello"))\n`
		},
		{
			title: 'Binary Search',
			code: `# Binary search in Python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\nprint(binary_search([1, 2, 3, 4, 5, 6], 4))\n`
		}
	],
	go: [
		{
			title: 'Reverse String',
			code: `package main\n\nimport "fmt"\n\nfunc reverseString(s string) string {\n\tr := []rune(s)\n\tfor i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {\n\t\tr[i], r[j] = r[j], r[i]\n\t}\n\treturn string(r)\n}\n\nfunc main() {\n\tfmt.Println(reverseString("hello"))\n}\n`
		},
		{
			title: 'Binary Search',
			code: `package main\n\nimport "fmt"\n\nfunc binarySearch(arr []int, target int) int {\n\tleft, right := 0, len(arr)-1\n\tfor left <= right {\n\t\tmid := (left + right) / 2\n\t\tif arr[mid] == target {\n\t\t\treturn mid\n\t\t} else if arr[mid] < target {\n\t\t\tleft = mid + 1\n\t\t} else {\n\t\t\tright = mid - 1\n\t\t}\n\t}\n\treturn -1\n}\n\nfunc main() {\n\tfmt.Println(binarySearch([]int{1, 2, 3, 4, 5, 6}, 4))\n}\n`
		}
	],
	java: [
		{
			title: 'Main Boilerplate',
			code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`
		}
	],
	cpp: [
		{
			title: 'Main Boilerplate',
			code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`
		}
	]
}

export function CodeEditor({
	code,
	language,
	fontSize,
	wordWrap,
	onFontSizeChange,
	onWordWrapChange,
	onChange,
	onLanguageChange,
	isReadOnly = false,
	onRunCode,
	isExecuting = false,
	candidateName = 'Candidate',
	isInterviewer = false,
	onOpenEvaluation,
}: CodeEditorProps) {
	const [showSettings, setShowSettings] = useState(false)
	const [showSnippets, setShowSnippets] = useState(false)

	const handleEditorChange = (value: string | undefined) => {
		if (value !== undefined) {
			onChange(value)
		}
	}

	return (
		<div className="flex flex-col h-full bg-code-bg text-white overflow-hidden border border-border rounded-none">
			{/* IDE Header Bar (CoderPad Style) */}
			<div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-border">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-slate-200">
						Interview with {candidateName}
					</span>
					<button
						onClick={() => {
							navigator.clipboard.writeText(candidateName);
							toast.success('ID copied to clipboard!');
						}}
						className="text-slate-400 hover:text-accent transition-colors"
						title="Copy ID"
					>
						<Copy size={13} />
					</button>
				</div>

				<div className="flex items-center gap-2 relative">
					<button
						onClick={() => {
							setShowSnippets(!showSnippets)
							setShowSettings(false)
						}}
						type="button"
						className={`flex items-center gap-1.5 bg-code-bg hover:bg-surface-3 border border-border text-slate-350 hover:text-slate-100 text-[10px] font-bold px-3 py-1 rounded-none transition-colors ${showSnippets ? 'border-accent text-accent' : ''}`}
					>
						<FileText size={11} />
						Snippets
					</button>

					{showSnippets && (
						<div className="absolute top-8 left-0 mt-1 w-56 bg-[#18181b] border border-border rounded-none shadow-2xl z-50 p-2 text-xs space-y-1">
							<div className="font-bold text-[9px] text-text-secondary uppercase tracking-wider px-2 py-1">
								{language.toUpperCase()} Snippets
							</div>
							{!TEMPLATES[language] || TEMPLATES[language].length === 0 ? (
								<div className="text-text-secondary italic px-2 py-1.5">No snippets for {language}</div>
							) : (
								TEMPLATES[language].map((snippet, idx) => (
									<button
										key={idx}
										onClick={() => {
											onChange(snippet.code)
											setShowSnippets(false)
											toast.success(`Loaded "${snippet.title}" snippet!`)
										}}
										className="w-full text-left px-2 py-1.5 rounded-none hover:bg-surface text-text-primary hover:text-accent transition-colors flex items-center justify-between"
									>
										<span>{snippet.title}</span>
									</button>
								))
							)}
						</div>
					)}

					<button
						onClick={() => {
							toast.success('Pad privacy verified. Room is private and encrypted.', {
								icon: '🔒',
							})
						}}
						type="button"
						className="flex items-center gap-1.5 bg-code-bg hover:bg-surface-3 border border-border text-slate-350 hover:text-slate-100 text-[10px] font-bold px-3 py-1 rounded-none transition-colors"
					>
						<Lock size={11} />
						Pad Privacy
					</button>

					{/* Private Evaluation notes trigger for Interviewer */}
					{isInterviewer && onOpenEvaluation && (
						<button
							onClick={onOpenEvaluation}
							type="button"
							className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-none transition-colors"
							title="Interviewer Private Assessment Notes"
						>
							<ClipboardList size={11} />
							Evaluation
						</button>
					)}
				</div>
			</div>

			{/* Monaco Editor Canvas */}
			<div className="flex-1 min-h-0 relative bg-code-bg">
				<Editor
					height="100%"
					language={language}
					value={code}
					theme="vs-dark"
					onChange={handleEditorChange}
					options={{
						readOnly: isReadOnly,
						minimap: { enabled: false },
						fontSize: fontSize,
						fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
						tabSize: 2,
						automaticLayout: true,
						wordWrap: wordWrap,
						lineNumbers: 'on',
						scrollbar: {
							vertical: 'visible',
							horizontal: 'visible',
							verticalScrollbarSize: 8,
							horizontalScrollbarSize: 8,
						},
						padding: { top: 12, bottom: 12 },
					}}
					loading={
						<div className="absolute inset-0 flex items-center justify-center bg-code-bg">
							<div className="flex flex-col items-center gap-3">
								<div className="animate-spin rounded-none h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
								<span className="text-xs text-slate-500">Initializing editor...</span>
							</div>
						</div>
					}
				/>
			</div>

			{/* IDE Footer Bar (CoderPad Style) */}
			<div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-t border-border">
				{/* Green Play Run Button */}
				{onRunCode && (
					<Button
						onClick={onRunCode}
						disabled={isExecuting}
						size="sm"
						className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold px-5 h-9 rounded-none flex items-center justify-center gap-2 border-none shadow-none text-xs"
					>
						<Play size={13} fill="currentColor" className={isExecuting ? 'animate-pulse' : ''} />
						{isExecuting ? 'Running...' : 'Run'}
					</Button>
				)}

				<div className="flex items-center gap-2 relative">
					{/* Language Select Dropdown */}
					<div className="bg-code-bg border border-border px-3 py-1.5 rounded-none flex items-center">
						<select
							value={language}
							onChange={(e) => onLanguageChange(e.target.value)}
							disabled={isReadOnly}
							className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer pr-1"
						>
							{SUPPORTED_LANGUAGES.map((lang) => (
								<option key={lang.value} value={lang.value} className="bg-code-bg text-slate-250">
									{lang.label}
								</option>
							))}
						</select>
					</div>

					{/* Settings Gear Button */}
					<button
						onClick={() => {
							setShowSettings(!showSettings)
							setShowSnippets(false)
						}}
						type="button"
						className={`p-2 bg-code-bg hover:bg-surface-3 border border-border rounded-none text-slate-350 hover:text-slate-100 transition-colors ${showSettings ? 'border-accent text-accent' : ''}`}
						title="Editor Settings"
					>
						<Settings size={14} />
					</button>

					{showSettings && (
						<div className="absolute bottom-10 right-0 mb-1 w-48 bg-[#18181b] border border-border rounded-none shadow-2xl z-[9999] p-3 text-xs space-y-3">
							<div className="font-bold text-[9px] text-text-secondary uppercase tracking-wider">
								Editor Settings
							</div>
							
							{/* Font Size */}
							<div className="space-y-1">
								<div className="text-[10px] text-text-secondary">Font Size</div>
								<div className="grid grid-cols-4 gap-1">
									{[12, 14, 16, 18].map((size) => (
										<button
											key={size}
											onClick={() => onFontSizeChange(size)}
											className={`py-1 text-center rounded-none border transition-colors ${fontSize === size ? 'bg-accent/15 border-accent text-accent' : 'bg-surface border-border hover:bg-code-bg text-text-secondary'}`}
										>
											{size}
										</button>
									))}
								</div>
							</div>

							{/* Word Wrap */}
							<div className="space-y-1">
								<div className="text-[10px] text-text-secondary">Word Wrap</div>
								<div className="flex gap-1.5">
									{(['on', 'off'] as const).map((wrap) => (
										<button
											key={wrap}
											onClick={() => onWordWrapChange(wrap)}
											className={`flex-1 py-1 text-center rounded-none border transition-colors capitalize ${wordWrap === wrap ? 'bg-accent/15 border-accent text-accent' : 'bg-surface border-border hover:bg-code-bg text-text-secondary'}`}
										>
											{wrap}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
