// src/App.tsx
import * as React from "react"
import { Outlet } from "@tanstack/react-router"
import { Box, Container, Flex, Heading, Spacer } from "@chakra-ui/react"
import { ColorModeButton, useColorMode, useColorModeValue } from "./components/ui/colore-mode"

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


