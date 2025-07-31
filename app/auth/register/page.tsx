"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Dumbbell, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  User, 
  Mail, 
  IdCard, 
  Lock, 
  Shield, 
  GraduationCap,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  ArrowLeft,
  CreditCard as CreditCardIcon
} from "lucide-react"
import Link from "next/link"

const MEMBERSHIP_PRICES = {
  '1-trimester': { price: 150, duration: '4 months', description: 'Perfect for one trimester' },
  '3-trimester': { price: 400, duration: '12 months', description: 'Best value for full year' },
  'premium': { price: 800, duration: '12 months', description: 'All-access premium features' }
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    membershipType: "",
    phone: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    paymentMethod: "credit_card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
    billingAddress: "",
    agreeTerms: false,
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateCardNumber = (cardNumber: string) => {
    // Remove spaces and non-digits
    const cleanCard = cardNumber.replace(/\D/g, '')
    
    // Check if it's 13-19 digits (standard card length)
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      return false
    }
    
    // Simple Luhn algorithm check
    let sum = 0
    let isEven = false
    
    for (let i = cleanCard.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCard[i])
      
      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }

  const validateExpiryDate = (expiry: string) => {
    const pattern = /^(0[1-9]|1[0-2])\/\d{2}$/
    if (!pattern.test(expiry)) return false
    
    const [month, year] = expiry.split('/')
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1
    
    const expYear = parseInt(year)
    const expMonth = parseInt(month)
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false
    }
    
    return true
  }

  const validateStudentId = (studentId: string) => {
    // Must be 6-10 digits for JCU student IDs
    if (!studentId || typeof studentId !== 'string') return false
    const cleaned = studentId.trim()
    return /^\d{6,10}$/.test(cleaned)
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
    return formatted
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + (cleaned.length > 2 ? '/' + cleaned.substring(2, 4) : '')
    }
    return cleaned
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!formData.agreeTerms) {
      setError("Please agree to the terms and conditions")
      setIsLoading(false)
      return
    }

    // Validate JCU email
    if (!formData.email.endsWith('@my.jcu.edu.au')) {
      setError("Please use your official JCU email address (@my.jcu.edu.au)")
      setIsLoading(false)
      return
    }

    // Validate student ID
    if (!validateStudentId(formData.studentId)) {
      setError("Student ID must be 6-10 digits (e.g., 14742770)")
      setIsLoading(false)
      return
    }

    // Validate payment details if credit card is selected
    if (formData.paymentMethod === "credit_card") {
      if (!validateCardNumber(formData.cardNumber)) {
        setError("Please enter a valid card number")
        setIsLoading(false)
        return
      }

      if (!validateExpiryDate(formData.expiryDate)) {
        setError("Please enter a valid expiry date (MM/YY)")
        setIsLoading(false)
        return
      }

      if (!formData.cvv || formData.cvv.length < 3) {
        setError("Please enter a valid CVV")
        setIsLoading(false)
        return
      }

      if (!formData.cardHolder.trim()) {
        setError("Please enter the card holder name")
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/auth/registration-success")
      } else {
        const data = await response.json()
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setIsLoading(false)
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateExpiryDate = () => {
    if (!formData.membershipType) return null
    const today = new Date()
    const membership = MEMBERSHIP_PRICES[formData.membershipType as keyof typeof MEMBERSHIP_PRICES]
    const months = membership.duration === '4 months' ? 4 : 12
    const expiryDate = new Date(today.setMonth(today.getMonth() + months))
    return expiryDate.toLocaleDateString()
  }

  const getSelectedMembershipPrice = () => {
    if (!formData.membershipType) return null
    return MEMBERSHIP_PRICES[formData.membershipType as keyof typeof MEMBERSHIP_PRICES]
  }

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.studentId || !formData.password || !formData.confirmPassword) {
        setError("Please fill in all required fields")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }
      if (!formData.email.endsWith('@my.jcu.edu.au')) {
        setError("Please use your official JCU email address (@my.jcu.edu.au)")
        return
      }
      if (!validateStudentId(formData.studentId)) {
        setError("Student ID must be 6-10 digits (e.g., 14742770)")
        return
      }
    }
    if (currentStep === 2) {
      // Validate step 2
      if (!formData.membershipType) {
        setError("Please select a membership type")
        return
      }
    }
    if (currentStep === 3) {
      // Validate step 3 (payment)
      if (formData.paymentMethod === "credit_card") {
        if (!validateCardNumber(formData.cardNumber)) {
          setError("Please enter a valid card number")
          return
        }
        if (!validateExpiryDate(formData.expiryDate)) {
          setError("Please enter a valid expiry date (MM/YY)")
          return
        }
        if (!formData.cvv || formData.cvv.length < 3) {
          setError("Please enter a valid CVV")
          return
        }
        if (!formData.cardHolder.trim()) {
          setError("Please enter the card holder name")
          return
        }
      }
    }
    setError("")
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setError("")
    setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JCU Fitness Center</h1>
          <p className="text-gray-600">Create your student membership account</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 1, label: "Account", icon: User },
              { step: 2, label: "Membership", icon: Shield },
              { step: 3, label: "Payment", icon: CreditCardIcon }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex flex-col items-center ${index < 2 ? 'mr-8' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {currentStep > step ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-16 h-0.5 mb-6 transition-all duration-200 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registration Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Information</h2>
                    <p className="text-gray-600">Create your JCU fitness center account</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => updateFormData("firstName", e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => updateFormData("lastName", e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      JCU Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                        placeholder="your.email@my.jcu.edu.au"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">Use your official JCU email address</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                        Student ID
                      </Label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="studentId"
                          value={formData.studentId}
                          onChange={(e) => updateFormData("studentId", e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                          placeholder="e.g., 14742770"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">6-10 digits</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number <span className="text-gray-400">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData("phone", e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                          placeholder="+65 9123 4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                          placeholder="Create a password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-gray-100"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                          placeholder="Confirm your password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-gray-100"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Role and Membership Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Selection</h2>
                    <p className="text-gray-600">Choose your membership plan</p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Available Membership Plans</Label>
                    <div className="grid gap-4">
                      {Object.entries(MEMBERSHIP_PRICES).map(([type, details]) => {
                        const isSelected = formData.membershipType === type
                        
                        return (
                          <div
                            key={type}
                              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-blue-300 bg-white'
                              }`}
                              onClick={() => updateFormData("membershipType", type)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <Dumbbell className={`h-5 w-5 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <h4 className="font-bold text-lg capitalize text-gray-900">
                                      {type.replace('-', ' ')} Membership
                                    </h4>
                                  </div>
                                  <p className="text-gray-600 mb-2">{details.description}</p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>Duration: {details.duration}</span>
                                  </div>
                                </div>
                                <div className="text-right ml-6">
                                  <div className="text-3xl font-bold text-blue-600 mb-2">S${details.price}</div>
                                  <Badge variant={isSelected ? "default" : "outline"} className={isSelected ? "bg-blue-600" : ""}>
                                    {isSelected ? "Selected" : "Select"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                  </div>

                  {formData.membershipType && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800 mb-1">Membership Summary</h4>
                          <p className="text-green-700 text-sm">
                            Your membership will expire on <span className="font-medium">{calculateExpiryDate()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h2>
                    <p className="text-gray-600">Complete your membership payment</p>
                  </div>

                  {getSelectedMembershipPrice() && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <Dumbbell className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-lg font-semibold text-gray-900">
                            {formData.membershipType?.replace('-', ' ')} Membership
                          </span>
                        </div>
                        <span className="text-3xl font-bold text-blue-600">
                          S${getSelectedMembershipPrice()?.price}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Duration: {getSelectedMembershipPrice()?.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Expires: {calculateExpiryDate()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                      <Select onValueChange={(value) => updateFormData("paymentMethod", value)} value={formData.paymentMethod}>
                        <SelectTrigger className="pl-10 h-12 border-gray-200 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.paymentMethod === "credit_card" && (
                    <div className="space-y-6 p-6 bg-gray-50 rounded-xl border">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                        Credit Card Details
                      </h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardHolder" className="text-sm font-medium text-gray-700">
                          Card Holder Name
                        </Label>
                        <Input
                          id="cardHolder"
                          value={formData.cardHolder}
                          onChange={(e) => updateFormData("cardHolder", e.target.value)}
                          className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors"
                          placeholder="Full name as shown on card"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                          Card Number
                        </Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value)
                            updateFormData("cardNumber", formatted)
                          }}
                          className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          required
                        />
                        {formData.cardNumber && !validateCardNumber(formData.cardNumber) && (
                          <p className="text-xs text-red-500">Please enter a valid card number</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                            Expiry Date
                          </Label>
                          <Input
                            id="expiryDate"
                            value={formData.expiryDate}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value)
                              updateFormData("expiryDate", formatted)
                            }}
                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors"
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                          />
                          {formData.expiryDate && !validateExpiryDate(formData.expiryDate) && (
                            <p className="text-xs text-red-500">Invalid expiry date</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                            CVV
                          </Label>
                          <Input
                            id="cvv"
                            value={formData.cvv}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '')
                              updateFormData("cvv", cleaned)
                            }}
                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white transition-colors"
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress" className="text-sm font-medium text-gray-700">
                      Billing Address
                    </Label>
                    <Input
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => updateFormData("billingAddress", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Enter your full billing address"
                    />
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => updateFormData("agreeTerms", checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-gray-100">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="px-6 py-3 h-12 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-6 py-3 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="ml-auto px-8 py-3 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Complete Registration
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </form>

            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link 
                  href="/auth/login" 
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} James Cook University Singapore
          </p>
        </div>
      </div>
    </div>
  )
}
