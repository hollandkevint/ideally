'use client'

import { useAuth } from '../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lightbulb, Target, FileText, Menu, X } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-muted">Loading ThinkHaven...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="font-bold text-xl text-foreground">
              ThinkHaven
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#product" className="text-muted hover:text-foreground transition-colors">
                Product
              </a>
              <a href="/demo" className="text-muted hover:text-foreground transition-colors">
                Demo
              </a>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
              >
                Log in
              </Button>
              <Button
                onClick={() => router.push('/signup')}
              >
                Get started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="text-muted hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#product"
                  className="text-muted hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Product
                </a>
                <a
                  href="/demo"
                  className="text-muted hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Demo
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Log in
                  </Button>
                  <Button
                    onClick={() => router.push('/signup')}
                    className="w-full"
                  >
                    Get started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <h1 className="text-[2.75rem] md:text-[3.5rem] font-bold text-foreground leading-tight mb-6">
                Think strategically.
                <br />
                Build with clarity.
              </h1>
              <p className="text-lg md:text-xl text-muted mb-8 leading-relaxed">
                ThinkHaven helps product leaders transform ideas into actionable strategies using AI-powered analysis and the proven BMad Method framework.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/signup')}
                  className="text-base"
                >
                  Get started free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/demo')}
                  className="text-base"
                >
                  See how it works
                </Button>
              </div>
            </div>

            {/* Right: Visual Placeholder */}
            <div className="hidden md:block">
              <div className="bg-surface border border-border rounded-xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center text-muted">
                  <Lightbulb size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Product mockup placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 bg-surface border-y border-border">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="text-center">
            <p className="text-sm text-muted mb-8">
              Trusted by strategic thinkers at innovative companies
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
              {/* Placeholder for company logos */}
              <div className="text-muted font-semibold text-lg">Company 1</div>
              <div className="text-muted font-semibold text-lg">Company 2</div>
              <div className="text-muted font-semibold text-lg">Company 3</div>
              <div className="text-muted font-semibold text-lg">Company 4</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Strategic thinking made systematic
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              From initial concept to detailed execution plan, ThinkHaven guides you through every step with AI-powered insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI-Guided Analysis */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="text-primary" size={24} />
                </div>
                <CardTitle className="text-xl">AI-Guided Analysis</CardTitle>
                <CardDescription className="text-base">
                  Mary AI walks you through structured frameworks, asking the right questions to uncover strategic insights you might have missed.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2: BMad Method Framework */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="text-primary" size={24} />
                </div>
                <CardTitle className="text-xl">BMad Method Framework</CardTitle>
                <CardDescription className="text-base">
                  Proven systematic approach to strategic thinking. Transform gut feelings into evidence-based decisions with clear documentation.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3: Professional Documents */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="text-primary" size={24} />
                </div>
                <CardTitle className="text-xl">Professional Documents</CardTitle>
                <CardDescription className="text-base">
                  Export polished strategy documents, feature briefs, and lean canvas reports that stakeholders understand and executives approve.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section id="product" className="py-24 md:py-32 bg-surface">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your strategic workspace
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Dual-pane interface combines AI conversation with visual canvas for comprehensive strategy development.
            </p>
          </div>

          {/* Product Screenshot/Demo */}
          <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden max-w-[1000px] mx-auto">
            <div className="aspect-video bg-surface flex items-center justify-center p-12">
              <div className="text-center text-muted">
                <div className="grid grid-cols-2 gap-4 max-w-2xl">
                  <div className="bg-background border border-border rounded-lg p-8">
                    <p className="text-sm font-semibold mb-2">AI Chat</p>
                    <p className="text-xs">Strategic conversation with Mary AI</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-8">
                    <p className="text-sm font-semibold mb-2">Visual Canvas</p>
                    <p className="text-xs">Interactive diagrams and frameworks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="bg-foreground text-background rounded-2xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to think strategically?
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Start your first strategic session for free. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push('/signup')}
                className="text-base bg-background text-foreground hover:bg-background/90"
              >
                Get started free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/demo')}
                className="text-base border-background/20 text-background hover:bg-background/10"
              >
                View demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-[var(--container-landing)] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Footer Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
              <a href="/demo" className="text-muted hover:text-foreground transition-colors">
                Demo
              </a>
              <a href="#" className="text-muted hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="mailto:kevin@thinkhaven.co" className="text-muted hover:text-foreground transition-colors">
                Contact
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-muted">
              &copy; 2025 ThinkHaven. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
