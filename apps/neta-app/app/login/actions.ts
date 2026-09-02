'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth/auth'
import { callAuthAction } from '@/server/auth/action-handler'
import { getProfileByAuthUserId } from '@/server/auth/session'
import {
  failFirstFreelancerSetup,
  getFirstFreelancerSetupState,
  recordAuthAuditEvent,
  repairFirstFreelancerSetupForEmail,
} from '@/server/auth/setup'
import { getDefaultDisplayName, parseAuthCredentials } from '@/server/auth/validation'

const LOGIN_ERROR_CODE = 'auth.messages.invalidCredentials'
const SETUP_UNAVAILABLE_CODE = 'auth.messages.setupUnavailable'
const SETUP_STATE_ERROR_CODE = 'auth.messages.setupStateError'
const SIGNUP_FAILED_CODE = 'auth.messages.signupFailed'
type SignInEmailResult = Awaited<ReturnType<typeof auth.api.signInEmail>>
type SignUpEmailResult = Awaited<ReturnType<typeof auth.api.signUpEmail>>

export async function login(formData: FormData) {
  const credentials = parseAuthCredentials(formData)
  let redirectTarget = '/'
  let result: SignInEmailResult

  try {
    result = await callAuthAction<SignInEmailResult>('/sign-in/email', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: true,
    })
  } catch {
    await recordAuthAuditEvent({
      type: 'login_failed',
      email: credentials.email,
      metadata: { reason: 'invalid_credentials' },
    })
    redirect(`/login?error=true&code=${LOGIN_ERROR_CODE}`)
  }

  let profile = getProfileByAuthUserId(result.user.id)

  if (!profile) {
    repairFirstFreelancerSetupForEmail(result.user.email)
    profile = getProfileByAuthUserId(result.user.id)
  }

  if (!profile || profile.disabled) {
    await callAuthAction<{ success: boolean }>('/sign-out')
    await recordAuthAuditEvent({
      type: 'login_failed',
      authUserId: result.user.id,
      email: credentials.email,
      metadata: { reason: 'missing_or_disabled_profile' },
    })
    redirect(`/login?error=true&code=${LOGIN_ERROR_CODE}`)
  }

  redirectTarget = profile.role === 'client' ? '/portal' : '/'

  revalidatePath('/', 'layout')
  redirect(redirectTarget)
}

export async function signup(formData: FormData) {
  const setupState = await getFirstFreelancerSetupState()

  if (setupState.errorMessage) {
    redirect(`/register?error=true&code=${SETUP_STATE_ERROR_CODE}`)
  }

  if (!setupState.available) {
    redirect(`/login?error=true&code=${SETUP_UNAVAILABLE_CODE}`)
  }

  const credentials = parseAuthCredentials(formData)

  try {
    await callAuthAction<SignUpEmailResult>('/sign-up/email', {
      name: getDefaultDisplayName(credentials.email),
      email: credentials.email,
      password: credentials.password,
      rememberMe: true,
    })
  } catch {
    failFirstFreelancerSetup(credentials.email, 'better_auth_signup_failed')
    redirect(`/register?error=true&code=${SIGNUP_FAILED_CODE}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  await callAuthAction<{ success: boolean }>('/sign-out')

  revalidatePath('/', 'layout')
  return { redirectTo: '/login' } as const
}
