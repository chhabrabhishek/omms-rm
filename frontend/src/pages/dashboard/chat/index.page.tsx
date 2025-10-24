import { Box, Flex, Icon, Text, IconButton, Textarea, Button } from "@chakra-ui/react"
import { useState, useRef, useEffect, ChangeEvent } from "react"
import { Shell } from "@/components/layout/Shell"
import {
  IconCopy,
  IconHistory,
  IconMessageCirclePlus,
  IconMessageCircle,
  IconTrash,
  IconUser,
  IconRobot,
} from "@tabler/icons-react"
import { IconArrowNarrowUp } from "@tabler/icons-react"
import toast from "react-hot-toast"
import { useAppMutation } from "@/hooks/useAppMutation"
import { api } from "@/api"
import { Access } from "@/types/Page"
import { useAppQuery } from "@/hooks/useAppQuery"
import WithQuery from "@/components/indicators/WithQuery"
import {
  GetAllChatSessionsResponse,
  SimpleAllChatModelSchema,
  SimpleChatMessageModelSchema,
} from "@/api/definitions"
import If from "@/components/logic/If"

ChatPage.access = Access.User
export default function ChatPage() {
  type Message = {
    text: string
    sender_type: "user" | "agent"
  }

  const senderTypeEnum = [
    { label: "user", value: 0 },
    { label: "agent", value: 1 },
  ]

  const [currentSession, setCurrentSession] = useState<string>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    const textarea = textAreaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = textarea.scrollHeight + "px"
    textAreaRef.current?.focus()
  }, [messages, input])

  const query = useAppQuery(api.queries.useChatApiGetAllChatSessions, {
    autoRefetch: false,
  })

  const getChatMutation = useAppMutation(api.mutations.useChatApiGetChat, {
    onOk(data) {
      const tempMessages: Message[] = []
      data.result?.chat_data.messages.map((messageObject: SimpleChatMessageModelSchema) => {
        tempMessages.push({
          text: messageObject.text,
          sender_type: senderTypeEnum.find((item) => item.value === messageObject.sender_type)
            ?.label as "user" | "agent",
        })
      })
      setMessages(tempMessages)
    },
  })

  const chatMutation = useAppMutation(api.mutations.useChatApiChat, {
    onOk(data) {
      setMessages((prev) => [
        ...prev,
        { text: data.result?.agent_response ?? "", sender_type: "agent" },
      ])
      if (!currentSession) {
        query.refetch()
      }
      setCurrentSession(data.result?.session_id)
    },
  })

  const deleteChatMutation = useAppMutation(api.mutations.useChatApiDeleteChat, {
    onOk(data) {
      toast.success("Deleted")
      if (currentSession === data.result?.session_id) {
        handleNewChat()
      }
      query.refetch()
    },
    onError(error) {
      toast.error("Failed")
    },
  })

  const handleNewChat = () => {
    setInput("")
    setMessages([])
    setCurrentSession(undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied")
    } catch (error) {
      toast.error("Failed")
    }
  }

  const handleExistingSession = (session_id: string) => {
    setCurrentSession(session_id)
    getChatMutation.mutate({
      session_id: session_id,
    })
  }

  const handleSend = () => {
    if (input.trim() === "") return
    setMessages((prev) => [...prev, { text: input.trim(), sender_type: "user" }])
    setInput("")

    chatMutation.mutate({
      session_id: currentSession,
      user_query: input.trim(),
    })
  }

  return (
    <Shell
      page={{
        name: "chat",
        title: "Chat",
      }}
    >
      <WithQuery
        query={query}
        onOk={(response?: GetAllChatSessionsResponse) => (
          <If
            value={response?.chat_session_list}
            then={(chat_session_list) => (
              <Flex
                w="full"
                h="80vh"
                bg="white"
                border="6px solid"
                borderColor="gray.100"
                borderRadius="lg"
              >
                <Flex
                  direction="column"
                  align="start"
                  justify="flex-start"
                  w="25%"
                  h="full"
                  borderWidth="1px"
                  borderY="none"
                  borderLeft="none"
                  p={4}
                  gap={2}
                >
                  <Flex w="full" h="7.5%" p={2} justify="space-between" align="center">
                    <Text fontWeight="bolder" color="muted">
                      Chat
                    </Text>
                    <Icon as={IconMessageCircle} color="brand" />
                  </Flex>
                  <Button
                    w="full"
                    h="7.5%"
                    p={2}
                    justifyContent="start"
                    variant="ghost"
                    leftIcon={<Icon as={IconMessageCirclePlus} color="brand" />}
                    _hover={{ bg: "gray.100", borderRadius: "lg" }}
                    onClick={handleNewChat}
                  >
                    <Text color="muted" fontWeight="normal">
                      New Chat
                    </Text>
                  </Button>
                  <Flex
                    w="full"
                    h="83%"
                    p={2}
                    gap={2}
                    justify="start"
                    align="start"
                    direction="column"
                  >
                    <Flex justify="start" align="center" gap={2}>
                      <Icon as={IconHistory} color="brand" />
                      <Text color="muted">History</Text>
                    </Flex>
                    <Box
                      w="full"
                      h="full"
                      overflow="auto"
                      css={{
                        "&::-webkit-scrollbar": {
                          display: "none",
                        },
                        "-ms-overflow-style": "none",
                        "scrollbar-width": "none",
                      }}
                    >
                      {chat_session_list.map((sessionObject: SimpleAllChatModelSchema) => (
                        <Button
                          variant={sessionObject.session_id == currentSession ? "solid" : "ghost"}
                          role="group"
                          my={1}
                          w="full"
                          p="2.5"
                          justifyContent="space-between"
                          onClick={() => handleExistingSession(sessionObject.session_id ?? "")}
                        >
                          <Flex
                            w="full"
                            direction="column"
                            alignItems="start"
                            _groupHover={{ w: "80%" }}
                          >
                            <Text
                              w="full"
                              isTruncated
                              fontWeight="normal"
                              fontSize="sm"
                              color="muted"
                              textAlign="left"
                            >
                              {sessionObject.title_truncated}
                            </Text>
                            <Text
                              w="full"
                              isTruncated
                              fontWeight="light"
                              fontSize="xs"
                              color="muted"
                              textAlign="left"
                            >
                              {new Date(sessionObject.updated_at).toLocaleString("en-IN", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </Flex>

                          <IconButton
                            aria-label="Delete"
                            icon={<Icon as={IconTrash} />}
                            variant="ghost"
                            color="brand"
                            size="sm"
                            _hover={{ bg: "brand", color: "white" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChatMutation.mutate({
                                session_id: sessionObject.session_id ?? "",
                              })
                            }}
                            display="none"
                            _groupHover={{ display: "flex" }}
                          />
                        </Button>
                      ))}
                    </Box>
                  </Flex>
                </Flex>
                <Flex w="75%" h="full" direction="column">
                  <Flex
                    w="full"
                    px={4}
                    my={4}
                    h="80%"
                    direction="column"
                    gap={4}
                    overflow="auto"
                    grow={1}
                    css={{
                      "&::-webkit-scrollbar": {
                        display: "none",
                      },
                      "-ms-overflow-style": "none",
                      "scrollbar-width": "none",
                    }}
                  >
                    {messages.length ? (
                      <Flex w="full" direction="column">
                        {messages.map((msg, index) => (
                          <Flex
                            w="full"
                            key={index}
                            justify={msg.sender_type === "user" ? "end" : "start"}
                          >
                            <Flex
                              w="full"
                              align={msg.sender_type === "user" ? "end" : "start"}
                              direction="column"
                              gap={1}
                            >
                              <Text
                                bg={msg.sender_type === "user" ? "gray.100" : ""}
                                p={2}
                                pb={msg.sender_type === "user" ? "2" : "0"}
                                borderRadius="lg"
                                maxW="70%"
                                textAlign="left"
                                whiteSpace="pre-wrap"
                              >
                                {msg.text}
                              </Text>
                              <Flex
                                gap={1}
                                px={2}
                                align="center"
                                direction={msg.sender_type === "user" ? "row" : "row-reverse"}
                              >
                                <IconButton
                                  aria-label="Copy"
                                  icon={<Icon as={IconCopy} />}
                                  variant="ghost"
                                  color="brand"
                                  onClick={() => handleCopy(msg.text)}
                                />
                                {msg.sender_type === "user" ? (
                                  <Icon as={IconUser} color="brand" />
                                ) : (
                                  <Icon as={IconRobot} color="brand" />
                                )}
                              </Flex>
                            </Flex>
                          </Flex>
                        ))}
                        <Flex
                          display={chatMutation.isLoading ? "flex" : "none"}
                          px={2}
                          w="full"
                          alignItems="center"
                          justifyContent="start"
                        >
                          <Icon as={IconRobot} color="brand" />
                          <Button
                            isLoading
                            loadingText={`Thinking. Please wait.`}
                            spinnerPlacement="end"
                            variant="ghost"
                            fontWeight="normal"
                          ></Button>
                        </Flex>
                      </Flex>
                    ) : (
                      <Flex
                        w="full"
                        h="full"
                        alignItems="center"
                        justify="center"
                        direction="column"
                      >
                        <Text fontWeight="bold" fontSize="xl" color="muted">
                          hello, human
                        </Text>
                        <Text fontWeight="bolder" fontSize="2xl" color="muted">
                          how can I assist you today?
                        </Text>
                      </Flex>
                    )}
                    <div ref={bottomRef} />
                  </Flex>
                  <Flex
                    w="full"
                    p="4"
                    maxH="40%"
                    borderWidth="1px"
                    borderX="none"
                    borderBottom="none"
                    gap={4}
                    align="center"
                    justify="space-between"
                  >
                    <Textarea
                      autoFocus
                      ref={textAreaRef}
                      value={input}
                      onChange={handleInput}
                      disabled={chatMutation.isLoading}
                      placeholder="beep boop, talk to me ..."
                      border="none"
                      focusBorderColor="transparent"
                      p={0}
                      resize="none"
                      rows={1}
                      maxH="full"
                      overflow="auto"
                      onKeyDown={handleKeyDown}
                      css={{
                        "&::-webkit-scrollbar": {
                          display: "none",
                        },
                        "-ms-overflow-style": "none",
                        "scrollbar-width": "none",
                      }}
                    />
                    <IconButton
                      aria-label="Enter"
                      icon={<Icon as={IconArrowNarrowUp} />}
                      variant="ghost"
                      color="muted"
                      onClick={handleSend}
                      isLoading={chatMutation.isLoading}
                    />
                  </Flex>
                </Flex>
              </Flex>
            )}
          />
        )}
      />
    </Shell>
  )
}
