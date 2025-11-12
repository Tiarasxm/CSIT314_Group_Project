import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl font-bold text-black">LOGO</div>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                href="/about"
                className="text-zinc-600 hover:text-black transition-colors"
              >
                About
              </Link>
              <Link
                href="/faqs"
                className="text-zinc-600 hover:text-black transition-colors"
              >
                FAQs
              </Link>
              <Link
                href="/news"
                className="text-zinc-600 hover:text-black transition-colors"
              >
                News
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2">
          {/* Left Column - Text Content */}
          <div className="space-y-8 py-16">
            <h1 className="text-5xl font-bold leading-tight text-black">
              Get the help you need, when you need it.
            </h1>
            <p className="text-lg text-zinc-600">
              Connect with caring CSR representatives and volunteers ready to
              support you with tailored services.
            </p>
            <div>
              <Link
                href="/register"
                className="inline-block rounded-md bg-black px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-zinc-800"
              >
                GET STARTED
              </Link>
            </div>
            <div className="pt-8">
              <p className="text-sm text-zinc-500">
                <span className="font-semibold text-black">1,340+</span>{" "}
                Requests matched monthly.
              </p>
            </div>
          </div>

          {/* Right Column - Image Placeholder */}
          <div className="hidden lg:block">
            <div className="relative h-[600px] w-full overflow-hidden rounded-lg bg-zinc-100">
              {/* Placeholder for image - two women smiling and embracing in kitchen */}
              <div className="flex h-full items-center justify-center">
                <p className="text-zinc-400">Image: Two women smiling and embracing in kitchen</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
