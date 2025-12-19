import * as React from "react"
import { Box, Button, Flex, Image, Stack, Text } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"

type EventCard = {
  id: string
  title: string
  description?: string | null
  channel: string
  message_id: number
  media_urls?: string[]
  created_at: string
}

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

function firstLine(text: string | null | undefined): string {
  if (!text) return ""
  return text.split("\n").find((l) => l.trim())?.trim() ?? ""
}

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0
  return h
}

function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function chooseLandingCards(all: EventCard[], seed: number): EventCard[] {
  const rng = mulberry32(seed)
  const scored = [...all].sort((a, b) => {
    const ta = firstLine(a.title).length + (a.description ?? "").length + rng() * 100
    const tb = firstLine(b.title).length + (b.description ?? "").length + rng() * 100
    return tb - ta
  })

  const out: EventCard[] = []
  const usedChannels = new Set<string>()

  for (const e of scored) {
    if (out.length >= 3) break
    if (usedChannels.has(e.channel)) continue
    out.push(e)
    usedChannels.add(e.channel)
  }
  if (out.length < 3) {
    for (const e of scored) {
      if (out.length >= 3) break
      if (out.some((x) => x.id === e.id)) continue
      out.push(e)
    }
  }
  return out.slice(0, 3)
}

type FanCardProps = {
  idx: 0 | 1 | 2
  active: 0 | 1 | 2
  onActivate: (idx: 0 | 1 | 2) => void
  title: string
  subtitle: string
  img: string | null
  bg: string
}

function FanCard({ idx, active, onActivate, title, subtitle, img, bg }: FanCardProps) {
  const isActive = idx === active

  // Fixed "fan" positions to match reference.
  // Active card only raises z-index + slightly scales, without changing layout.
  const fan = [
    { x: -46, y: 44, r: -2.0, z: 1, w: "96%" }, // back (orange)
    { x: 14, y: 162, r: 13.0, z: 2, w: "82%" }, // middle (pink)
    { x: -2, y: 292, r: -11.5, z: 3, w: "88%" }, // front (green)
  ] as const

  const p = fan[idx]

  return (
    <Box
      position="absolute"
      left="50%"
      top="0"
      width={p.w}
      transform={`translateX(-50%) translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg) ${isActive ? "scale(1.03)" : ""}`}
      transformOrigin="center"
      borderRadius="2xl"
      overflow="hidden"
      bg={bg}
      border="1px solid rgba(0,0,0,0.10)"
      boxShadow={isActive ? "0 28px 58px rgba(0,0,0,0.18)" : "0 22px 42px rgba(0,0,0,0.14)"}
      zIndex={isActive ? 10 : p.z}
      transition="transform 220ms ease, box-shadow 220ms ease"
      onClick={() => onActivate(idx)}
      cursor="pointer"
      className={idx % 2 === 0 ? "tg-float-1" : "tg-float-2"}
      style={{
        animationDuration: `${7.4 + idx * 0.7}s`,
        animationDelay: `${-0.6 - idx * 0.4}s`,
      }}
    >
      <Box p="4">
        <Flex align="center" gap="2" mb="2">
          <Box w="6" h="6" borderRadius="full" bg="rgba(0,0,0,0.10)" display="grid" placeItems="center">
            🤖
          </Box>
          <Text fontSize="xs" fontWeight="semibold" color="rgba(0,0,0,0.75)">
            AI bot
          </Text>
          <Text fontSize="xs" color="rgba(0,0,0,0.45)">
            • recommends
          </Text>
        </Flex>
        <Text fontSize="md" fontWeight="semibold" lineHeight="1.15">
          {title}
        </Text>
        <Text fontSize="xs" mt="2" color="rgba(0,0,0,0.60)">
          {subtitle}
        </Text>
      </Box>
      {img ? <Image src={img} alt={title} width="100%" height="180px" objectFit="cover" /> : null}
    </Box>
  )
}

export default function Landing2() {
  const [allWithImages, setAllWithImages] = React.useState<EventCard[]>([])
  const [variant, setVariant] = React.useState<number>(() => hashSeed(new Date().toISOString().slice(0, 10)))
  const [active, setActive] = React.useState<0 | 1 | 2>(2)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/events?limit=120`, { cache: "no-store" })
        if (!res.ok) throw new Error(`events status ${res.status}`)
        const data: EventCard[] = await res.json()
        const withImages = data
          .filter((e) => (e.media_urls ?? []).some((u) => isLikelyImageUrl(u)))
          .filter((e) => firstLine(e.title).length >= 6 || (e.description ?? "").length >= 40)
        setAllWithImages(withImages)
      } catch (e) {
        console.error("landing2 load", e)
        setAllWithImages([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = React.useMemo(() => chooseLandingCards(allWithImages, variant), [allWithImages, variant])
  const preview = cards.map((c) => {
    const media = c.media_urls?.find((u) => isLikelyImageUrl(u)) ?? c.media_urls?.[0]
    const raw = resolveMediaUrl(media, apiUrl)
    return { card: c, img: raw && isLikelyImageUrl(raw) ? raw : null }
  })

  return (
    <Box minH="100dvh" bg="#D8DEE3" color="#0F0F0F" fontFamily="system-ui" pb="10">
      <Stack gap="4" px="4" pt="5" maxW="430px" mx="auto">
        <Flex align="center" justify="space-between">
          <Text fontSize="md" fontWeight="semibold" color="rgba(0,0,0,0.75)">
            Landing 2 (fan)
          </Text>
          <Flex gap="2">
            <Button
              size="sm"
              variant="outline"
              borderColor="rgba(0,0,0,0.14)"
              bg="rgba(255,255,255,0.65)"
              onClick={() => setVariant(Date.now())}
            >
              Другие
            </Button>
            <RouterLink to="/">
              <Button size="sm" variant="outline" borderColor="rgba(0,0,0,0.14)" bg="rgba(255,255,255,0.65)">
                Landing 1
              </Button>
            </RouterLink>
          </Flex>
        </Flex>

        <Text fontSize="4xl" fontWeight="semibold" lineHeight="0.95" letterSpacing="-0.6px">
          Hey!
          <br />
          What you upto?
        </Text>

        <Box position="relative" minH="520px">
          {loading ? <Text color="rgba(0,0,0,0.55)">Загружаем…</Text> : null}
          {!loading && preview.length < 3 ? (
            <Box borderRadius="2xl" bg="rgba(255,255,255,0.6)" border="1px solid rgba(0,0,0,0.08)" p="4">
              <Text fontWeight="semibold">Недостаточно постов с картинками</Text>
              <Text fontSize="sm" color="rgba(0,0,0,0.6)" mt="1">
                Нажми «Забрать из TG» в ленте, затем вернись сюда.
              </Text>
              <RouterLink to="/feed">
                <Button mt="3" bg="#0F0F0F" color="white">
                  Перейти в ленту
                </Button>
              </RouterLink>
            </Box>
          ) : null}

          {!loading && preview.length >= 3 ? (
            <>
              <FanCard
                idx={0}
                active={active}
                onActivate={(i) => setActive(i)}
                title={`ИИ‑бот (как пользователь) советует: ${(firstLine(preview[0].card.title) || "Ивент").slice(0, 60)}`}
                subtitle={`${preview[0].card.channel} • #${preview[0].card.message_id}`}
                img={preview[0].img}
                bg="#DA5B46"
              />
              <FanCard
                idx={1}
                active={active}
                onActivate={(i) => setActive(i)}
                title={`Рекомендация ИИ: ${(firstLine(preview[1].card.title) || "Ивент").slice(0, 70)}`}
                subtitle={`${preview[1].card.channel} • #${preview[1].card.message_id}`}
                img={preview[1].img}
                bg="#F4A8DE"
              />
              <FanCard
                idx={2}
                active={active}
                onActivate={(i) => setActive(i)}
                title={`Стоит посмотреть: ${(firstLine(preview[2].card.title) || "Ивент").slice(0, 70)}`}
                subtitle={`${preview[2].card.channel} • #${preview[2].card.message_id}`}
                img={preview[2].img}
                bg="#3ED47C"
              />
            </>
          ) : null}
        </Box>

        <RouterLink to="/feed">
          <Button bg="#0F0F0F" color="white" borderRadius="full">
            Открыть ленту
          </Button>
        </RouterLink>
      </Stack>
    </Box>
  )
}

