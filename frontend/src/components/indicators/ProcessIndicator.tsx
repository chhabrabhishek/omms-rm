import React from "react"
import { Divider, Icon, Stack, Text, VStack } from "@chakra-ui/react"
import {
  IconCircle0Filled,
  IconCircle1Filled,
  IconCircle2Filled,
  IconCircle3Filled,
  IconCircle4Filled,
  IconCircle5Filled,
  IconCircle6Filled,
  IconCircle7Filled,
  IconCircle8Filled,
  IconCircle9Filled,
} from "@tabler/icons-react"

export default function ProcessIndicator(props: {
  items: {
    name: string
  }[]
  active?: number
}) {
  return (
    <Stack
      direction={["column", "column", "row"]}
      align={["start", "start", "center"]}
      justify="space-between"
    >
      {props.items.map((item, index) => (
        <React.Fragment key={item.name}>
          {index > 0 && <Divider orientation="horizontal" />}

          <VStack
            color={index <= (props.active ?? -1) ? "brand" : undefined}
            align={["start", "start", "center"]}
            py={["2", "2", "0"]}
          >
            <Icon as={digitIcon(index + 1)} fontSize="2xl" />
            <Text
              fontWeight={index <= (props.active ?? -1) ? "medium" : "normal"}
              whiteSpace="nowrap"
            >
              {item.name}
            </Text>
          </VStack>
        </React.Fragment>
      ))}
    </Stack>
  )
}

function digitIcon(digit: number) {
  switch (digit) {
    case 0:
      return IconCircle0Filled
    case 1:
      return IconCircle1Filled
    case 2:
      return IconCircle2Filled
    case 3:
      return IconCircle3Filled
    case 4:
      return IconCircle4Filled
    case 5:
      return IconCircle5Filled
    case 6:
      return IconCircle6Filled
    case 7:
      return IconCircle7Filled
    case 8:
      return IconCircle8Filled
    case 9:
      return IconCircle9Filled
  }
}
