import * as React from "react"
import { Badge, Box, Button, Flex, Image, Stack, Text } from "@chakra-ui/react"

type EventCard = {
  id: string
  title: string
  description?: string | null
  channel: string
  message_id: number
  event_time?: string | null
  media_urls?: string[]
  created_at: string
}

type TelegramCreds = {
  login_mode: string
  channel_ids: string[]
  api_id: number
  api_hash_masked: string
  bot_token_masked?: string | null
}

const palette = ["#F9D7C3", "#FFEAB6", "#FFB4A8", "#B7FFD4", "#E6E0FF", "#E0F4FF"]
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

function resolveMediaUrl(media: string | undefined, apiBase: string): string | null {
  if (!media) return null
  if (media.startsWith("http://") || media.startsWith("https://")) return media
  try {
    const base = new URL(apiBase)
    if (media.startsWith("/media/")) return `${base.origin}${media}`
    return `${apiBase}${media.startsWith("/") ? "" : "/"}${media}`
  } catch {
    return media
  }
}

export default function Feed() {
  const [items, setItems] = React.useState<EventCard[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creds, setCreds] = React.useState<TelegramCreds | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null)
  const [syncing, setSyncing] = React.useState(false)
  const [syncError, setSyncError] = React.useState<string | null>(null)
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({})

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [eventsRes, credsRes] = await Promise.all([
        fetch(`${apiUrl}/events?limit=20`, { cache: "no-store" }),
        fetch(`${apiUrl}/debug/telegram-creds`, { cache: "no-store" }),
      ])
      if (!eventsRes.ok) throw new Error(`events status ${eventsRes.status}`)
      const data: EventCard[] = await eventsRes.json()
      setItems(data)
      if (credsRes.ok) {
        const credsData: TelegramCreds = await credsRes.json()
        setCreds(credsData)
      }
      setLastUpdatedAt(new Date().toISOString())
      setSyncError(null)
    } catch (err) {
      console.error("fetch events", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const syncFromTelegram = React.useCallback(async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch(`${apiUrl}/debug/telegram-fetch-recent?limit=30`, { method: "POST" })
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { detail?: unknown } | null
        const detail = payload && typeof payload.detail === "string" ? payload.detail : null
        throw new Error(detail ? `status ${res.status}: ${detail}` : `status ${res.status}`)
      }
      await load()
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Не удалось синхронизироваться")
    } finally {
      setSyncing(false)
    }
  }, [load])

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #E8ECF5 0%, #F6F3EF 60%, #F6F3EF 100%)"
      color="#0F0F0F"
      fontFamily="system-ui"
      pb="10"
    >
      <Stack gap="5" px="3" pt="5" maxW="430px" mx="auto">
        <Stack gap="1">
          <Text fontSize="lg" fontWeight="bold">
            Лента событий
          </Text>
          <Text color="fg.muted">Реальные посты из TG-канала.</Text>
        </Stack>

        <Stack gap="3">
          <Flex align="center" gap="2">
            <Text fontSize="md" fontWeight="semibold">
              Для тебя
            </Text>
            <Badge borderRadius="full" px="3" py="1" bg="#111" color="white">
              Москва
            </Badge>
            <Button size="xs" variant="outline" borderColor="#0F0F0F" onClick={load} isLoading={loading}>
              Обновить
            </Button>
            <Button size="xs" bg="#0F0F0F" color="white" onClick={syncFromTelegram} isLoading={syncing}>
              Забрать из TG
            </Button>
          </Flex>
          {lastUpdatedAt ? (
            <Text fontSize="xs" color="fg.muted">
              Обновлено: {new Date(lastUpdatedAt).toLocaleString()}
            </Text>
          ) : null}
          {syncError ? (
            <Text fontSize="xs" color="red.600">
              Sync error: {syncError}
            </Text>
          ) : null}
          {creds && (
            <Box border="2px solid #0F0F0F" borderRadius="xl" bg="#FFF9E8" p="4" boxShadow="sm">
              <Text fontWeight="bold" mb="2">
                Debug: Telegram creds (masked)
              </Text>
              <Stack fontSize="sm" color="#222" gap="1">
                <Text>login_mode: {creds.login_mode}</Text>
                <Text>channels: {creds.channel_ids.join(", ")}</Text>
                <Text>api_id: {creds.api_id}</Text>
                <Text>api_hash: {creds.api_hash_masked}</Text>
                {creds.bot_token_masked ? <Text>bot_token: {creds.bot_token_masked}</Text> : null}
              </Stack>
            </Box>
          )}
          <Stack gap="3">
            {loading && <Text color="fg.muted">Загружаем...</Text>}
            {!loading &&
              items.map((card, idx) => {
                const media = card.media_urls && card.media_urls[0]
                const color = palette[idx % palette.length]
                const imgSrc = resolveMediaUrl(media, apiUrl)
                const subtitle =
                  card.description?.split("\n").find((line) => line.trim()) ?? card.description ?? "Без описания"

                return (
                  <Box key={card.id} border="2px solid #0F0F0F" borderRadius="xl" bg={color} p="4" boxShadow="sm">
                    {imgSrc && !failedImages[card.id] ? (
                      <Box mb="3" borderRadius="lg" overflow="hidden" border="1px solid #0F0F0F">
                        <Image
                          src={imgSrc}
                          alt={card.title}
                          width="100%"
                          height="auto"
                          objectFit="cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            setFailedImages((prev) => ({ ...prev, [card.id]: true }))
                          }}
                        />
                      </Box>
                    ) : null}
                    {imgSrc && failedImages[card.id] ? (
                      <Box mb="3" borderRadius="lg" border="1px dashed #0F0F0F" p="3" bg="rgba(255,255,255,0.35)">
                        <Text fontSize="xs" color="#222">
                          Не удалось загрузить изображение
                        </Text>
                        <Text fontSize="xs" color="#444" wordBreak="break-all">
                          {imgSrc}
                        </Text>
                      </Box>
                    ) : null}

                    <Flex justify="space-between" align="center" mb="2">
                      <Badge borderRadius="full" px="3" py="1" bg="#0F0F0F" color="white" textTransform="none">
                        {card.channel}
                      </Badge>
                      <Badge
                        borderRadius="full"
                        px="3"
                        py="1"
                        bg="white"
                        color="#0F0F0F"
                        border="1px solid #0F0F0F"
                        textTransform="none"
                      >
                        #{card.message_id}
                      </Badge>
                    </Flex>
                    <Text fontWeight="bold">{card.title}</Text>
                    <Text fontSize="sm" mt="1" color="#222">
                      {subtitle}
                    </Text>
                  </Box>
                )
              })}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}




