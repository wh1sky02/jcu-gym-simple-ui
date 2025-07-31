"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  CheckCircle, 
  Mail, 
  Phone, 
  CreditCard,
  GraduationCap,
  Sun,
  Waves,
  ArrowLeft,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

interface UserInfo {
  firstName: string
  lastName: string
  email: string
  membershipType: string
  registrationDate: string
  paymentReference: string
}

function PendingApprovalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Get user info from URL parameters (passed from login)
    const userInfoParam = searchParams.get('userInfo')
    if (userInfoParam) {
      try {
        const decodedUserInfo = JSON.parse(decodeURIComponent(userInfoParam))
        setUserInfo(decodedUserInfo)
      } catch (error) {
        console.error('Error parsing user info:', error)
      }
    }
  }, [searchParams])

  const handleRetryLogin = async () => {
    setIsRefreshing(true)
    
    // Wait a moment for visual feedback
    setTimeout(() => {
      router.push('/auth/login')
      setIsRefreshing(false)
    }, 1000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMembershipBadgeColor = (type: string) => {
    switch (type) {
      case '1-trimester': return 'bg-blue-100 text-blue-800 border-blue-300'
      case '3-trimester': return 'bg-green-100 text-green-800 border-green-300'
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'premium': return 'bg-amber-100 text-amber-800 border-amber-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ocean Wave Background */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 1200 800" className="w-full h-full absolute inset-0">
          <defs>
            <linearGradient id="waveGradientPending" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <path d="M0,400 C300,350 600,450 900,380 C1050,340 1150,420 1200,400 L1200,800 L0,800 Z" fill="url(#waveGradientPending)"/>
          <path d="M0,500 C200,480 400,520 600,500 C800,480 1000,520 1200,500 L1200,800 L0,800 Z" fill="url(#waveGradientPending)" opacity="0.5"/>
        </svg>
      </div>

      {/* Sun Icon */}
      <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg opacity-60">
        <Sun className="h-12 w-12 text-white" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* JCU Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            {/* JCU Official Logo */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mr-4 p-2">
              <svg viewBox="0 0 200 150" className="w-full h-full">
                <defs>
                  <linearGradient id="sunGradientPending" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B"/>
                    <stop offset="100%" stopColor="#D97706"/>
                  </linearGradient>
                  <linearGradient id="waveGradientPendingLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB"/>
                    <stop offset="100%" stopColor="#1D4ED8"/>
                  </linearGradient>
                </defs>
                
                {/* Sun */}
                <circle cx="150" cy="30" r="18" fill="url(#sunGradientPending)"/>
                <path d="M150,5 L155,20 L170,15 L160,25 L175,30 L160,35 L170,45 L155,40 L150,55 L145,40 L130,45 L140,35 L125,30 L140,25 L130,15 L145,20 Z" fill="url(#sunGradientPending)"/>
                
                {/* Ocean Waves */}
                <path d="M10,60 Q50,45 90,60 T170,60 L170,90 Q130,75 90,90 T10,90 Z" fill="url(#waveGradientPendingLogo)"/>
                <path d="M10,80 Q50,65 90,80 T170,80 L170,110 Q130,95 90,110 T10,110 Z" fill="url(#waveGradientPendingLogo)" opacity="0.8"/>
                <path d="M10,100 Q50,85 90,100 T170,100 L170,130 Q130,115 90,130 T10,130 Z" fill="url(#waveGradientPendingLogo)" opacity="0.6"/>
                
                {/* JCU Letters */}
                <text x="20" y="45" fontSize="24" fontWeight="bold" fill="#1F2937">JCU</text>
              </svg>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-xl mr-4">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-blue-900">JAMES COOK</h1>
              <h2 className="text-xl font-bold text-blue-900">UNIVERSITY</h2>
              <p className="text-blue-700 font-semibold text-sm">SINGAPORE</p>
            </div>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-full mb-2"></div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">Fitness Center</h3>
        </div>

        <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border border-amber-200">
          <CardHeader className="space-y-1 text-center bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-3">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold">Account Pending Approval</CardTitle>
            <CardDescription className="text-amber-100">
              Your registration has been received and is under review
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 p-8">
            {/* Status Alert */}
            <Alert className="border-amber-300 bg-amber-50">
              <CheckCircle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Registration Complete!</strong> Your application is being reviewed by our fitness center administration team.
              </AlertDescription>
            </Alert>

            {/* User Information */}
            {userInfo && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Registration Details</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Applicant</p>
                        <p className="font-semibold text-blue-900">
                          {userInfo.firstName} {userInfo.lastName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-green-700">{userInfo.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Membership</p>
                        <Badge className={getMembershipBadgeColor(userInfo.membershipType)}>
                          {userInfo.membershipType}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Submitted</p>
                        <p className="font-semibold text-amber-700">
                          {formatDate(userInfo.registrationDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {userInfo.paymentReference && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1">Payment Reference</p>
                    <p className="font-mono font-semibold text-blue-900">{userInfo.paymentReference}</p>
                    <p className="text-xs text-blue-500 mt-1">Keep this reference for your records</p>
                  </div>
                )}
              </div>
            )}

            {/* What happens next */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-gray-700">Our admin team reviews your application and payment details</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-gray-700">You'll receive an email notification once approved</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-gray-700">Start booking gym sessions and enjoying our facilities!</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Email Support</p>
                    <a href="mailto:support@fitness.jcu.edu.au" className="font-semibold text-blue-900 hover:underline">
                      support@fitness.jcu.edu.au
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Phone Support</p>
                    <a href="tel:+6565767000" className="font-semibold text-blue-900 hover:underline">
                      +65 6576 7000
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleRetryLogin}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 font-semibold"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Status Again
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                asChild
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 h-12 font-semibold"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-600">
          <p className="text-sm font-medium">© {new Date().getFullYear()} James Cook University Singapore</p>
          <p className="text-xs">Fitness Center Management System</p>
        </div>
      </div>
    </div>
  )
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PendingApprovalContent />
    </Suspense>
  )
} 