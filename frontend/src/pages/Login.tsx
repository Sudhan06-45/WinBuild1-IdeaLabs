import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../context/authStore'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      login(response.user, response.access_token)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-white" />
            <span className="text-2xl font-bold text-white">SQA Management</span>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            AI-Powered Software Quality Assurance
          </h1>
          <p className="text-primary-100 text-lg">
            Automate code reviews, validate requirements, generate tests, and ensure compliance across your entire SDLC.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">50%</div>
              <div className="text-primary-100 text-sm">Faster Releases</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">3x</div>
              <div className="text-primary-100 text-sm">Quality Coverage</div>
            </div>
          </div>
        </motion.div>
        
        <div className="text-primary-200 text-sm">
          © 2025 SQA Management System. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-secondary-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Shield className="w-10 h-10 text-primary-600" />
            <span className="text-2xl font-bold text-secondary-900">SQA System</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-secondary-900">Welcome Back</h2>
              <p className="text-secondary-500 mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full h-12 text-base"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
