import type { SessionUser } from '~/shared/types/user'

declare module '#auth-utils' {
  interface User extends SessionUser {}
}

export {}
