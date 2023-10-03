import { AccountType } from "@/types/enum"
import urlcat from "urlcat"

function join(...parts: string[]) {
  return parts.reduce(urlcat)
}

function abs(path: string) {
  return join(process.env.NEXT_PUBLIC_APP_URL!, path)
}

export const reverse = {
  user: {
    root: () => join("/dashboard", "/"),

    login: () => join(reverse.user.root(), "/login"),
    createAccount: () => join(reverse.user.root(), "/create-account"),

    home: () => join(reverse.user.root(), "/"),
    profile: () => join(reverse.user.root(), "profile"),
    approvals: () => join(reverse.user.root(), "approvals"),

    tickets: () => join(reverse.user.root(), "/tickets"),
    createTicket: () => join(reverse.user.tickets(), "/create"),

    releases: () => join(reverse.user.root(), "/releases"),
    createRelease: () => join(reverse.user.releases(), "/create"),
    manageRelease: (uuid: string) => join(reverse.user.releases(), `/${uuid}`),

    dashboard: () => join(reverse.user.root(), "/dashboard"),
  },

  roles: {
    // TODO: This should actually depend on the role.
    login: (_: AccountType) => reverse.user.login(),
    createAccount: (_: AccountType) => reverse.user.createAccount(),
    home: (_: AccountType) => reverse.user.home(),
  },
}
