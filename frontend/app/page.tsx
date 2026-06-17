import Link from 'next/link'
import { TerminalSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-bg overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="text-2xl font-logo font-black tracking-tight text-text-primary flex items-center gap-2">
            <TerminalSquare className="text-accent w-7 h-7" strokeWidth={2.5} />
            InterviewOS
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-5 py-2 text-sm font-semibold text-text-primary hover:text-accent transition-colors bg-transparent border border-transparent">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-5 py-2 text-sm font-semibold text-bg bg-accent hover:bg-[#0d9b6c] transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container pt-32 pb-24 relative">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-block mb-6 px-4 py-1.5 border border-accent/30 bg-accent/10 text-accent text-sm font-semibold tracking-wide uppercase">
              The Next Evolution of Hiring
            </div>
            <h1 className="text-6xl md:text-7xl font-display font-bold mb-8 text-text-primary leading-[1.1] tracking-tight">
              Conduct Technical Interviews with <span className="text-accent">Absolute Precision</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
              A unified workspace combining HD video, real-time collaborative coding, and architectural whiteboarding. Built for elite engineering teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/signup">
                <button className="px-8 py-4 text-lg font-bold text-bg bg-accent hover:bg-[#0d9b6c] transition-all transform hover:-translate-y-0.5 w-full sm:w-auto">
                  Start Free Trial
                </button>
              </Link>
              <Link href="#features">
                <button className="px-8 py-4 text-lg font-bold text-text-primary bg-surface border border-border hover:border-accent hover:bg-surface-2 transition-all w-full sm:w-auto">
                  Explore Platform
                </button>
              </Link>
            </div>
          </div>

          {/* Hero Image / Editor Preview mockup */}
          <div className="mt-24 relative mx-auto max-w-6xl">
            <div className="bg-surface-2 border border-border overflow-hidden relative group transition-all duration-500 hover:border-accent/50">
              {/* Fake Window Controls */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-border">
                <div className="w-3 h-3 bg-border" />
                <div className="w-3 h-3 bg-border" />
                <div className="w-3 h-3 bg-border" />
                <div className="ml-4 text-xs font-code text-text-secondary">interview-room.tsx - InterviewOS</div>
              </div>
              <div className="p-8 grid grid-cols-3 gap-6 h-[400px]">
                {/* Video column mock */}
                <div className="col-span-1 space-y-4">
                  <div className="h-40 bg-surface border border-border relative overflow-hidden group-hover:border-accent/30 transition-colors">
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-xs font-bold">Interviewer</div>
                  </div>
                  <div className="h-40 bg-surface border border-border relative overflow-hidden">
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-xs font-bold">Candidate</div>
                  </div>
                </div>
                {/* Code editor mock */}
                <div className="col-span-2 bg-code-bg border border-border p-6 font-code text-sm overflow-hidden relative">
                  <div className="text-accent mb-2">function twoSum(nums, target) {'{'}</div>
                  <div className="text-text-primary ml-4 mb-2">const map = new Map();</div>
                  <div className="text-text-primary ml-4 mb-2">for (let i = 0; i {'<'} nums.length; i++) {'{'}</div>
                  <div className="text-text-secondary ml-8 mb-2">// Find complement</div>
                  <div className="text-text-primary ml-8 mb-2">const comp = target - nums[i];</div>
                  <div className="text-text-primary ml-8 mb-2">if (map.has(comp)) return [map.get(comp), i];</div>
                  <div className="text-text-primary ml-8 mb-2">map.set(nums[i], i);</div>
                  <div className="text-text-primary ml-4 mb-2">{'}'}</div>
                  <div className="text-accent">{'}'}</div>
                  
                  {/* Fake cursor */}
                  <div className="absolute top-[170px] left-[180px] w-0.5 h-4 bg-accent animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-surface relative z-20 border-t border-border">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-4">Engineered for Excellence</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">Everything you need to conduct flawless technical interviews, packed into a blazing-fast interface.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "⚡",
                  title: "Real-time Sync",
                  desc: "Sub-millisecond latency code synchronization across the globe via optimized WebSockets."
                },
                {
                  icon: "🎨",
                  title: "System Design",
                  desc: "Integrated SVG-based whiteboarding with instant shape rendering and text notes."
                },
                {
                  icon: "🛡️",
                  title: "Secure Lobbies",
                  desc: "Granular access controls. Admit, reject, or quarantine guests in real-time."
                },
                {
                  icon: "🔄",
                  title: "Auto-Recovery",
                  desc: "Accidental disconnects? Your code and canvas state are instantly restored upon rejoin."
                },
                {
                  icon: "🎥",
                  title: "HD WebRTC",
                  desc: "Crystal clear audio and video streaming built directly into the workspace layout."
                },
                {
                  icon: "📊",
                  title: "Assessor Tools",
                  desc: "Private notes, scorecard integrations, and instant post-interview automated summaries."
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 bg-surface-2 border border-border hover:border-accent transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  <div className="text-3xl mb-6 bg-surface p-4 inline-block border border-border text-accent group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 font-display">{feature.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-3/30" />
          <div className="container relative z-10 text-center">
            <h2 className="text-5xl font-display font-bold text-text-primary mb-6">Ready to upgrade your hiring?</h2>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">Join hundreds of top engineering teams using InterviewOS to identify the world's best talent.</p>
            <Link href="/signup">
              <button className="px-10 py-5 text-xl font-bold text-bg bg-accent hover:bg-[#0d9b6c] transition-all transform hover:-translate-y-1">
                Create Your Workspace
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface text-text-primary">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-logo font-black tracking-tight text-text-primary flex items-center gap-2 mb-4">
                <TerminalSquare className="text-accent w-7 h-7" strokeWidth={2.5} />
                InterviewOS
              </div>
              <p className="text-text-secondary max-w-sm">
                The premium standard for technical interviews, engineered to empower both assessors and candidates.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><Link href="#" className="hover:text-accent transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><Link href="#" className="hover:text-accent transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-text-secondary text-sm">
            <div>&copy; 2026 InterviewOS. All rights reserved.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-accent transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-accent transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}