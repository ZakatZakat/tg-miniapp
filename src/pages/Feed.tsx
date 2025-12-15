import * as React from "react"
import { Badge, Box, Flex, Image, Stack, Text } from "@chakra-ui/react"
import hbPartyImg from "../assets/hb-party.jpg"

type CardMock = { title: string; subtitle: string; price?: string; tag?: string; color: string; image?: string }

const mockPicks: CardMock[] = [
  {
    title: "HB PARTY P.2",
    subtitle: "Лампопо, 14 дек • 18:00 — мастер-класс, маркет, концерт",
    price: "вход свободный",
    tag: "Фестиваль",
    color: "#F9D7C3",
    image: hbPartyImg,
  },
  { title: "Комик Con 2022", subtitle: "Мвц Экспо, 21 ноября", price: "от 3 000 ₽", tag: "Фестиваль", color: "#FFEAB6" },
  { title: "Beach House", subtitle: "Крокус Сити Холл, 28 дек • 19:00", price: "от 3 000 ₽", tag: "Концерты", color: "#FFB4A8" },
  { title: "Лучшие выставки", subtitle: "Августа", price: "бесплатно", tag: "Выбор редакции", color: "#B7FFD4" },
]

export default function Feed() {
  return (
    <Box px="4" py="6">
      <Stack gap="5">
        <Stack gap="1">
          <Text fontSize="lg" fontWeight="bold">
            Лента событий
          </Text>
          <Text color="fg.muted">Карточки и свайпы — скоро. Пока подборка “Для тебя”.</Text>
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
          <Stack gap="3">
            {mockPicks.map((card, idx) => (
              <Box key={idx} border="2px solid #0F0F0F" borderRadius="xl" bg={card.color} p="4" boxShadow="sm">
                {card.image ? (
                  <Box mb="3" borderRadius="lg" overflow="hidden" border="1px solid #0F0F0F">
                    <Image src={card.image} alt={card.title} width="100%" height="auto" objectFit="cover" />
                  </Box>
                ) : null}

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
      </Stack>
    </Box>
  )
}

