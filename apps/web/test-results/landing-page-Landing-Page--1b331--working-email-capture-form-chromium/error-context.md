# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Strategic Workspace" [level=1] [ref=e5]
      - heading "Sign in to your account" [level=2] [ref=e6]
      - paragraph [ref=e7]: Access your AI-powered strategic thinking workspace
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Email address
        - textbox "Email address" [ref=e11]: test@example.com
      - generic [ref=e12]:
        - generic [ref=e13]: Password
        - textbox "Password" [active] [ref=e14]
      - button "Sign in" [ref=e16]
      - generic [ref=e17]:
        - paragraph [ref=e18]:
          - text: Don't have an account?
          - link "Sign up here" [ref=e19] [cursor=pointer]:
            - /url: /signup
        - paragraph [ref=e20]:
          - text: Email not confirmed?
          - link "Resend confirmation email" [ref=e21] [cursor=pointer]:
            - /url: /resend-confirmation
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28] [cursor=pointer]
  - alert [ref=e31]
```