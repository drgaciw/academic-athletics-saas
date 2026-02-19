import Link from "next/link";

export default function Home() {
    return (
          <div className="flex min-h-screen flex-col bg-white">
          
            {/* ── HERO ── */}
                <section className="relative bg-oru-navy overflow-hidden">
                  {/* Background image */}
                        <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                                  backgroundImage:
                                                                  "url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80)",
                                                  backgroundSize: "cover",
                                                  backgroundPosition: "center top",
                                    }}
                                    aria-hidden="true"
                                  />
                  {/* Gold accent bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-oru-gold" aria-hidden="true" />
                
                        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
                                  <div className="max-w-3xl">
                                    {/* Eyebrow */}
                                              <div className="inline-flex items-center gap-2 rounded-full bg-oru-gold/10 border border-oru-gold/30 px-4 py-1.5 mb-6">
                                                            <span className="h-2 w-2 rounded-full bg-oru-gold animate-pulse" aria-hidden="true" />
                                                            <span className="text-oru-gold text-xs font-semibold uppercase tracking-widest">
                                                                            Oral Roberts University
                                                            </span>span>
                                              </div>div>
                                  
                                              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                                                            Academic Excellence<br />
                                                            <span className="text-oru-gold">On and Off the Pitch</span>span>
                                              </h1>h1>
                                  
                                              <p className="mt-6 text-lg text-white/75 max-w-2xl leading-relaxed">
                                                            The dedicated academic portal for ORU&apos;s Men&apos;s and Women&apos;s Soccer
                                                            programs — track grades, monitor NCAA eligibility, and stay connected
                                                            with your academic advisor all in one place.
                                              </p>p>
                                  
                                              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                                            <Link
                                                                              href="/sign-up"
                                                                              className="inline-flex items-center justify-center rounded-lg bg-oru-gold px-8 py-3.5 text-base font-semibold text-oru-navy shadow-lg hover:bg-oru-gold-light transition-colors"
                                                                            >
                                                                            Get Access
                                                            </Link>Link>
                                                            <Link
                                                                              href="/sign-in"
                                                                              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors"
                                                                            >
                                                                            Sign In &rarr;
                                                            </Link>Link>
                                              </div>div>
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* ── TEAMS BANNER ── */}
                <section id="team" className="bg-oru-gold py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
                                              <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oru-navy">
                                                                            <svg
                                                                                                className="w-5 h-5 text-oru-gold"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                                aria-hidden="true"
                                                                                              >
                                                                                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                                                              <path
                                                                                                                    strokeLinecap="round"
                                                                                                                    strokeLinejoin="round"
                                                                                                                    strokeWidth="2"
                                                                                                                    d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"
                                                                                                                  />
                                                                            </svg>svg>
                                                            </div>div>
                                                            <span className="font-bold text-oru-navy text-lg">Men&apos;s Soccer</span>span>
                                                            <span className="text-oru-navy/60 text-sm font-medium">Golden Eagles</span>span>
                                              </div>div>
                                              <div className="hidden sm:block h-6 w-px bg-oru-navy/20" aria-hidden="true" />
                                              <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oru-navy">
                                                                            <svg
                                                                                                className="w-5 h-5 text-oru-gold"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                                aria-hidden="true"
                                                                                              >
                                                                                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                                                              <path
                                                                                                                    strokeLinecap="round"
                                                                                                                    strokeLinejoin="round"
                                                                                                                    strokeWidth="2"
                                                                                                                    d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"
                                                                                                                  />
                                                                            </svg>svg>
                                                            </div>div>
                                                            <span className="font-bold text-oru-navy text-lg">Women&apos;s Soccer</span>span>
                                                            <span className="text-oru-navy/60 text-sm font-medium">Golden Eagles</span>span>
                                              </div>div>
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* ── FEATURES ── */}
                <section id="features" className="py-20 bg-neutral-light">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="text-center mb-16">
                                              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                                            Built for ORU Soccer Student-Athletes
                                              </h2>h2>
                                              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                                                            Everything your coaching staff, academic advisor, and players need
                                                            to keep grades up and eligibility locked in.
                                              </p>p>
                                  </div>div>
                        
                                  <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
                                    {/* Academic Monitoring */}
                                              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-oru transition-all duration-200">
                                                            <div className="w-14 h-14 bg-oru-navy rounded-xl flex items-center justify-center mb-5">
                                                                            <svg
                                                                                                className="w-7 h-7 text-oru-gold"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                                aria-hidden="true"
                                                                                              >
                                                                                              <path
                                                                                                                    strokeLinecap="round"
                                                                                                                    strokeLinejoin="round"
                                                                                                                    strokeWidth={2}
                                                                                                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                                                                                  />
                                                                            </svg>svg>
                                                            </div>div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                                            Academic Monitoring
                                                            </h3>h3>
                                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                                            Real-time grade and attendance tracking for every player on the roster.
                                                                            AI-powered early alerts flag at-risk athletes before grades become
                                                                            an eligibility issue.
                                                            </p>p>
                                              </div>div>
                                  
                                    {/* NCAA Eligibility */}
                                              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-oru transition-all duration-200">
                                                            <div className="w-14 h-14 bg-oru-navy rounded-xl flex items-center justify-center mb-5">
                                                                            <svg
                                                                                                className="w-7 h-7 text-oru-gold"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                                aria-hidden="true"
                                                                                              >
                                                                                              <path
                                                                                                                    strokeLinecap="round"
                                                                                                                    strokeLinejoin="round"
                                                                                                                    strokeWidth={2}
                                                                                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                                                                                  />
                                                                            </svg>svg>
                                                            </div>div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                                            NCAA Eligibility
                                                            </h3>h3>
                                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                                            Automated eligibility checks against NCAA Division I requirements.
                                                                            Track credit hours, GPA thresholds, and progress-toward-degree for
                                                                            both Men&apos;s and Women&apos;s rosters.
                                                            </p>p>
                                              </div>div>
                                  
                                    {/* Team Communication */}
                                              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-oru transition-all duration-200">
                                                            <div className="w-14 h-14 bg-oru-navy rounded-xl flex items-center justify-center mb-5">
                                                                            <svg
                                                                                                className="w-7 h-7 text-oru-gold"
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
                                                                            </svg>svg>
                                                            </div>div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                                            Coach &amp; Advisor Connect
                                                            </h3>h3>
                                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                                            Direct messaging between coaches, academic advisors, and faculty.
                                                                            Schedule study hall, flag concerns, and keep everyone on the same
                                                                            page without leaving the platform.
                                                            </p>p>
                                              </div>div>
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* ── HOW IT WORKS ── */}
                <section id="how-it-works" className="py-20 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="text-center mb-16">
                                              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                                            Getting Started is Simple
                                              </h2>h2>
                                              <p className="mt-4 text-lg text-gray-600">
                                                            From roster setup to game-day eligibility — up and running in minutes.
                                              </p>p>
                                  </div>div>
                        
                                  <div className="grid md:grid-cols-3 gap-12 relative">
                                    {/* Connector line (desktop) */}
                                              <div
                                                              className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-oru-gold/30"
                                                              aria-hidden="true"
                                                            />
                                  
                                    {[
            {
                              step: "1",
                              title: "Add Your Roster",
                              body: "Import both the Men's and Women's Soccer rosters. Connect to ORU student records to auto-fill academic data.",
            },
            {
                              step: "2",
                              title: "Set Up Alerts",
                              body: "Configure GPA thresholds, credit-hour checkpoints, and eligibility windows so nothing slips through the cracks.",
            },
            {
                              step: "3",
                              title: "Track & Succeed",
                              body: "Coaches and advisors get a live dashboard. Athletes see their own progress and stay motivated to hit academic targets.",
            },
                        ].map(({ step, title, body }) => (
                                        <div key={step} className="text-center relative">
                                                        <div className="w-16 h-16 bg-oru-navy rounded-full flex items-center justify-center mx-auto mb-6 text-oru-gold text-2xl font-extrabold shadow-oru">
                                                          {step}
                                                        </div>div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>h3>
                                                        <p className="text-gray-600 leading-relaxed text-sm">{body}</p>p>
                                        </div>div>
                                      ))}
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* ── TESTIMONIALS ── */}
                <section className="py-20 bg-neutral-light">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="text-center mb-16">
                                              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                                            Trusted by the ORU Soccer Family
                                              </h2>h2>
                                              <p className="mt-4 text-lg text-gray-600">
                                                            Coaches, advisors, and student-athletes share their experience
                                              </p>p>
                                  </div>div>
                        
                                  <div className="grid md:grid-cols-3 gap-8">
                                    {[
            {
                              quote:
                                                  "Having a single dashboard for both our men\u2019s and women\u2019s rosters has transformed how I do my job. I catch eligibility issues weeks before they become a problem.",
                              name: "Coach Marcus Webb",
                              role: "Head Coach, ORU Men\u2019s Soccer",
            },
            {
                              quote:
                                                  "The automated eligibility alerts alone are worth it. Our players know exactly where they stand with NCAA requirements at all times, and so do I.",
                              name: "Dr. Alicia Torres",
                              role: "Academic Advisor, ORU Athletics",
            },
            {
                              quote:
                                                  "As a student-athlete balancing a full schedule, being able to see my GPA tracker and talk to my advisor in one app makes a huge difference.",
                              name: "Jordan Fields",
                              role: "Midfielder, ORU Women\u2019s Soccer",
            },
                        ].map(({ quote, name, role }) => (
                                        <div
                                                          key={name}
                                                          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-oru transition-all duration-200"
                                                        >
                                                        <div className="text-4xl text-oru-gold/20 font-serif leading-none mb-3" aria-hidden="true">
                                                                          &ldquo;
                                                        </div>div>
                                                        <p className="text-gray-700 leading-relaxed mb-6 text-sm">{quote}</p>p>
                                                        <div className="flex items-center gap-3">
                                                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-oru-navy to-oru-navy-light flex items-center justify-center text-oru-gold font-bold text-sm">
                                                                            {name.charAt(0)}
                                                                          </div>div>
                                                                          <div>
                                                                                              <p className="font-semibold text-gray-900 text-sm">{name}</p>p>
                                                                                              <p className="text-xs text-gray-500">{role}</p>p>
                                                                          </div>div>
                                                        </div>div>
                                        </div>div>
                                      ))}
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* ── CTA ── */}
                <section className="py-20 bg-oru-navy relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=60)", backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden="true" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-oru-gold" aria-hidden="true" />
                        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                              Ready to Elevate Golden Eagle Academics?
                                  </h2>h2>
                                  <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
                                              Join the ORU Soccer coaching and academic staff already using the
                                              portal to keep every athlete eligible and on track to graduate.
                                  </p>p>
                                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                              <Link
                                                              href="/sign-up"
                                                              className="inline-flex items-center justify-center rounded-lg bg-oru-gold px-8 py-3.5 text-base font-semibold text-oru-navy shadow-lg hover:bg-oru-gold-light transition-colors"
                                                            >
                                                            Get Access
                                              </Link>Link>
                                              <Link
                                                              href="/sign-in"
                                                              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors"
                                                            >
                                                            Sign In
                                              </Link>Link>
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* ── FOOTER ── */}
                <footer className="bg-oru-navy border-t border-white/10 text-white/60 py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
                                    {/* Brand */}
                                              <div className="col-span-2 md:col-span-1">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                            <span className="text-oru-gold font-bold text-base">ORU Soccer</span>span>
                                                                            <span className="text-white/40 text-xs">Academic Portal</span>span>
                                                            </div>div>
                                                            <p className="text-xs leading-relaxed text-white/50">
                                                                            Supporting student-athlete academic success for Oral Roberts
                                                                            University Men&apos;s and Women&apos;s Soccer programs.
                                                            </p>p>
                                              </div>div>
                                  
                                    {/* Portal */}
                                              <div>
                                                            <h4 className="text-white font-semibold text-sm mb-4">Portal</h4>h4>
                                                            <ul className="space-y-2 text-sm">
                                                                            <li>
                                                                                              <Link href="#features" className="hover:text-oru-gold transition-colors">
                                                                                                                  Features
                                                                                                </Link>Link>
                                                                            </li>li>
                                                                            <li>
                                                                                              <Link href="#how-it-works" className="hover:text-oru-gold transition-colors">
                                                                                                                  How it Works
                                                                                                </Link>Link>
                                                                            </li>li>
                                                                            <li>
                                                                                              <Link href="/sign-in" className="hover:text-oru-gold transition-colors">
                                                                                                                  Sign In
                                                                                                </Link>Link>
                                                                            </li>li>
                                                            </ul>ul>
                                              </div>div>
                                  
                                    {/* ORU Athletics */}
                                              <div>
                                                            <h4 className="text-white font-semibold text-sm mb-4">ORU Athletics</h4>h4>
                                                            <ul className="space-y-2 text-sm">
                                                                            <li>
                                                                                              <Link href="https://orueagles.com" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">
                                                                                                                  ORU Eagles
                                                                                                </Link>Link>
                                                                            </li>li>
                                                                            <li>
                                                                                              <Link href="https://oru.edu" target="_blank" rel="noopener noreferrer" className="hover:text-oru-gold transition-colors">
                                                                                                                  ORU Website
                                                                                                </Link>Link>
                                                                            </li>li>
                                                                            <li>
                                                                                              <Link href="#team" className="hover:text-oru-gold transition-colors">
                                                                                                                  Our Teams
                                                                                                </Link>Link>
                                                                            </li>li>
                                                            </ul>ul>
                                              </div>div>
                                  
                                    {/* Legal */}
                                              <div>
                                                            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>h4>
                                                            <ul className="space-y-2 text-sm">
                                                                            <li>
                                                                                              <Link href="#" className="hover:text-oru-gold transition-colors">
                                                                                                                  Privacy Policy
                                                                                                </Link>Link>
                                                                            </li>li>
                                                                            <li>
                                                                                              <Link href="#" className="hover:text-oru-gold transition-colors">
                                                                                                                  Terms of Service
                                                                                                </Link>Link>
                                                                            </li>li>
                                                            </ul>ul>
                                              </div>div>
                                  </div>div>
                        
                          {/* Bottom bar */}
                                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                                              <p className="text-xs text-white/40">
                                                            &copy; {new Date().getFullYear()} Oral Roberts University Athletics. All rights reserved.
                                              </p>p>
                                              <div className="flex gap-4">
                                                            <Link
                                                                              href="https://twitter.com/orusoccer"
                                                                              target="_blank"
                                                                              rel="noopener noreferrer"
                                                                              className="text-white/40 hover:text-oru-gold transition-colors"
                                                                              aria-label="ORU Soccer on X (Twitter)"
                                                                            >
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                                                            </svg>svg>
                                                            </Link>Link>
                                                            <Link
                                                                              href="https://instagram.com/orusoccer"
                                                                              target="_blank"
                                                                              rel="noopener noreferrer"
                                                                              className="text-white/40 hover:text-oru-gold transition-colors"
                                                                              aria-label="ORU Soccer on Instagram"
                                                                            >
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                                                            </svg>svg>
                                                            </Link>Link>
                                              </div>div>
                                  </div>div>
                        </div>div>
                </footer>footer>
          
          </div>div>
        );
}</div>
