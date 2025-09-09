import { test, expect } from '@playwright/test'

test.describe('Authentication Flow E2E Tests', () => {
  const TEST_USER_EMAIL = 'test@example.com'
  const TEST_USER_PASSWORD = 'testpassword123'

  test.beforeEach(async ({ page }) => {
    // Start on home page
    await page.goto('/')
  })

  test('login page renders correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Thinkhaven')
    await expect(page.locator('h2')).toContainText('Sign in to your account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.getByText('Continue with Google')).toBeVisible()
  })

  test('navigation shows login/signup buttons when unauthenticated', async ({ page }) => {
    // Check navigation for unauthenticated state
    await expect(page.getByText('Login')).toBeVisible()
    await expect(page.getByText('Sign Up')).toBeVisible()
  })

  test('login form validation works', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Check HTML5 validation (empty email field should prevent submission)
    await expect(page.locator('input[name="email"]')).toBeFocused()
  })

  test('navigation login button navigates to login page', async ({ page }) => {
    // Click login button in navigation
    await page.getByText('Login').click()
    
    // Should navigate to login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h2')).toContainText('Sign in to your account')
  })

  test('navigation signup button navigates to signup page', async ({ page }) => {
    // Click signup button in navigation
    await page.getByText('Sign Up').click()
    
    // Should navigate to signup page
    await expect(page).toHaveURL('/signup')
    await expect(page.locator('h2')).toContainText('Create your account')
  })

  test('login page links work correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Test sign up link
    await page.getByText('Sign up here').click()
    await expect(page).toHaveURL('/signup')
    
    // Go back to login
    await page.goto('/login')
    
    // Test resend confirmation link
    await page.getByText('Resend confirmation email').click()
    await expect(page).toHaveURL('/resend-confirmation')
  })

  test('demo page shows auth-aware messaging', async ({ page }) => {
    await page.goto('/demo')
    
    // Should show unauthenticated messaging
    await expect(page.getByText('No signup required')).toBeVisible()
    await expect(page.getByText('Start Free Strategic Session')).toBeVisible()
  })

  test('login form shows loading states', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in form
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL)
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD)
    
    // Click submit and check for loading state
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Should show loading text (will fail auth but should show loading first)
    await expect(page.getByText('Signing in...')).toBeVisible()
  })

  test('google oauth button shows loading state', async ({ page }) => {
    await page.goto('/login')
    
    // Click Google OAuth button
    await page.getByText('Continue with Google').click()
    
    // Should show loading state briefly
    await expect(page.getByText('Signing in with Google...')).toBeVisible()
  })

  test('invalid login shows error message', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.locator('input[name="email"]').fill('invalid@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    
    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Should show error message
    await expect(page.getByText(/Invalid email or password/)).toBeVisible()
  })

  test('signup page renders and works', async ({ page }) => {
    await page.goto('/signup')
    
    // Check page elements
    await expect(page.locator('h2')).toContainText('Create your account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    
    // Test password validation
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('short')
    await page.locator('input[name="confirmPassword"]').fill('short')
    
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible()
  })

  test('password confirmation validation works', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill with mismatched passwords
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    await page.locator('input[name="confirmPassword"]').fill('password456')
    
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/login')
    
    // Form should still be visible and functional on mobile
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.getByText('Continue with Google')).toBeVisible()
    
    // Test signup page mobile responsive
    await page.goto('/signup')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    
    // Test demo page mobile responsive
    await page.goto('/demo')
    await expect(page.getByText('Strategic Analysis Demo')).toBeVisible()
  })

  test('demo functionality remains accessible', async ({ page }) => {
    // Demo should be accessible without authentication
    await page.goto('/demo')
    
    // Should show demo scenarios
    await expect(page.getByText('Strategic Analysis Demo')).toBeVisible()
    await expect(page.getByText('Demo 1')).toBeVisible()
    
    // Should be able to click into a demo
    await page.getByText('Demo 1').first().click()
    await expect(page).toHaveURL(/\/demo\/0/)
  })
})