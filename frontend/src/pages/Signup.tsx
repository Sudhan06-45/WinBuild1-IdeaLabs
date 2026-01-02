import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, Loader2, Check, X } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../context/authStore'

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', regex: /.{8,}/ },
  { id: 'upper', label: 'One uppercase letter', regex: /[A-Z]/ },
  { id: 'lower', label: 'One lowercase letter', regex: /[a-z]/ },
  { id: 'number', label: 'One number', regex: /[0-9]/ },
]

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.signup({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      })
      login(response.user, response.access_token)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Signup failed')
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
            Start Your Quality Journey
          </h1>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of teams using AI-powered quality assurance to ship better software faster.
          </p>
          
          <div className="space-y-4">
            {[
              'Automated code reviews with security checks',
              'Requirement validation & compliance scoring',
              'AI-generated test cases & coverage analysis',
              'Comprehensive SQA documentation',
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 text-white"
              >
                <div className="w-6 h-6 rounded-full bg-primary-400/30 flex items-center justify-center">
                  <Check size={14} />
                </div>
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <div className="text-primary-200 text-sm">
          © 2025 SQA Management System. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Signup Form */}
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
              <h2 className="text-2xl font-bold text-secondary-900">Create Account</h2>
              <p className="text-secondary-500 mt-1">Get started with SQA Management</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  {...register('full_name')}
                  className={`input ${errors.full_name ? 'input-error' : ''}`}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-danger-500">{errors.full_name.message}</p>
                )}
              </div>

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
                
                {/* Password Requirements */}
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req) => {
                    const met = req.regex.test(password)
                    return (
                      <div
                        key={req.id}
                        className={`flex items-center gap-2 text-xs ${
                          met ? 'text-success-600' : 'text-secondary-400'
                        }`}
                      >
                        {met ? <Check size={12} /> : <X size={12} />}
                        {req.label}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-500">{errors.confirmPassword.message}</p>
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
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
