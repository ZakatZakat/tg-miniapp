import { useEffect, useState } from "react"

type EventCard = {
  id: string
  title: string
  description?: string | null
  channel: string
  message_id: number
  created_at: string
}

const MOCK_EVENTS: EventCard[] = [
  {
    id: "mock-1",
    title: "Концерт на крыше",
    description: "20:00, Арбат 1",
    channel: "@gzsmsk",
    message_id: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    title: "Выставка",
    description: "Сегодня, ARTPLAY",
    channel: "@gzsmsk",
    message_id: 2,
    created_at: new Date().toISOString(),
  },
]

export default function Home() {
  const [events, setEvents] = useState<EventCard[]>(MOCK_EVENTS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:8000/events")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as EventCard[]
        if (data.length) setEvents(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      }
    }
    void load()
  }, [])

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", color: "#fff" }}>
      <h1>Афиша Москвы</h1>
      {error && <div style={{ marginTop: 8, color: "tomato" }}>Ошибка: {error}</div>}
      <ul style={{ marginTop: 12 }}>
        {events.map((ev) => (
          <li key={ev.id}>
            <strong>{ev.title}</strong> — {ev.description ?? ""} <small>({ev.channel})</small>
          </li>
        ))}
      </ul>
    </div>
  )
}


