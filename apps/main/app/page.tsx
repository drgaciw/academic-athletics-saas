import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-light">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a3a52] to-[#0d1f2d] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
              Empowering Student-Athletes,
              <br />
              Simplifying Compliance
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto">
              The all-in-one platform to manage academic progress, ensure
              eligibility, and foster communication for your athletic
              department.
            </p>
            <div className="mt-10">
              <Link
                href="/sign-up"
                className="inline-block rounded-md bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-primary/90 transition-colors"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 uppercase tracking-wide mb-8">
            Trusted by top universities and athletic programs
          </p>
          <div className="flex justify-center items-center gap-12 flex-wrap opacity-40">
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need for Academic Success
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools for student-athlete academic support, NCAA
              compliance management for student-athletes, coaches, and
              administrators.
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
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Academic Monitoring
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track grades, attendance, and progress with tools & AI to help
                students stay on track to support student-athletes in their
                academic journey.
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
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Eligibility Tracking
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Stay ahead of NCAA and conference requirements with automated
                eligibility checks and compliance alerts.
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
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Seamless Communication
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connect coaches, students, advisors, and faculty through
                integrated messaging and collaboration tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A simplified journey to student-athlete academic success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Onboard Your Team
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Invite student-athletes and academic support staff. Add student
                information and set up your program.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Track Progress
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Set up your academic monitoring and eligibility alerts to
                automate compliance and progress tracking.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Achieve Success
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Empower student-athletes to excel academically with a
                streamlined and supportive academic support system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              What Our Partners Are Saying
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Hear from athletic directors and academic coordinators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                &quot;This platform has been a game-changer for our athletic
                department. We can now track student progress, ensure
                eligibility, and communicate with coaches and faculty all in one
                place.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Jenkins</p>
                  <p className="text-sm text-gray-600">
                    Athletic Director, State University
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                &quot;The system automates tedious tasks, freeing up our staff
                to focus on what matters most: student success. The eligibility
                tracking alone has saved us countless hours.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">Mike Thompson</p>
                  <p className="text-sm text-gray-600">
                    Academic Coordinator, Tech College
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                &quot;As an academic advisor, having all student information in
                one place has been invaluable. I can easily track progress and
                identify students who need extra support.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">Emily Rodriguez</p>
                  <p className="text-sm text-gray-600">
                    Academic Advisor, Metro University
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Elevate Your Program?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            See how the Athletic Academics Hub can streamline your
            student-athlete support. Take the first step to simplifying athletic
            academic today.
          </p>
          <Link
            href="/sign-up"
            className="inline-block rounded-md bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-primary/90 transition-colors"
          >
            Request a Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                Athletic Academics Hub
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Empowering Student-Athletes through comprehensive academic
                support and compliance management.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
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
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
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
