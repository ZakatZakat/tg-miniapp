// src/App.tsx
import * as React from "react"
import { Outlet } from "@tanstack/react-router"
import { Box, Container, Flex, Heading, Spacer, Link } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import { ColorModeButton, useColorMode, useColorModeValue } from "./components/ui/color-mode"

declare global {
  interface Window { Telegram?: { WebApp?: any } }
}

export default function App() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined
  const { setColorMode } = useColorMode()

  React.useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand?.()
    // Sync Chakra color mode with Telegram’s scheme if provided
    if (tg.colorScheme === "dark" || tg.colorScheme === "light") {
      setColorMode(tg.colorScheme)
    }
  }, [tg, setColorMode])

  const bg = useColorModeValue("gray.50", "gray.900")
  const fg = useColorModeValue("gray.800", "gray.100")

  return (
    <Box minH="100dvh" bg={bg} color={fg}>
      <Container maxW="container.md" py="4">
        <Flex align="center" gap="4">
          <Heading size="md">Telegram Mini App</Heading>
          <Flex gap="3">
            <Link asChild>
              <RouterLink to="/">Landing</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/landing-2">Landing 2</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/landing-3">Landing 3</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/landing-5">Landing 5</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/landing-6">Landing 6</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/feed">Feed</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/about">About</RouterLink>
            </Link>
            <Link asChild>
              <RouterLink to="/profile">Profile</RouterLink>
            </Link>
          </Flex>
          <Spacer />
          <ColorModeButton />
        </Flex>
      </Container>
      <Container maxW="container.md" pb="8">
        <Outlet />
      </Container>
    </Box>
  )
}


