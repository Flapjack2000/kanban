export type CardType = {
  id: string
  title: string
  description: string | null
  priority: string | null
  due_date: string | null
  position: number
}

export type ColumnType = {
  id: string
  title: string
  position: number
  wip_limit: number | null
  cards: CardType[]
}