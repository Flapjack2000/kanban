export type CardType = {
  id: string
  title: string
  description: string | null
  priority: string | null
  due_date: string | null
  position: string
}

export type ColumnType = {
  id: string
  title: string
  position: string
  wip_limit: number | null
  cards: CardType[]
}