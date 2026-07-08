import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { features } from '../data/page.data.tsx';
import { useAuth } from '@/contexts/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const startRoute = isAuthenticated ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Shield size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">VaultBot</span>
        </div>
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <Link to="/login">
              <button className="text-gray-700 hover:text-gray-900 font-semibold px-4 py-2.5 rounded-md transition-colors">
                Log in
              </button>
            </Link>
          )}
          <Link to={startRoute}>
            <button className="bg-blue-600 py-2.5 px-5 text-white hover:bg-blue-700 rounded-md font-semibold transition-colors">
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Save smarter.{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reach goals faster.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto"
          >
            VaultBot automates your savings by debiting your card on a schedule you choose. Create
            goals, track progress, and build your future effortlessly.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <Link to={startRoute}>
              <button className="gradient-primary text-primary-foreground px-5 py-3 rounded-md text-lg shadow-elevated">
                {isAuthenticated ? 'Go to Dashboard' : 'Start Saving Now'}
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 lg:px-12 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">Why VaultBot?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => {
              const IconComponent = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
                    <IconComponent className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 lg:px-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your savings?</h2>
          <p className="text-blue-50 mb-8">
            Join thousands of users building their financial future with SafeMoney.
          </p>
          <Link to={startRoute}>
            <button className="bg-white text-blue-600 hover:bg-blue-50 rounded-md px-8 py-4 text-lg font-semibold transition-colors shadow-md">
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Today'}
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-gray-600 border-t border-gray-200">
        © {new Date().getFullYear()} VaultBot. All rights reserved.
      </footer>
    </div>
  );
}
