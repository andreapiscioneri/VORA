export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
}

export const ORG_ROLES = ['owner', 'admin', 'member'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export interface Organization {
  id: string
  name: string
  slug: string
  // The WhatsApp Business phone number ID this org has connected (Meta's
  // Cloud API sends `entry[].changes[].value.metadata.phone_number_id` on
  // every inbound webhook payload) — used to route an inbound message to
  // the right tenant. Null until an org owner configures their own
  // WhatsApp Business number; see docs/SECURITY.md for the setup gap.
  whatsappPhoneNumberId: string | null
  createdAt: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: OrgRole
  createdAt: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  organizationId: string
  organizationName: string
  role: OrgRole
}
