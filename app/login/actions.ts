'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth/auth'
import { getProfileByAuthUserId } from '@/server/auth/session'
import { getFirstFreelancerSetupState, recordAuthAuditEvent } from '@/server/auth/setup'
import { getDefaultDisplayName, parseAuthCredentials } from '@/server/auth/validation'

const genericLoginError = 'E-posta veya şifre hatalı.'

export async function login(formData: FormData) {
  const credentials = parseAuthCredentials(formData)
  let redirectTarget = '/'

  try {
    const result = await auth.api.signInEmail({
      body: {
        email: credentials.email,
        password: credentials.password,
        rememberMe: true,
      },
    })
    const profile = getProfileByAuthUserId(result.user.id)

    if (!profile || profile.disabled) {
      await auth.api.signOut({ headers: await headers() })
      await recordAuthAuditEvent({
        type: 'login_failed',
        authUserId: result.user.id,
        email: credentials.email,
        metadata: { reason: 'missing_or_disabled_profile' },
      })
      redirect(`/login?error=true&message=${encodeURIComponent(genericLoginError)}`)
    }

    redirectTarget = profile.role === 'client' ? '/portal' : '/'
  } catch {
    await recordAuthAuditEvent({
      type: 'login_failed',
      email: credentials.email,
      metadata: { reason: 'invalid_credentials' },
    })
    redirect(`/login?error=true&message=${encodeURIComponent(genericLoginError)}`)
  }

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
        'Kayıt kapalı. Bu Neta kurulumunda ilk freelancer hesabı zaten oluşturulmuş.',
      )}`,
    )
  }

  const credentials = parseAuthCredentials(formData)

  try {
    await auth.api.signUpEmail({
      body: {
        name: getDefaultDisplayName(credentials.email),
        email: credentials.email,
        password: credentials.password,
        rememberMe: true,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı.'
    redirect(`/register?error=true&message=${encodeURIComponent(message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() })

  revalidatePath('/', 'layout')
  redirect('/login')
}
