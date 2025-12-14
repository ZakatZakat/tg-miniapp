import * as React from "react"
import { Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react"
import { ProgressRoot, ProgressTrack, ProgressRange } from "@chakra-ui/react/progress"
import { TagRoot, TagLabel } from "@chakra-ui/react/tag"

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

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

const MOCK_EVENTS: EventCard[] = [
  {
    id: "mock-1",
    title: "Концерт на крыше",
    description: "Живой сет, инди и электроника. Старт в 20:00.",
    channel: "@gzsmsk",
    message_id: 1,
    event_time: new Date().toISOString(),
    location: "Москва, Арбат 1",
    price: "1000 ₽",
    category: "музыка",
    source_link: "https://t.me/gzsmsk",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    title: "Выставка современного искусства",
    description: "Небольшая экспозиция + лекция куратора. 12:00–21:00.",
    channel: "@gzsmsk",
    message_id: 2,
    event_time: new Date(Date.now() + 86400000).toISOString(),
    location: "Москва, ARTPLAY",
    price: "Бесплатно",
    category: "выставки",
    source_link: "https://t.me/gzsmsk",
    created_at: new Date().toISOString(),
  },
]

const formatDate = (value?: string | null) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString()
}

export default function Home() {
  const [events, setEvents] = React.useState<EventCard[]>(MOCK_EVENTS)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [seen, setSeen] = React.useState(0)

  const current = events[0]

  const loadFromApi = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/events`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as EventCard[]
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data)
        setSeen(0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadFromApi()
  }, [loadFromApi])

  const pop = React.useCallback(() => {
    setEvents((prev) => prev.slice(1))
    setSeen((prev) => prev + 1)
  }, [])

  const onAction = (_action: "like" | "skip" | "save") => {
    if (!current) return
    pop()
  }

  const progress = React.useMemo(() => {
    const total = Math.max(seen + events.length, 1)
    return (seen / total) * 100
  }, [seen, events.length])

  return (
    <Stack gap="4" py="6">
      <Flex align="center" gap="2">
        <Text fontSize="lg" fontWeight="semibold">
          Афиша
        </Text>
        <Badge variant="subtle">Москва</Badge>
        <Box flex="1" />
        <Button size="sm" variant="subtle" onClick={loadFromApi} isLoading={loading}>
          Обновить
        </Button>
        <Button size="sm" variant="outline" isDisabled>
          Фильтры
        </Button>
      </Flex>

      {error && (
        <Box borderWidth="1px" borderColor="red.400" borderRadius="md" p="3">
          <Text color="red.300">Ошибка: {error}</Text>
        </Box>
      )}

      {!current ? (
        <Box borderWidth="1px" borderRadius="md" p="4">
          <Text>Карточки закончились. Обнови ленту.</Text>
        </Box>
      ) : (
        <Box borderWidth="1px" borderRadius="xl" overflow="hidden">
          <Box bgGradient="linear(to-r, purple.700, teal.600)" p="4" color="white">
            <Flex align="center" gap="2" wrap="wrap">
              <Text fontWeight="semibold" fontSize="lg">
                {current.title}
              </Text>
              <Box flex="1" />
              <TagRoot size="sm" variant="solid" colorPalette="blackAlpha">
                <TagLabel>{current.channel.replace(/^@/, "")}</TagLabel>
              </TagRoot>
            </Flex>
            <Flex mt="2" gap="2" wrap="wrap" opacity={0.9}>
              {current.category && (
                <TagRoot size="sm">
                  <TagLabel>{current.category}</TagLabel>
                </TagRoot>
              )}
              {formatDate(current.event_time) && (
                <TagRoot size="sm">
                  <TagLabel>{formatDate(current.event_time)}</TagLabel>
                </TagRoot>
              )}
              {current.location && (
                <TagRoot size="sm">
                  <TagLabel>{current.location}</TagLabel>
                </TagRoot>
              )}
              {current.price && (
                <TagRoot size="sm">
                  <TagLabel>{current.price}</TagLabel>
                </TagRoot>
              )}
            </Flex>
          </Box>

          <Box p="4">
            <Text whiteSpace="pre-wrap" color="fg.muted">
              {current.description ?? "Без описания"}
            </Text>

            <Flex mt="4" gap="3">
              <Button flex="1" variant="outline" onClick={() => onAction("skip")}>
                Скип
              </Button>
              <Button flex="1" variant="subtle" onClick={() => onAction("save")}>
                Сохранить
              </Button>
              <Button flex="1" variant="solid" onClick={() => onAction("like")}>
                Нравится
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      <Stack gap="2">
        <ProgressRoot value={progress} size="sm">
          <ProgressTrack>
            <ProgressRange />
          </ProgressTrack>
        </ProgressRoot>
        <Text fontSize="sm" color="fg.muted">
          Просмотрено: {seen} • В очереди: {events.length}
        </Text>
      </Stack>
    </Stack>
  )
}


