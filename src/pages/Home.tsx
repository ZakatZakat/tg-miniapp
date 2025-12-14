// src/pages/Home.tsx
import * as React from "react"
import { Button, Card, Heading, Stack, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

type TelegramUser = {
  id: number
  firstName: string
  lastName?: string
  username?: string
}

const decodeComponent = (value: string): string => {
  let current = value
  for (let attempts = 0; attempts < 5; attempts += 1) {
    if (!/%[0-9a-fA-F]{2}/.test(current)) break
    try {
      const next = decodeURIComponent(current)
      if (next === current) break
      current = next
    } catch {
      break
    }
  }
  return current
}

const extractTelegramUser = (): TelegramUser | null => {
  if (typeof window === "undefined") return null
  const webApp = window.Telegram?.WebApp
  const parseUser = (payload: unknown): TelegramUser | null => {
    if (!payload || typeof payload !== "object") return null
    const raw = payload as Record<string, unknown>
    const id = Number(raw.id)
    const firstName = typeof raw.first_name === "string" ? raw.first_name : undefined
    if (!Number.isFinite(id) || !firstName) return null
    return {
      id,
      firstName,
      lastName: typeof raw.last_name === "string" ? raw.last_name : undefined,
      username: typeof raw.username === "string" ? raw.username : undefined,
    }
  }

  if (webApp) {
    const unsafeUser = webApp.initDataUnsafe?.user
    const parsedUnsafe = parseUser(unsafeUser)
    if (parsedUnsafe) return parsedUnsafe

    const rawInitData = webApp.initData
    if (rawInitData) {
      const params = new URLSearchParams(rawInitData)
      const userParam = params.get("user")

      if (userParam) {
        try {
          const parsed = JSON.parse(userParam)
          const fromInitData = parseUser(parsed)
          if (fromInitData) return fromInitData
        } catch (error) {
          console.warn("Failed to parse Telegram user from initData", error)
        }
      }
    }
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash
  const hashParams = new URLSearchParams(hash)
  const tgWebAppDataRaw = hashParams.get("tgWebAppData")
  const tgWebAppData = tgWebAppDataRaw ? decodeComponent(tgWebAppDataRaw) : null
  if (!tgWebAppData) return null

  try {
    const nestedParams = new URLSearchParams(tgWebAppData)
    const nestedUser = nestedParams.get("user")
    if (!nestedUser) return null
    const parsed = JSON.parse(decodeComponent(nestedUser))
    return parseUser(parsed)
  } catch (error) {
    console.warn("Failed to parse Telegram user from tgWebAppData", error)
    return null
  }

  return null
}

export default function Home() {
  const [user, setUser] = React.useState<TelegramUser | null>(() => extractTelegramUser())
  const [debugData, setDebugData] = React.useState<{
    initDataUnsafe: string
    initData: string
    locationHash: string
    tgWebAppDataRaw: string
    tgWebAppDataDecoded: string
    telegramAvailable: boolean
  }>(() => ({
    initDataUnsafe: "",
    initData: "",
    locationHash: "",
    tgWebAppDataRaw: "",
    tgWebAppDataDecoded: "",
    telegramAvailable: typeof window !== "undefined" ? Boolean(window.Telegram?.WebApp) : false,
  }))

  React.useEffect(() => {
    if (user) return
    const timer = window.setInterval(() => {
      const nextUser = extractTelegramUser()
      if (!nextUser) return
      setUser(nextUser)
      window.clearInterval(timer)
    }, 500)

    return () => window.clearInterval(timer)
  }, [user])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const webApp = window.Telegram?.WebApp
    const hash = window.location.hash
    const trimmedHash = hash.startsWith("#") ? hash.slice(1) : hash
    const hashParams = new URLSearchParams(trimmedHash)
    const tgWebAppDataRaw = hashParams.get("tgWebAppData") ?? ""
    const tgWebAppDataDecoded = tgWebAppDataRaw ? decodeComponent(tgWebAppDataRaw) : ""

    setDebugData({
      initDataUnsafe: JSON.stringify(webApp?.initDataUnsafe, null, 2),
      initData: webApp?.initData ?? "",
      locationHash: hash,
      tgWebAppDataRaw,
      tgWebAppDataDecoded,
      telegramAvailable: Boolean(webApp),
    })
  }, [])

  const displayName = React.useMemo(() => {
    if (!user) return null
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    if (fullName) return fullName
    if (user.username) return `@${user.username}`
    return `ID ${user.id}`
  }, [user])

  return (
    <Stack gap="4" py="6">
      <Heading size="lg">{displayName ? `Привет, ${displayName}!` : "Привет из Telegram 👋"}</Heading>
      <Card.Root>
        <Card.Body>
          <Text>
            {user
              ? `Ваш Telegram ID: ${user.id}${user.username ? ` (@${user.username})` : ""}.`
              : "Откройте приложение из Telegram, чтобы увидеть персональное обращение."}
          </Text>
          <Text mt="2">Chakra v3 + TanStack Router + Telegram WebApp.</Text>
        </Card.Body>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Heading size="md">Debug info</Heading>
        </Card.Header>
        <Card.Body>
          <Text fontSize="sm" whiteSpace="pre-wrap">
            initDataUnsafe:
            {"\n"}
            {debugData.initDataUnsafe || "<empty>"}
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" mt="3">
            initData:
            {"\n"}
            {debugData.initData || "<empty>"}
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" mt="3">
            location.hash:
            {"\n"}
            {debugData.locationHash || "<empty>"}
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" mt="3">
            tgWebAppData (raw):
            {"\n"}
            {debugData.tgWebAppDataRaw || "<empty>"}
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" mt="3">
            tgWebAppData (decoded):
            {"\n"}
            {debugData.tgWebAppDataDecoded || "<empty>"}
          </Text>
          <Text fontSize="sm" mt="3">
            Telegram.WebApp detected: {debugData.telegramAvailable ? "yes" : "no"}
          </Text>
        </Card.Body>
      </Card.Root>
      <Button asChild variant="solid">
        <Link to="/about">Go to About</Link>
      </Button>
    </Stack>
  )
}
