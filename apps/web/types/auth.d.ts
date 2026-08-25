import type { SessionUser } from '~/shared/types/user'

declare module '#auth-utils' {
  // Declaration merging into nuxt-auth-utils' own `User` interface — this is
  // not a redundant alias (the lint rule's usual concern): the empty body is
  // required syntax for module augmentation, and merging is what makes
  // `SessionUser` the shape nuxt-auth-utils' `useUserSession()` etc. return.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends SessionUser {}
}

export {}
