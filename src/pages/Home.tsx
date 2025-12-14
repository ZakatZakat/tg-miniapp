// src/pages/Home.tsx
import * as React from "react"
import { Badge, Button, Card, Flex, Heading, Skeleton, Stack, Tag, Text } from "@chakra-ui/react"

type EventCard = {
  id: string
  title: string
  description?: string | null
  channel: string
  message_id: number
  event_time?: string | null
  location?: string | null
  price?: string | null
  category?: string | null
  source_link?: string | null
  created_at: string
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

export default function Home() {
  const [events, setEvents] = React.useState<EventCard[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/events`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: EventCard[] = await res.json()
        setEvents(data)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  const current = events[0]

  const popCard = React.useCallback((nextEvents: EventCard[]) => {
    setEvents(nextEvents.slice(1))
  }, [])

  const handleAction = (action: "like" | "skip" | "save") => {
    if (!current) return
    // TODO: send action to backend when endpoints are ready
    popCard(events)
  }

  return (
    <Stack gap="4" py="6">
      <Heading size="lg">Афиша Москвы</Heading>
      {error && (
        <Card.Root borderColor="red.400">
          <Card.Body>
            <Text color="red.300">Ошибка загрузки: {error}</Text>
          </Card.Body>
        </Card.Root>
      )}

      {loading && (
        <Card.Root>
          <Card.Body>
            <Stack gap="3">
              <Skeleton height="24px" />
              <Skeleton height="60px" />
              <Skeleton height="18px" />
            </Stack>
          </Card.Body>
        </Card.Root>
      )}

      {!loading && !current && (
        <Card.Root>
          <Card.Body>
            <Text>Карточки закончились. Обнови позже.</Text>
          </Card.Body>
        </Card.Root>
      )}

      {current && (
        <Card.Root>
          <Card.Header>
            <Flex align="center" gap="2" wrap="wrap">
              <Heading size="md" flex="1">
                {current.title}
              </Heading>
              <Badge colorPalette="blue">@{current.channel.replace(/^@/, "")}</Badge>
              {current.category && <Tag size="sm">{current.category}</Tag>}
            </Flex>
          </Card.Header>
          <Card.Body>
            {current.event_time && (
              <Text fontSize="sm" color="fg.muted" mb="2">
                {formatDate(current.event_time)}
              </Text>
            )}
            {current.location && (
              <Text fontSize="sm" color="fg.muted" mb="2">
                {current.location}
              </Text>
            )}
            <Text whiteSpace="pre-wrap">{current.description || "Без описания"}</Text>
            {current.price && (
              <Text mt="2" fontWeight="semibold">
                {current.price}
              </Text>
            )}
          </Card.Body>
          <Card.Footer>
            <Flex gap="3" w="100%">
              <Button variant="outline" flex="1" onClick={() => handleAction("skip")}>
                Скип
              </Button>
              <Button variant="subtle" flex="1" onClick={() => handleAction("save")}>
                Сохранить
              </Button>
              <Button variant="solid" flex="1" onClick={() => handleAction("like")}>
                Нравится
              </Button>
            </Flex>
          </Card.Footer>
        </Card.Root>
      )}
    </Stack>
  )
}
