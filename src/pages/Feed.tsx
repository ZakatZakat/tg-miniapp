import * as React from "react"
import { Badge, Box, Flex, Image, Stack, Text } from "@chakra-ui/react"

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

export default function Feed() {
  const [items, setItems] = React.useState<EventCard[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creds, setCreds] = React.useState<TelegramCreds | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        const [eventsRes, credsRes] = await Promise.all([
          fetch(`${apiUrl}/events?limit=20`),
          fetch(`${apiUrl}/debug/telegram-creds`),
        ])
        if (!eventsRes.ok) throw new Error(`events status ${eventsRes.status}`)
        const data: EventCard[] = await eventsRes.json()
        setItems(data)
        if (credsRes.ok) {
          const credsData: TelegramCreds = await credsRes.json()
          setCreds(credsData)
        }
      } catch (err) {
        console.error("fetch events", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
          </Flex>
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
                const imgSrc =
                  media && (media.startsWith("http") ? media : `${apiUrl}${media.startsWith("/") ? "" : "/"}${media}`)
                const subtitle =
                  card.description?.split("\n").find((line) => line.trim()) ?? card.description ?? "Без описания"

                return (
                  <Box key={card.id} border="2px solid #0F0F0F" borderRadius="xl" bg={color} p="4" boxShadow="sm">
                    {imgSrc ? (
                      <Box mb="3" borderRadius="lg" overflow="hidden" border="1px solid #0F0F0F">
                        <Image src={imgSrc} alt={card.title} width="100%" height="auto" objectFit="cover" />
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

