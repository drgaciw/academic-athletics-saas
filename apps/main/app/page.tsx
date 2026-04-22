import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* ── HERO ── */}
      <section className="relative bg-oru-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-oru-navy via-oru-navy/80 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-oru-gold" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-oru-gold/10 border border-oru-gold/30 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-oru-gold animate-pulse" aria-hidden="true" />
              <span className="text-oru-gold text-xs font-semibold uppercase tracking-widest">
                Oral Roberts University
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Academic Excellence on the Pitch and in the Classroom
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl leading-relaxed">
              The dedicated academic portal for ORU Soccer programs &mdash; track grades,
              monitor NCAA eligibility, and stay connected with your academic advisor all in
              one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-lg bg-oru-gold px-8 py-3.5 text-base font-semibold text-oru-navy shadow-lg hover:bg-oru-gold-light transition-colors"
              >
                Get Access
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white/60 px-8 py-3.5 text-base font-semibold text-white hover:border-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAMS BANNER ── */}
      <section id="team" className="bg-oru-gold py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oru-navy">
                <svg className="w-5 h-5 text-oru-gold" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c.55 0 1.09.06 1.61.16L12 6.28l-1.61-2.12A8.05 8.05 0 0 1 12 4zm-3.5.85 1.83 2.41-2.74 2.08L5.1 8.06A8.03 8.03 0 0 1 8.5 4.85zm7 0A8.03 8.03 0 0 1 18.9 8.06l-2.49 1.28-2.74-2.08 1.83-2.41zM4.23 9.79l2.32-1.2 1.16 3.57-2.89.93A8.05 8.05 0 0 1 4.23 9.79zm15.54 0a8.05 8.05 0 0 1-.59 3.3l-2.89-.93 1.16-3.57 2.32 1.2zM9 13.42l2.01-.65L12 14l.99-1.23 2.01.65.69 3.36A8 8 0 0 1 12 18a8 8 0 0 1-3.69-.87L9 13.42zm-1.65.28.65-3.16H9l.56 1.72-1.07 3.29a8.05 8.05 0 0 1-2.14-1.85zm9.3 0-1 .85L15.44 12 16 10.54h1l.65 3.16a8.05 8.05 0 0 1-2.13 1.85z" />
                </svg>
              </div>
              <span className="font-bold text-oru-navy text-lg">Men&apos;s Soccer</span>
              <span className="text-oru-navy/60 text-sm font-medium">Golden Eagles</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-oru-navy/20" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oru-navy">
                <svg className="w-5 h-5 text-oru-gold" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c.55 0 1.09.06 1.61.16L12 6.28l-1.61-2.12A8.05 8.05 0 0 1 12 4zm-3.5.85 1.83 2.41-2.74 2.08L5.1 8.06A8.03 8.03 0 0 1 8.5 4.85zm7 0A8.03 8.03 0 0 1 18.9 8.06l-2.49 1.28-2.74-2.08 1.83-2.41zM4.23 9.79l2.32-1.2 1.16 3.57-2.89.93A8.05 8.05 0 0 1 4.23 9.79zm15.54 0a8.05 8.05 0 0 1-.59 3.3l-2.89-.93 1.16-3.57 2.32 1.2zM9 13.42l2.01-.65L12 14l.99-1.23 2.01.65.69 3.36A8 8 0 0 1 12 18a8 8 0 0 1-3.69-.87L9 13.42zm-1.65.28.65-3.16H9l.56 1.72-1.07 3.29a8.05 8.05 0 0 1-2.14-1.85zm9.3 0-1 .85L15.44 12 16 10.54h1l.65 3.16a8.05 8.05 0 0 1-2.13 1.85z" />
                </svg>
              </div>
              <span className="font-bold text-oru-navy text-lg">Women&apos;s Soccer</span>
              <span className="text-oru-navy/60 text-sm font-medium">Golden Eagles</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for ORU Soccer Student-Athletes
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything coaches, advisors, and players need to keep grades up and eligibility locked in.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Academic Monitoring */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Academic Monitoring</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Real-time grade and attendance tracking. AI-powered alerts flag at-risk athletes before grades become an eligibility issue.
              </p>
            </div>

            {/* Eligibility Tracking */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">NCAA Eligibility</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Automated eligibility checks against NCAA Division I requirements for credit hours, GPA, and progress-toward-degree.
              </p>
            </div>

            {/* Seamless Communication */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Coach and Advisor Connect</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Direct messaging between coaches, advisors, and faculty. Schedule study hall and flag concerns without leaving the platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Getting Started is Simple</h2>
            <p className="mt-4 text-lg text-gray-600">From roster setup to game-day eligibility in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Add Your Roster", body: "Import the soccer rosters and connect to ORU student records to auto-fill academic data." },
              { step: "2", title: "Set Up Alerts", body: "Configure GPA thresholds, credit-hour checkpoints, and eligibility windows." },
              { step: "3", title: "Track and Succeed", body: "Coaches and advisors get a live dashboard. Athletes see their own progress." },
            ].map(({ step, title, body }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-oru-navy rounded-full flex items-center justify-center mx-auto mb-6 text-oru-gold text-2xl font-extrabold shadow-lg">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Trusted by the ORU Soccer Family</h2>
            <p className="mt-4 text-lg text-gray-600">Coaches, advisors, and student-athletes share their experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "Having a single dashboard transformed how I do my job. I catch eligibility issues weeks before they become a problem.", name: "Coach Marcus Webb", role: "Head Coach, ORU Soccer" },
              { quote: "The automated eligibility alerts alone are worth it. Players know exactly where they stand with NCAA requirements.", name: "Dr. Alicia Torres", role: "Academic Advisor, ORU Athletics" },
              { quote: "As a student-athlete with a full schedule, seeing my GPA tracker and talking to my advisor in one app makes a huge difference.", name: "Jordan Fields", role: "ORU Soccer" },
            ].map(({ quote, name, role }) => (
              <div key={name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200">
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">{quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-oru-navy flex items-center justify-center text-oru-gold font-bold text-sm flex-shrink-0">
                    {name.charAt(0)}
                  </div>
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

      {/* ── CTA ── */}
      <section className="py-20 bg-oru-navy relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-oru-gold" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Elevate Golden Eagle Academics?
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            Join the ORU Soccer staff keeping every athlete eligible and on track to graduate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg bg-oru-gold px-8 py-3.5 text-base font-semibold text-oru-navy shadow-lg hover:bg-oru-gold-light transition-colors"
            >
              Get Access
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/60 px-8 py-3.5 text-base font-semibold text-white hover:border-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-oru-navy border-t border-white/10 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-oru-gold font-bold text-base block mb-2">ORU Soccer Academic Portal</span>
              <p className="text-xs text-white/50">
                Supporting student-athlete academic success for Oral Roberts University Soccer programs.
              </p>
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
                <li>
                  <Link href="https://orueagles.com" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">
                    ORU Eagles
                  </Link>
                </li>
                <li>
                  <Link href="https://oru.edu" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">
                    ORU Website
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:athletics@oru.edu" className="hover:text-oru-gold transition-colors">Contact Athletics</a></li>
                <li>
                  <Link href="https://oru.edu/about/administration/legal" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">
                    ORU Legal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 Athletic Academics Hub. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Visit our Facebook page"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Visit our Twitter page"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
