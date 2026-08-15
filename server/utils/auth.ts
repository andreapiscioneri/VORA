import type { H3Event } from 'h3'
import { randomBytes } from 'node:crypto'
import { getDb } from './firebase'
import type { User, Organization, OrganizationMember, OrgRole } from '~/shared/types/user'

/** Every protected API route calls this to get the caller's organization,
 * scoping all Firestore reads/writes so tenants never see each other's data. */
export async function requireOrgId(event: H3Event): Promise<string> {
  const { user } = await requireUserSession(event)
  return user.organizationId
}

/** For routes restricted to specific roles within the caller's own
 * organization (e.g. employee management, leave/expense approval) —
 * this is *within-tenant* authorization, layered on top of the
 * *between-tenant* isolation `requireOrgId` already provides. Returns
 * the organizationId (same shape as requireOrgId) so call sites don't
 * need both. */
export async function requireRole(event: H3Event, allowed: OrgRole[]): Promise<string> {
  const { user } = await requireUserSession(event)
  if (!allowed.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions for this action' })
  }
  return user.organizationId
}

const USERS = 'users'
const ORGS = 'organizations'
const MEMBERS = 'organizationMembers'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'org'
}

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const snap = await getDb().collection(USERS).where('email', '==', email.toLowerCase()).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    email: data.email,
    name: data.name,
    emailVerified: data.emailVerified ?? false,
    createdAt: data.createdAt,
    passwordHash: data.passwordHash,
  }
}

export async function findUserById(id: string): Promise<User | null> {
  const doc = await getDb().collection(USERS).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return { id: doc.id, email: data.email, name: data.name, emailVerified: data.emailVerified ?? false, createdAt: data.createdAt }
}

export async function markEmailVerified(userId: string): Promise<void> {
  await getDb().collection(USERS).doc(userId).update({ emailVerified: true })
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await getDb().collection(USERS).doc(userId).update({ passwordHash })
}

export async function createUserWithOrganization(
  name: string,
  email: string,
  password: string,
  organizationName: string,
): Promise<{ user: User; organization: Organization; membership: OrganizationMember }> {
  const existing = await findUserByEmail(email)
  if (existing) throw new Error('auth.emailTaken')

  const db = getDb()
  const now = new Date().toISOString()
  const passwordHash = await hashPassword(password)

  const userRef = await db.collection(USERS).add({
    name,
    email: email.toLowerCase(),
    passwordHash,
    emailVerified: false,
    createdAt: now,
  })

  let slug = slugify(organizationName)
  const slugSnap = await db.collection(ORGS).where('slug', '==', slug).limit(1).get()
  if (!slugSnap.empty) slug = `${slug}-${userRef.id.slice(0, 6)}`

  const orgRef = await db.collection(ORGS).add({ name: organizationName, slug, whatsappPhoneNumberId: null, createdAt: now })
  const memberRef = await db.collection(MEMBERS).add({
    organizationId: orgRef.id,
    userId: userRef.id,
    role: 'owner' satisfies OrgRole,
    createdAt: now,
  })

  return {
    user: { id: userRef.id, name, email: email.toLowerCase(), emailVerified: false, createdAt: now },
    organization: { id: orgRef.id, name: organizationName, slug, whatsappPhoneNumberId: null, createdAt: now },
    membership: { id: memberRef.id, organizationId: orgRef.id, userId: userRef.id, role: 'owner', createdAt: now },
  }
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const found = await findUserByEmail(email)
  if (!found) return null
  const valid = await verifyPassword(found.passwordHash, password)
  if (!valid) return null
  return { id: found.id, email: found.email, name: found.name, emailVerified: found.emailVerified, createdAt: found.createdAt }
}

export async function getPrimaryMembership(userId: string): Promise<(OrganizationMember & { organizationName: string }) | null> {
  const db = getDb()
  const snap = await db.collection(MEMBERS).where('userId', '==', userId).orderBy('createdAt', 'asc').limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data()
  const orgDoc = await db.collection(ORGS).doc(data.organizationId).get()
  return {
    id: doc.id,
    organizationId: data.organizationId,
    userId: data.userId,
    role: data.role,
    createdAt: data.createdAt,
    organizationName: orgDoc.data()?.name ?? '',
  }
}

// Routes an inbound WhatsApp webhook payload to the tenant that owns the
// receiving phone number. Returns null both when no org has connected that
// number yet and when the field was never set — callers should ack the
// webhook (200) either way rather than erroring, per Meta's retry policy.
export async function findOrganizationByWhatsAppPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  const snap = await getDb().collection(ORGS).where('whatsappPhoneNumberId', '==', phoneNumberId).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].id
}

export async function listOrganizationMemberUserIds(organizationId: string): Promise<string[]> {
  const snap = await getDb().collection(MEMBERS).where('organizationId', '==', organizationId).get()
  return snap.docs.map((doc) => doc.data().userId as string)
}

// OAuth sign-in: an existing account signs straight in (their email is
// already verified by definition — Google/Microsoft vouch for it, so we
// mark it verified here too, closing the loop with the password-based
// verification flow rather than leaving an OAuth user stuck behind the
// "verify your email" banner). A brand-new OAuth sign-in creates a fresh
// user + organization, exactly like registerering — with a random,
// never-shared password hash, since the account has no password the user
// will ever type (they can still request a reset later if they want one).
export async function findOrCreateOAuthUser(
  email: string,
  name: string
): Promise<{ user: User; membership: OrganizationMember & { organizationName: string } }> {
  const existing = await findUserByEmail(email)

  if (existing) {
    if (!existing.emailVerified) await markEmailVerified(existing.id)
    const membership = await getPrimaryMembership(existing.id)
    if (!membership) throw new Error('auth.noOrganization')
    return {
      user: { id: existing.id, email: existing.email, name: existing.name, emailVerified: true, createdAt: existing.createdAt },
      membership,
    }
  }

  const randomPassword = randomBytes(32).toString('hex')
  const created = await createUserWithOrganization(name, email, randomPassword, `${name}'s Organization`)
  await markEmailVerified(created.user.id)

  return {
    user: { ...created.user, emailVerified: true },
    membership: { ...created.membership, organizationName: created.organization.name },
  }
}
