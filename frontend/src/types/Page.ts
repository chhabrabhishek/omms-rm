import { AppProps } from "next/app"

export type AppPageComponent = AppProps["Component"] & {
  access?: number
}

// no_auth_only allows a page to be accessed only if no auth is available.
// public allows everyone to access a page.
export enum Access {
  Public = 0,
  NoAuthOnly = 1 << 0,

  User = 1 << 1,
}
