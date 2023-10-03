import {
  Box,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  HStack,
  Hide,
  Icon,
  IconButton,
  Show,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { IconMenu } from "@tabler/icons-react"
import React, { useState } from "react"
import { LinkButton } from "@/components/buttons/LinkButton"
import { Brand } from "../brand/Brand"

interface Item {
  name: string
  label?: string
  icon?: React.ReactElement
  href?: string
  element?: JSX.Element
}

export function Nav(props: {
  nav?: {
    items: Item[]
  }
  actions?: {
    items: Item[]
    regularScreenActionItems?: Item[]
    smallScreenDrawerActionItems?: Item[]
    smallScreenActionItems?: Item[]
  }
  activeLink?: string
}) {
  return (
    <Box
      w="full"
      p="4"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      shadow="sm"
      position={{ md: "sticky" }}
      top={{ md: "0" }}
      zIndex={9}
    >
      <Container as="nav" maxW="8xl">
        <Show below="md">
          <SmallScreenNav {...props} />
        </Show>

        <Hide below="md">
          <RegularNav {...props} />
        </Hide>
      </Container>
    </Box>
  )
}

function RegularNav(props: Parameters<typeof Nav>[0]) {
  return (
    <HStack justify="space-between">
      <HStack>
        <Brand pr={4} />

        {props.nav?.items.map((item) => (
          <React.Fragment key={item.name as never}>
            {item.href && (
              <LinkButton
                w="auto"
                href={item.href}
                justifyContent="inherit"
                leftIcon={item.icon}
                isActive={props.activeLink == item.name}
                _active={{
                  bg: "gray.100",
                }}
              >
                {item.label}
              </LinkButton>
            )}
          </React.Fragment>
        ))}
      </HStack>

      <HStack>
        {props.actions?.items.map((item) => (
          <React.Fragment key={item.name as never}>
            {item.href && (
              <LinkButton
                w="auto"
                href={item.href}
                justifyContent="inherit"
                leftIcon={item.icon}
                isActive={props.activeLink == item.name}
              >
                {item.label}
              </LinkButton>
            )}
          </React.Fragment>
        ))}

        {props.actions?.regularScreenActionItems?.map((item) => (
          <React.Fragment key={item.name}>{item.element}</React.Fragment>
        ))}
      </HStack>
    </HStack>
  )
}

function SmallScreenNav(props: Parameters<typeof Nav>[0]) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <HStack justify="space-between">
        <Brand />

        {props.actions?.smallScreenDrawerActionItems?.length && (
          <IconButton
            aria-label={isDrawerOpen ? "Close" : "Menu"}
            icon={isDrawerOpen ? <></> : <Icon as={IconMenu} />}
            variant="ghost"
            bg="base"
            rounded="base"
            onClick={() => {
              setIsDrawerOpen(!isDrawerOpen)
            }}
            transition="background 250ms"
          />
        )}

        {props.actions?.smallScreenActionItems?.map((item) => (
          <Wrap key={item.name}>{item.element}</Wrap>
        ))}
      </HStack>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody py="6">
            <VStack height="full" justify="space-between">
              <VStack width="full" align="start">
                <Box alignSelf="center" pb="6">
                  <Brand />
                </Box>

                {props.nav?.items.map((item) => (
                  <React.Fragment key={item.name as never}>
                    {item.href && (
                      <LinkButton
                        href={item.href}
                        leftIcon={item.icon}
                        isActive={props.activeLink == item.name}
                      >
                        {item.label}
                      </LinkButton>
                    )}
                  </React.Fragment>
                ))}
              </VStack>

              <VStack width="full" align="start">
                {props.actions?.items.map((item) => (
                  <React.Fragment key={item.name as never}>
                    {item.href && (
                      <LinkButton
                        href={item.href}
                        leftIcon={item.icon}
                        isActive={props.activeLink == item.name}
                      >
                        {item.label}
                      </LinkButton>
                    )}
                  </React.Fragment>
                ))}

                {props.actions?.smallScreenDrawerActionItems?.map((item) => (
                  <React.Fragment key={item.name}>{item.element}</React.Fragment>
                ))}
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
