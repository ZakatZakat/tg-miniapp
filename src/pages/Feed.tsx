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

function isLikelyImageUrl(url: string): boolean {
  const u = url.toLowerCase()
  return u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".png") || u.endsWith(".webp") || u.endsWith(".gif")
}

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

  const showDebug = React.useMemo(() => {
    if (typeof window === "undefined") return false
    try {
      return new URLSearchParams(window.location.search).has("debug")
    } catch {
      return false
    }
  }, [])

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
      const res = await fetch(
        `${apiUrl}/debug/telegram-fetch-recent?per_channel_limit=5&pause_between_channels_seconds=1.2&pause_between_messages_seconds=0.05`,
        { method: "POST" },
      )
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
      minH="100dvh"
      bg="#FFFFFF"
      color="#0F0F0F"
      fontFamily="system-ui"
      pb="10"
    >
      <Stack gap="4" px="4" pt="4" maxW="430px" mx="auto">
        <Flex align="center" justify="space-between" gap="3">
          <Text fontSize="lg" fontWeight="semibold" letterSpacing="-0.2px">
            AI-Picks for You
          </Text>
          <Flex gap="2">
            <Button size="sm" variant="outline" borderColor="rgba(0,0,0,0.14)" onClick={load} loading={loading}>
              Обновить
            </Button>
            <Button size="sm" bg="#0F0F0F" color="white" onClick={syncFromTelegram} loading={syncing}>
              Забрать из TG
            </Button>
          </Flex>
        </Flex>

        <Flex align="center" gap="2" wrap="wrap">
          <Badge borderRadius="full" px="3" py="1" bg="rgba(0,0,0,0.06)" color="#111" textTransform="none">
            Москва
          </Badge>
          {lastUpdatedAt ? (
            <Text fontSize="xs" color="rgba(0,0,0,0.55)">
              Обновлено: {new Date(lastUpdatedAt).toLocaleString()}
            </Text>
          ) : null}
          {syncError ? (
            <Text fontSize="xs" color="red.600">
              {syncError}
            </Text>
          ) : null}
        </Flex>

        {showDebug && creds ? (
          <Box border="1px solid rgba(0,0,0,0.12)" borderRadius="xl" bg="rgba(0,0,0,0.02)" p="3">
            <Text fontWeight="semibold" mb="2">
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
        ) : null}

        {loading ? <Text color="rgba(0,0,0,0.55)">Загружаем...</Text> : null}

        {!loading ? (
          <Flex align="flex-start" gap="18px">
            {(() => {
              const split = Math.ceil(items.length / 2)
              const left = items.slice(0, split)
              const right = items.slice(split)

              const renderCard = (card: EventCard, idxInCol: number, col: 0 | 1) => {
                const media = card.media_urls?.find((u) => isLikelyImageUrl(u)) ?? card.media_urls?.[0]
                const rawSrc = resolveMediaUrl(media, apiUrl)
                const imgSrc = rawSrc && isLikelyImageUrl(rawSrc) ? rawSrc : null
                const color = palette[(idxInCol + (col === 1 ? 3 : 0)) % palette.length]

                const base = col === 0 ? -2.2 : 2.0
                const tilt = idxInCol % 2 === 0 ? base : -base * 0.85

                return (
                  <Box
                    key={card.id}
                    width="100%"
                    borderRadius="2xl"
                    overflow="hidden"
                    bg="#FFFFFF"
                    border="1px solid rgba(0,0,0,0.10)"
                    boxShadow="0 6px 18px rgba(0,0,0,0.06)"
                    style={{
                      transform: `rotate(${tilt}deg)`,
                      transformOrigin: "center",
                    }}
                  >
                    {imgSrc && !failedImages[card.id] ? (
                      <Image
                        src={imgSrc}
                        alt={card.title}
                        width="100%"
                        height="auto"
                        objectFit="cover"
                        onError={() => {
                          setFailedImages((prev) => ({ ...prev, [card.id]: true }))
                        }}
                      />
                    ) : (
                      <Box bg={color} height="120px" />
                    )}

                    <Box px="3" pt="3" pb="3">
                      <Text
                        fontSize="xs"
                        color="rgba(0,0,0,0.55)"
                        mb="1"
                        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {card.channel}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        lineHeight="1.25"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {card.title}
                      </Text>
                    </Box>
                  </Box>
                )
              }

              return (
                <>
                  <Stack flex="1" gap="12px">
                    {left.map((card, idxInCol) => renderCard(card, idxInCol, 0))}
                  </Stack>
                  <Stack flex="1" gap="12px">
                    {right.map((card, idxInCol) => renderCard(card, idxInCol, 1))}
                  </Stack>
                </>
              )
            })()}
          </Flex>
        ) : null}
      </Stack>
    </Box>
  )
}




