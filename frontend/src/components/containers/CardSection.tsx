import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  HStack,
  SpaceProps,
  Text,
} from "@chakra-ui/react"

export function CardSection(props: {
  title: string
  subtitle: string
  children?: React.ReactNode | React.ReactNode[]
  innerRef?: React.Ref<HTMLDivElement>
  p?: SpaceProps["p"]
  actions?: JSX.Element[]
  footer?: JSX.Element | false
}) {
  return (
    <Card w="full" variant="outline" shadow="sm" overflow="hidden">
      <CardHeader borderBottom="1px" borderColor="gray.200" borderLeft="accent">
        <HStack justify="space-between">
          <Box>
            <Text fontWeight="medium">{props.title}</Text>
            <Text color="muted">{props.subtitle}</Text>
          </Box>

          {props.actions && <HStack>{props.actions}</HStack>}
        </HStack>
      </CardHeader>

      <CardBody ref={props.innerRef} p={props.p ?? "8"}>
        {props.children}
      </CardBody>

      {props.footer && <CardFooter pt="0">{props.footer}</CardFooter>}
    </Card>
  )
}
