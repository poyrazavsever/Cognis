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

const genericLoginError = 'E-posta veya \u015fifre hatal\u0131.'
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
    redirect(`/login?error=true&message=${encodeURIComponent(genericLoginError)}`)
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
    redirect(`/login?error=true&message=${encodeURIComponent(genericLoginError)}`)
  }

  redirectTarget = profile.role === 'client' ? '/portal' : '/'

  revalidatePath('/', 'layout')
  redirect(redirectTarget)
}

export async function signup(formData: FormData) {
  const setupState = await getFirstFreelancerSetupState()

  if (setupState.errorMessage) {
    redirect(`/register?error=true&message=${encodeURIComponent(setupState.errorMessage)}`)
  }

  if (!setupState.available) {
    redirect(
      `/login?error=true&message=${encodeURIComponent(
        'Kay\u0131t kapal\u0131. Bu Neta kurulumunda ilk freelancer hesab\u0131 zaten olu\u015fturulmu\u015f.',
      )}`,
    )
  }

  const credentials = parseAuthCredentials(formData)

  try {
    await callAuthAction<SignUpEmailResult>('/sign-up/email', {
      name: getDefaultDisplayName(credentials.email),
      email: credentials.email,
      password: credentials.password,
      rememberMe: true,
    })
  } catch (error) {
    failFirstFreelancerSetup(credentials.email, 'better_auth_signup_failed')
    const message = error instanceof Error ? error.message : 'Kullan\u0131c\u0131 olu\u015fturulamad\u0131.'
    redirect(`/register?error=true&message=${encodeURIComponent(message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  await callAuthAction<{ success: boolean }>('/sign-out')

  revalidatePath('/', 'layout')
  redirect('/login')
}
