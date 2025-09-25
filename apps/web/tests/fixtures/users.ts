export const testUsers = {
  default: {
    email: 'test.user@thinkhaven.io',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user'
  },
  premium: {
    email: 'premium.user@thinkhaven.io',
    password: 'PremiumPass456!',
    name: 'Premium User',
    role: 'premium'
  },
  demo: {
    email: 'demo.user@thinkhaven.io',
    password: 'DemoPass789!',
    name: 'Demo User',
    role: 'demo'
  },
  kevin: {
    email: 'kevin@buildingpublic.io',
    password: 'KevinDemo2025!',
    name: 'Kevin (Demo)',
    role: 'admin'
  }
}

export const generateRandomUser = () => {
  const timestamp = Date.now()
  return {
    email: `testuser${timestamp}@thinkhaven.io`,
    password: 'TestPass123!',
    name: `Test User ${timestamp}`
  }
}