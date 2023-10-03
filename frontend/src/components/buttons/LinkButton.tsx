import { Button, ButtonProps } from "@chakra-ui/react"
import Link from "next/link"

export function LinkButton(
  props: ButtonProps & {
    href: string
    target?: string
  }
) {
  const { href, target, ...buttonProps } = props

  return (
    <Link href={href} passHref legacyBehavior>
      <Button
        as={Link}
        target={target ?? "_self"}
        w={buttonProps.w ?? "full"}
        variant={buttonProps.variant ?? "ghost"}
        fontWeight={buttonProps.fontWeight ?? "medium"}
        justifyContent={buttonProps.justifyContent ?? "start"}
        {...buttonProps}
      >
        {props.children}
      </Button>
    </Link>
  )
}
