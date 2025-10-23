import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  ButtonGroup,
  ButtonProps,
  Container,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react"
import { Nav } from "../nav/Nav"
import {
  IconDotsVertical,
  IconLogin,
  IconUser,
  IconChevronDown,
  IconLogout,
  IconClipboardCheck,
  IconArrowLeft,
  IconThumbUp,
  IconArchive,
  IconMessageCircle,
} from "@tabler/icons-react"
import { isString } from "underscore"
import Link from "next/link"
import { useAuthStore } from "@/hooks/auth"
import React from "react"
import { useLogout } from "@/hooks/auth"
import { LinkButton } from "@/components/buttons/LinkButton"
import Head from "next/head"
import { reverse } from "@/utils/reverse"
import If from "../logic/If"
import { useRouter } from "next/router"
import { SimpleRolesSchema } from "@/api/definitions"

interface Action {
  label: string
  icon?: React.ReactElement
  href?: string
  onClick?: () => void
}

interface BreadcrumbElement {
  label: string
  href?: string
}

export function Shell(props: {
  page: {
    name: string
    title: string
    banner?: {
      title: string
      subtitle: string
    }
    sliver?: {
      title?: string
      subtitle?: string | React.ReactNode | React.ReactNode[]
      breadcrumbs?: BreadcrumbElement[]
    }
    back?: boolean
  }
  actions?: {
    mainActions?: Action[]
    callToAction?: Action
    collapsedActions?: Action[]
  }
  children?: React.ReactNode | React.ReactNode[]
}) {
  const auth = useAuthStore((store) => {
    return store.auth
  })

  const { logout } = useLogout()

  return (
    <>
      <Head>{props.page.title ?? "RelEase"}</Head>

      <VStack>
        <Nav
          nav={{
            items: auth
              ? [
                  {
                    name: "releases",
                    label: "Releases",
                    icon: <Icon as={IconClipboardCheck} />,
                    href: reverse.user.releases(),
                  },
                  {
                    name: "chat",
                    label: "Chat",
                    icon: <Icon as={IconMessageCircle} />,
                    href: reverse.user.chat(),
                  },
                  {
                    name: "deployment-snapshot",
                    label: "Deployment Snapshot",
                    icon: <Icon as={IconArchive} />,
                    href: reverse.user.deploymentSnapshot(),
                  },
                ]
              : [],
          }}
          actions={{
            items: !auth
              ? [
                  {
                    name: "login",
                    label: "Log in",
                    icon: <Icon as={IconLogin} />,
                    href: "/",
                  },
                ]
              : [],

            regularScreenActionItems: auth
              ? [
                  {
                    name: "actions",
                    element: (
                      <Menu>
                        <MenuButton
                          as={Button}
                          variant="ghost"
                          leftIcon={<Icon as={IconChevronDown} />}
                        >
                          {auth.first_name || auth.last_name || "Account"}
                        </MenuButton>

                        <MenuList>
                          <MenuItem
                            as={Link}
                            href={reverse.user.profile()}
                            icon={<Icon fontSize="md" as={IconUser} />}
                          >
                            Profile
                          </MenuItem>

                          <MenuDivider />

                          {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                            (item: SimpleRolesSchema) => item.role === 1
                          ) && (
                            <>
                              <MenuItem
                                as={Link}
                                href={reverse.user.approvals()}
                                icon={<Icon fontSize="md" as={IconThumbUp} />}
                              >
                                Approvals
                              </MenuItem>

                              <MenuDivider />
                            </>
                          )}

                          <MenuItem
                            onClick={() => logout.mutate({})}
                            icon={<Icon fontSize="md" as={IconLogout} />}
                          >
                            Log Out
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    ),
                  },
                ]
              : [],

            smallScreenDrawerActionItems: auth
              ? [
                  {
                    name: "actions",
                    element: (
                      <React.Fragment>
                        <LinkButton
                          href={reverse.user.profile()}
                          leftIcon={<Icon as={IconUser} />}
                          isActive={props.page.name == "profile"}
                        >
                          Profile
                        </LinkButton>

                        <Button
                          w="full"
                          variant="ghost"
                          fontWeight="medium"
                          justifyContent="start"
                          leftIcon={<Icon as={IconLogout} />}
                          onClick={() => logout.mutate({})}
                          isLoading={logout.isLoading}
                        >
                          Log Out
                        </Button>
                      </React.Fragment>
                    ),
                  },
                ]
              : [],
          }}
          activeLink={props.page.name}
        />

        <Container w="full" m="0" maxW="full">
          <VStack as="main" px={["1", "1", "6"]} py={["2", "2", "8"]} spacing={["6", "6", "8"]}>
            {props.page?.banner && (
              <Box w="full">
                {(props.page?.back ?? true) && <BackButton />}

                <PageBanner title={props.page.banner.title} subtitle={props.page.banner.subtitle} />
              </Box>
            )}

            {props.page?.sliver && (
              <Wrap w="full" justify="space-between" align="end">
                <WrapItem>
                  <VStack align="start" spacing="px">
                    {(props.page?.back ?? true) && (
                      <BackButton mt={["2", "2", "0"]} mb={["4", "4", "8"]} />
                    )}

                    <Text fontSize="lg" fontWeight="medium">
                      {props.page.sliver.title ?? props.page.title}
                    </Text>

                    <SliverSubtitle sliver={props.page.sliver} />
                  </VStack>
                </WrapItem>

                <WrapItem w={["full", "full", "auto"]}>
                  <ActionButtonSet actions={props.actions} />
                </WrapItem>
              </Wrap>
            )}

            {props.children}
          </VStack>
        </Container>
      </VStack>
    </>
  )
}

function BackButton(props: ButtonProps) {
  const { back } = useRouter()

  return (
    <Button
      {...props}
      size="sm"
      variant="link"
      leftIcon={<Icon as={IconArrowLeft} />}
      onClick={() => back()}
      _hover={{
        color: "black",
      }}
    >
      Back
    </Button>
  )
}

function SliverSubtitle(props: Pick<Parameters<typeof Shell>[0]["page"], "sliver">) {
  if (props.sliver?.subtitle && isString(props.sliver.subtitle)) {
    return <Text color="muted">{props.sliver.subtitle}</Text>
  }

  if (props.sliver?.subtitle) {
    return <>{props.sliver.subtitle}</>
  }

  return (
    <Breadcrumb color="muted">
      {props.sliver?.breadcrumbs?.map((crumb) => (
        <BreadcrumbItem key={crumb.label}>
          <If
            value={crumb.href}
            then={(href) => (
              <Link href={href} passHref legacyBehavior>
                <BreadcrumbLink>{crumb.label}</BreadcrumbLink>
              </Link>
            )}
            else={() => <BreadcrumbLink>{crumb.label}</BreadcrumbLink>}
          />
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  )
}

function ActionButtonSet(props: Pick<Parameters<typeof Shell>[0], "actions">) {
  return (
    <ButtonGroup w={["full", "full", "auto"]} spacing="2">
      {props.actions?.callToAction && (
        <Button
          as={props.actions.callToAction.href ? Link : undefined}
          href={props.actions.callToAction.href}
          leftIcon={props.actions?.callToAction?.icon}
          onClick={props.actions?.callToAction?.onClick}
          variant="solid"
          colorScheme="blue"
          fontWeight="medium"
          flexGrow={[1, 1, "auto"]}
          flexBasis={[0, 0, "auto"]}
        >
          {props.actions?.callToAction.label}
        </Button>
      )}

      {props.actions?.mainActions?.map((action) => (
        <Button
          key={action.label}
          as={action.href ? Link : undefined}
          href={action.href}
          leftIcon={action.icon}
          onClick={action.onClick}
          border="default"
          fontWeight="medium"
          flexGrow={[1, 1, "auto"]}
          flexBasis={[0, 0, "auto"]}
        >
          {action.label}
        </Button>
      ))}

      {props.actions?.collapsedActions && (
        <Menu>
          <MenuButton as={IconButton} icon={<Icon as={IconDotsVertical} />} border="default" />

          <MenuList shadow="sm">
            {props.actions.collapsedActions.map((action) => (
              <MenuItem key={action.label} icon={action.icon} onClick={action.onClick}>
                {action.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )}
    </ButtonGroup>
  )
}

export function PageBanner(props: { title: string; subtitle: string }) {
  return (
    <VStack pb={["2", "2", "8"]}>
      <Text fontSize="xl" fontWeight="medium">
        {props.title}
      </Text>

      <Text color="muted">{props.subtitle}</Text>
    </VStack>
  )
}
