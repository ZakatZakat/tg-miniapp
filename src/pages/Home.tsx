import * as React from "react"
import { Box, Flex, Stack, Text, Button, Badge } from "@chakra-ui/react"

type CardMock = { title: string; subtitle: string; price?: string; tag?: string; color: string }

const mockPicks: CardMock[] = [
  { title: "Комик Con 2022", subtitle: "Мвц Экспо, 21 ноября", price: "от 3 000 ₽", tag: "Фестиваль", color: "#FFEAB6" },
  { title: "Beach House", subtitle: "Крокус Сити Холл, 28 дек • 19:00", price: "от 3 000 ₽", tag: "Концерты", color: "#FFB4A8" },
  { title: "Лучшие выставки", subtitle: "Августа", price: "бесплатно", tag: "Выбор редакции", color: "#B7FFD4" },
]

export default function Home() {
  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #E8ECF5 0%, #F6F3EF 60%, #F6F3EF 100%)"
      color="#0F0F0F"
      fontFamily="system-ui"
      pb="10"
    >
      <Stack gap="6" px="3" pt="5" maxW="430px" mx="auto">
        {/* Header */}
        <Stack gap="2">
          <Text fontSize="xl" fontWeight="bold" letterSpacing="wide">
            EVENT FINDER APP
          </Text>
          <Badge bg="#111" color="white" px="3" py="1.5" borderRadius="full" width="fit-content">
            UX/UI DESIGN
          </Badge>
        </Stack>

        {/* Hero card */}
        <Box
          position="relative"
          overflow="hidden"
          borderRadius="xl"
          bg="#B8D7FF"
          p="5"
          minH="320px"
          border="2px solid #0F0F0F"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            position="absolute"
            inset="0"
            pointerEvents="none"
            opacity={0.2}
            bg="radial-gradient(circle at 20% 20%, #fff 0, transparent 30%), radial-gradient(circle at 80% 30%, #fff 0, transparent 25%), radial-gradient(circle at 40% 70%, #fff 0, transparent 30%)"
          />
          <Stack
            gap="4"
            w="260px"
            bg="rgba(255,255,255,0.9)"
            borderRadius="2xl"
            p="5"
            border="1px solid #0F0F0F"
            alignItems="center"
            textAlign="center"
          >
            <Text fontSize="lg" fontWeight="bold" letterSpacing="wide">
              LAZY
            </Text>
            <Text fontSize="sm" color="#2d2d2d">
              Сервис для поиска самых крутых мероприятий
            </Text>
            <Button bg="#0F0F0F" color="white" _hover={{ bg: "#1c1c1c" }} borderRadius="full">
              Войти
            </Button>
            <Text fontSize="xs" color="#4a4a4a">
              Или войти через
            </Text>
            <Flex gap="2">
              {["F", "vk", "tg", "m", ""].map((s) => (
                <Box
                  key={s}
                  w="9"
                  h="9"
                  borderRadius="full"
                  border="1px solid #0F0F0F"
                  bg="white"
                  display="grid"
                  placeItems="center"
                  fontSize="xs"
                >
                  {s}
                </Box>
              ))}
            </Flex>
            <Text fontSize="xs" color="#4a4a4a">
              Еще нет аккаунта? <u>Зарегистрируйтесь</u>
            </Text>
          </Stack>
        </Box>

        {/* Picks */}
        <Stack gap="3">
          <Flex align="center" gap="2">
            <Text fontSize="lg" fontWeight="semibold">
              Для тебя
            </Text>
            <Badge borderRadius="full" px="3" py="1" bg="#111" color="white">
              Москва
            </Badge>
          </Flex>
          <Stack gap="3">
            {mockPicks.map((card, idx) => (
              <Box key={idx} border="2px solid #0F0F0F" borderRadius="xl" bg={card.color} p="4" boxShadow="sm">
                <Flex justify="space-between" align="center" mb="2">
                  <Badge borderRadius="full" px="3" py="1" bg="#0F0F0F" color="white" textTransform="none">
                    {card.tag}
                  </Badge>
                  {card.price && (
                    <Badge borderRadius="full" px="3" py="1" bg="white" color="#0F0F0F" border="1px solid #0F0F0F" textTransform="none">
                      {card.price}
                    </Badge>
                  )}
                </Flex>
                <Text fontWeight="bold">{card.title}</Text>
                <Text fontSize="sm" mt="1" color="#222">
                  {card.subtitle}
                </Text>
              </Box>
            ))}
          </Stack>
        </Stack>

        {/* About block */}
        <Stack gap="2" border="2px solid #0F0F0F" borderRadius="xl" p="4" bg="white">
          <Text fontWeight="bold">О проекте</Text>
          <Text fontSize="sm" color="#2d2d2d">
            Помогаем найти куда сходить: концерты, выставки, вечеринки и лучшие события Москвы. Отбираем по интересам, дате и стоимости.
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}


