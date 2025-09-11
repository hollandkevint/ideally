// Google Identity Services types for One-Tap signin
export interface GoogleCredentialResponse {
  credential: string
  select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'btn_add_session' | 'btn_confirm_add_session'
  clientId?: string
}

export interface GoogleOneTapConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: 'signin' | 'signup' | 'use'
  nonce?: string
  use_fedcm_for_prompt?: boolean
}

export interface GoogleAccounts {
  id: {
    initialize: (config: GoogleOneTapConfig) => void
    prompt: (momentNotification?: (notification: PromptMomentNotification) => void) => void
    renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void
    disableAutoSelect: () => void
    storeCredential: (credential: { id: string; password: string }) => void
    cancel: () => void
    onGoogleLibraryLoad: () => void
    revoke: (hint: string, callback: (done: RevocationResponse) => void) => void
  }
}

export interface GoogleButtonConfig {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: string | number
  locale?: string
  click_listener?: () => void
}

export interface PromptMomentNotification {
  isDisplayMoment: () => boolean
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () => 'browser_not_supported' | 'invalid_client' | 'missing_client_id' | 'opt_out_or_no_session' | 'secure_http_required' | 'suppressed_by_user' | 'unregistered_origin' | 'unknown_reason'
  isSkippedMoment: () => boolean
  getSkippedReason: () => 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed'
  isDismissedMoment: () => boolean
  getDismissedReason: () => 'credential_returned' | 'cancel_called' | 'flow_restarted'
  getMomentType: () => 'display' | 'skipped' | 'dismissed'
}

export interface RevocationResponse {
  successful: boolean
  error?: string
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts
    }
    onGoogleLibraryLoad?: () => void
  }
}

// JWT payload structure from Google ID token
export interface GoogleJWTPayload {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
  iat: number
  exp: number
  nonce?: string
}