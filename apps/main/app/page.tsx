import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">

      <section className="relative bg-oru-navy overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80)", backgroundSize: "cover", backgroundPosition: "center top" }} aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-oru-gold" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-oru-gold/10 border border-oru-gold/30 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-oru-gold animate-pulse" aria-hidden="true" />
              <span className="text-oru-gold text-xs font-semibold uppercase tracking-widest">Oral Roberts University</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Academic Excellence on the Pitch and in the Classroom
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-2xl leading-relaxed">
              The dedicated academic portal for ORU Soccer programs &mdash; track grades, monitor NCAA eligibility, and stay connected with your academic advisor all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up" className="inline-flex items-center justify-center rounded-lg bg-oru-gold px-8 py-3.5 text-base font-semibold text-oru-navy shadow-lg hover:bg-oru-gold-light transition-colors">Get Access</Link>
              <Link href="/sign-in" className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="bg-oru-gold py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oru-navy">
                <svg className="w-5 h-5 text-oru-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeWidth="2" /></svg>
              </div>
              <span className="font-bold text-oru-navy text-lg">Men&apos;s Soccer</span>
              <span className="text-oru-navy/60 text-sm font-medium">Golden Eagles</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-oru-navy/20" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oru-navy">
                <svg className="w-5 h-5 text-oru-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeWidth="2" /></svg>
              </div>
              <span className="font-bold text-oru-navy text-lg">Women&apos;s Soccer</span>
              <span className="text-oru-navy/60 text-sm font-medium">Golden Eagles</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Built for ORU Soccer Student-Athletes</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Everything coaches, advisors, and players need to keep grades up and eligibility locked in.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-oru transition-all duration-200">
              <div className="w-14 h-14 bg-oru-navy rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-oru-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Academic Monitoring</h3>
              <p className="text-gray-600 leading-relaxed text-sm">Real-time grade and attendance tracking. AI-powered alerts flag at-risk athletes before grades become an eligibility issue.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-oru transition-all duration-200">
              <div className="w-14 h-14 bg-oru-navy rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-oru-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">NCAA Eligibility</h3>
              <p className="text-gray-600 leading-relaxed text-sm">Automated eligibility checks against NCAA Division I requirements for credit hours, GPA, and progress-toward-degree.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-oru transition-all duration-200">
              <div className="w-14 h-14 bg-oru-navy rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-oru-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Coach and Advisor Connect</h3>
              <p className="text-gray-600 leading-relaxed text-sm">Direct messaging between coaches, advisors, and faculty. Schedule study hall and flag concerns without leaving the platform.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Getting Started is Simple</h2>
            <p className="mt-4 text-lg text-gray-600">From roster setup to game-day eligibility in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Add Your Roster', body: 'Import the soccer rosters and connect to ORU student records to auto-fill academic data.' },
              { step: '2', title: 'Set Up Alerts', body: 'Configure GPA thresholds, credit-hour checkpoints, and eligibility windows.' },
              { step: '3', title: 'Track and Succeed', body: 'Coaches and advisors get a live dashboard. Athletes see their own progress.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-oru-navy rounded-full flex items-center justify-center mx-auto mb-6 text-oru-gold text-2xl font-extrabold shadow-oru">{step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Trusted by the ORU Soccer Family</h2>
            <p className="mt-4 text-lg text-gray-600">Coaches, advisors, and student-athletes share their experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: 'Having a single dashboard transformed how I do my job. I catch eligibility issues weeks before they become a problem.', name: 'Coach Marcus Webb', role: 'Head Coach, ORU Soccer' },
              { quote: 'The automated eligibility alerts alone are worth it. Players know exactly where they stand with NCAA requirements.', name: 'Dr. Alicia Torres', role: 'Academic Advisor, ORU Athletics' },
              { quote: 'As a student-athlete with a full schedule, seeing my GPA tracker and talking to my advisor in one app makes a huge difference.', name: 'Jordan Fields', role: 'ORU Soccer' },
            ].map(({ quote, name, role }) => (
              <div key={name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-oru transition-all duration-200">
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">{quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-oru-navy to-oru-navy-light flex items-center justify-center text-oru-gold font-bold text-sm">{name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-oru-navy relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-oru-gold" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Elevate Golden Eagle Academics?</h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">Join the ORU Soccer staff keeping every athlete eligible and on track to graduate.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-lg bg-oru-gold px-8 py-3.5 text-base font-semibold text-oru-navy shadow-lg hover:bg-oru-gold-light transition-colors">Get Access</Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors">Sign In</Link>
          </div>
        </div>
      </section>

      <footer className="bg-oru-navy border-t border-white/10 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-oru-gold font-bold text-base block mb-2">ORU Soccer Academic Portal</span>
              <p className="text-xs text-white/50">Supporting student-athlete academic success for Oral Roberts University Soccer programs.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Portal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-oru-gold transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-oru-gold transition-colors">How it Works</Link></li>
                <li><Link href="/sign-in" className="hover:text-oru-gold transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">ORU Athletics</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="https://orueagles.com" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">ORU Eagles</Link></li>
                <li><Link href="https://oru.edu" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">ORU Website</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-oru-gold transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-oru-gold transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">2026 Oral Roberts University Athletics. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
