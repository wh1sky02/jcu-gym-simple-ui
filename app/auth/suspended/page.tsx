"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  XCircle, 
  Mail, 
  Phone, 
  GraduationCap,
  Sun,
  ArrowLeft,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

export default function SuspendedAccountPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Design */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 1200 800" className="w-full h-full absolute inset-0">
          <defs>
            <linearGradient id="waveGradientSuspended" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <path d="M0,400 C300,350 600,450 900,380 C1050,340 1150,420 1200,400 L1200,800 L0,800 Z" fill="url(#waveGradientSuspended)"/>
          <path d="M0,500 C200,480 400,520 600,500 C800,480 1000,520 1200,500 L1200,800 L0,800 Z" fill="url(#waveGradientSuspended)" opacity="0.5"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* JCU Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mr-4 p-2">
              <svg viewBox="0 0 200 150" className="w-full h-full">
                <defs>
                  <linearGradient id="sunGradientSuspended" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B"/>
                    <stop offset="100%" stopColor="#D97706"/>
                  </linearGradient>
                  <linearGradient id="waveGradientSuspendedLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB"/>
                    <stop offset="100%" stopColor="#1D4ED8"/>
                  </linearGradient>
                </defs>
                
                <circle cx="150" cy="30" r="18" fill="url(#sunGradientSuspended)"/>
                <path d="M150,5 L155,20 L170,15 L160,25 L175,30 L160,35 L170,45 L155,40 L150,55 L145,40 L130,45 L140,35 L125,30 L140,25 L130,15 L145,20 Z" fill="url(#sunGradientSuspended)"/>
                
                <path d="M10,60 Q50,45 90,60 T170,60 L170,90 Q130,75 90,90 T10,90 Z" fill="url(#waveGradientSuspendedLogo)"/>
                <path d="M10,80 Q50,65 90,80 T170,80 L170,110 Q130,95 90,110 T10,110 Z" fill="url(#waveGradientSuspendedLogo)" opacity="0.8"/>
                <path d="M10,100 Q50,85 90,100 T170,100 L170,130 Q130,115 90,130 T10,130 Z" fill="url(#waveGradientSuspendedLogo)" opacity="0.6"/>
                
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

        <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border border-red-200">
          <CardHeader className="space-y-1 text-center bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-3">
              <XCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Account Suspended</CardTitle>
            <CardDescription className="text-red-100">
              Your fitness center access has been temporarily suspended
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 p-8">
            {/* Status Alert */}
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Access Suspended:</strong> Your account has been temporarily suspended. Please contact our support team to resolve this issue.
              </AlertDescription>
            </Alert>

            {/* Common Reasons */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Common Reasons for Suspension</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">Violation of gym rules or policies</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">Unpaid dues or outstanding fees</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">Safety or security concerns</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-gray-700">Administrative review in progress</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">How to Resolve This</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-gray-700">Contact our support team using the information below</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-gray-700">Provide your student ID and explain your situation</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-gray-700">Follow any instructions provided by our support team</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <h4 className="text-lg font-semibold text-orange-900 mb-3">Contact Support</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600">Email Support</p>
                    <a href="mailto:support@fitness.jcu.edu.au" className="font-semibold text-orange-900 hover:underline">
                      support@fitness.jcu.edu.au
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600">Phone Support</p>
                    <a href="tel:+6565767000" className="font-semibold text-orange-900 hover:underline">
                      +65 6576 7000
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-orange-700">
                <strong>Support Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM SGT
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                asChild
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-12 font-semibold"
              >
                <a href="mailto:support@fitness.jcu.edu.au">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </a>
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