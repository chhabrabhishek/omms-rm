import { useEffect } from "react"
import { useRouter } from "next/router"
import { reverse } from "@/utils/reverse"

export default function EmptyPage() {
  const { replace } = useRouter()
  useEffect(() => {
    replace(reverse.user.releases())
  }, [])

  return null
}
