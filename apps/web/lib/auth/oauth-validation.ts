/**
 * OAuth Configuration Validation Utilities
 *
 * Validates OAuth configuration and environment settings to prevent
 * common configuration issues that can cause PKCE verification failures.
 */

export interface OAuthValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  environment: 'development' | 'production' | 'test'
}

export interface OAuthConfig {
  supabaseUrl?: string
  supabaseAnonKey?: string
  appUrl?: string
  googleClientId?: string
}

export class OAuthValidator {
  /**
   * Validate OAuth configuration for the current environment
   */
  static validateConfiguration(): OAuthValidationResult {
    const result: OAuthValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      environment: this.getEnvironment()
    }

    const config = this.getOAuthConfig()

    // Validate required environment variables
    this.validateEnvironmentVariables(config, result)

    // Validate URLs and domains
    this.validateUrls(config, result)

    // Validate environment-specific settings
    this.validateEnvironmentSpecific(config, result)

    // Check for common misconfigurations
    this.checkCommonIssues(config, result)

    result.isValid = result.errors.length === 0

    return result
  }

  private static getEnvironment(): 'development' | 'production' | 'test' {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development'
      }
      if (window.location.hostname.includes('thinkhaven.co')) {
        return 'production'
      }
    }

    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'test') return 'test'
    if (nodeEnv === 'production') return 'production'
    return 'development'
  }

  private static getOAuthConfig(): OAuthConfig {
    return {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    }
  }

  private static validateEnvironmentVariables(config: OAuthConfig, result: OAuthValidationResult): void {
    if (!config.supabaseUrl) {
      result.errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
    }

    if (!config.supabaseAnonKey) {
      result.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    }

    if (result.environment === 'production' && !config.appUrl) {
      result.warnings.push('NEXT_PUBLIC_APP_URL should be set in production')
    }

    if (!config.googleClientId) {
      result.warnings.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set - Google OAuth will not work')
    }
  }

  private static validateUrls(config: OAuthConfig, result: OAuthValidationResult): void {
    // Validate Supabase URL format
    if (config.supabaseUrl) {
      try {
        const url = new URL(config.supabaseUrl)
        if (!url.hostname.includes('supabase')) {
          result.warnings.push('Supabase URL does not appear to be a valid Supabase project URL')
        }
        if (url.protocol !== 'https:') {
          result.errors.push('Supabase URL must use HTTPS')
        }
      } catch {
        result.errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
      }
    }

    // Validate app URL if provided
    if (config.appUrl) {
      try {
        const url = new URL(config.appUrl)
        if (result.environment === 'production' && url.protocol !== 'https:') {
          result.errors.push('App URL must use HTTPS in production')
        }
      } catch {
        result.errors.push('NEXT_PUBLIC_APP_URL is not a valid URL')
      }
    }

    // Check redirect URL consistency
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin
      const expectedRedirectUrl = `${currentOrigin}/auth/callback`

      result.warnings.push(`OAuth redirect URL should be configured as: ${expectedRedirectUrl}`)
    }
  }

  private static validateEnvironmentSpecific(config: OAuthConfig, result: OAuthValidationResult): void {
    if (result.environment === 'production') {
      // Production-specific validations
      if (typeof window !== 'undefined') {
        if (window.location.protocol !== 'https:') {
          result.errors.push('Production site must use HTTPS for OAuth to work properly')
        }

        if (!window.location.hostname.includes('thinkhaven.co')) {
          result.warnings.push('Production site should be hosted on thinkhaven.co domain')
        }
      }

      // Check for development URLs in production
      if (config.supabaseUrl?.includes('localhost')) {
        result.errors.push('Production should not use localhost Supabase URL')
      }
    }

    if (result.environment === 'development') {
      // Development-specific validations
      if (config.appUrl && !config.appUrl.includes('localhost')) {
        result.warnings.push('Development environment should typically use localhost URLs')
      }
    }
  }

  private static checkCommonIssues(config: OAuthConfig, result: OAuthValidationResult): void {
    // Check for placeholder values
    if (config.supabaseUrl?.includes('your_supabase') || config.supabaseUrl?.includes('example')) {
      result.errors.push('Supabase URL appears to be a placeholder value')
    }

    if (config.supabaseAnonKey?.includes('your_supabase') || config.supabaseAnonKey?.includes('example')) {
      result.errors.push('Supabase anon key appears to be a placeholder value')
    }

    // Check for common copy-paste errors
    if (config.supabaseAnonKey?.startsWith('http')) {
      result.errors.push('Supabase anon key should not be a URL')
    }

    if (config.supabaseUrl && !config.supabaseUrl.includes('.')) {
      result.errors.push('Supabase URL appears to be malformed')
    }

    // Check cookie domain compatibility
    if (result.environment === 'production' && typeof window !== 'undefined') {
      const currentDomain = window.location.hostname
      if (!currentDomain.includes('thinkhaven.co')) {
        result.warnings.push('Cookie domain settings may need adjustment for this hostname')
      }
    }
  }

  /**
   * Get environment-specific redirect URL
   */
  static getRedirectUrl(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }

    const env = this.getEnvironment()
    switch (env) {
      case 'production':
        return 'https://www.thinkhaven.co/auth/callback'
      case 'development':
        return 'http://localhost:3000/auth/callback'
      default:
        return 'http://localhost:3000/auth/callback'
    }
  }

  /**
   * Log validation results for debugging
   */
  static logValidationResults(result: OAuthValidationResult): void {
    console.group(`OAuth Configuration Validation (${result.environment})`)

    if (result.isValid) {
      console.log('✅ OAuth configuration is valid')
    } else {
      console.error('❌ OAuth configuration has errors')
    }

    if (result.errors.length > 0) {
      console.group('❌ Errors:')
      result.errors.forEach(error => console.error(`  • ${error}`))
      console.groupEnd()
    }

    if (result.warnings.length > 0) {
      console.group('⚠️ Warnings:')
      result.warnings.forEach(warning => console.warn(`  • ${warning}`))
      console.groupEnd()
    }

    console.log(`Redirect URL: ${this.getRedirectUrl()}`)
    console.groupEnd()
  }

  /**
   * Run validation and log results (for debugging)
   */
  static validateAndLog(): OAuthValidationResult {
    const result = this.validateConfiguration()
    this.logValidationResults(result)
    return result
  }
}