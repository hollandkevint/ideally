import { test, expect } from '@playwright/test';

test.describe('Landing Page - Lead Generation Structure', () => {
  test('should display frustration hook headline', async ({ page }) => {
    await page.goto('/');

    // Check for frustration hook in headline
    await expect(page.getByText(/Feeling frustrated that strategic decisions feel like guesswork/i)).toBeVisible();
    await expect(page.getByText(/even though you have data/i)).toBeVisible();
  });

  test('should show assessment CTA prominently', async ({ page }) => {
    await page.goto('/');

    // Check for primary CTA
    const ctaButton = page.getByRole('button', { name: /Take the Free Assessment Now/i }).first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();
  });

  test('should display three key value areas', async ({ page }) => {
    await page.goto('/');

    // Value proposition should be visible
    await expect(page.getByText(/This assessment will measure and improve three key areas/i)).toBeVisible();

    // All three areas should be listed
    await expect(page.getByText(/Evidence-Based Decision Making/i)).toBeVisible();
    await expect(page.getByText(/Systematic Framework Mastery/i)).toBeVisible();
    await expect(page.getByText(/Actionable Strategic Outputs/i)).toBeVisible();
  });

  test('should show creator credibility section', async ({ page }) => {
    await page.goto('/');

    // Kevin's credentials
    await expect(page.getByText(/Created by Kevin Holland/i)).toBeVisible();
    await expect(page.getByText(/Clinical Informatics Lead/i)).toBeVisible();
    await expect(page.getByText(/15\+ years/i)).toBeVisible();

    // Research stat for credibility
    await expect(page.getByText(/73% of strategic decisions lack systematic frameworks/i)).toBeVisible();
  });

  test('should display social proof testimonials', async ({ page }) => {
    await page.goto('/');

    // Testimonials section
    await expect(page.getByText(/What Strategic Thinkers Are Saying/i)).toBeVisible();

    // Stats
    await expect(page.getByText(/2,000\+/i)).toBeVisible();
    await expect(page.getByText(/4\.8\/5/i)).toBeVisible();
    await expect(page.getByText(/92%/i)).toBeVisible();
  });

  test('should navigate to assessment when CTA clicked', async ({ page }) => {
    await page.goto('/');

    // Click primary CTA
    await page.getByRole('button', { name: /Take the Free Assessment Now/i }).first().click();

    // Should land on assessment page
    await expect(page).toHaveURL('/assessment');
    await expect(page.getByText(/Strategic Thinking Assessment/i)).toBeVisible();
  });

  test('should have multiple CTAs throughout the page', async ({ page }) => {
    await page.goto('/');

    // Should have hero CTA
    const heroCTA = page.getByRole('button', { name: /Take the Free Assessment Now/i }).first();
    await expect(heroCTA).toBeVisible();

    // Should have final CTA section
    await expect(page.getByText(/Ready to discover your strategic thinking gaps/i)).toBeVisible();
  });

  test('should show trust indicators', async ({ page }) => {
    await page.goto('/');

    // Trust badges
    await expect(page.getByText(/Takes 5 minutes/i).first()).toBeVisible();
    await expect(page.getByText(/Instant results/i).first()).toBeVisible();
    await expect(page.getByText(/Completely free/i).first()).toBeVisible();
    await expect(page.getByText(/No signup required/i).first()).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Headline should still be visible
    await expect(page.getByText(/Feeling frustrated/i)).toBeVisible();

    // CTA should be visible
    await expect(page.getByRole('button', { name: /Take the Free Assessment/i }).first()).toBeVisible();
  });
});