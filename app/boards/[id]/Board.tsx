'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import Column from './Column'
import AddColumn from './AddColumn'
import { moveCard, moveColumn } from './actions'

type Card = {
  id: string
  title: string
  priority: string | null
  due_date: string | null
  position: number
}

type ColumnType = {
  id: string
  title: string
  position: number
  wip_limit: number | null
  cards: Card[]
}

type Layout = 'horizontal' | 'grid'

export default function Board({ boardId, initialColumns }: { boardId: string, initialColumns: ColumnType[] }) {
  const [columns, setColumns] = useState(initialColumns)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null)
  const [layout, setLayout] = useState<Layout>('horizontal')

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }))

  function findColumn(cardId: string) {
    return columns.find(col => col.cards.some(c => c.id === cardId))
  }

  function onCardAdded(columnId: string, card: Card) {
    setColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
    ))
  }

  function onCardDeleted(cardId: string) {
    setColumns(prev => prev.map(col => ({
      ...col,
      cards: col.cards.filter(c => c.id !== cardId)
    })))
  }

  function onColumnAdded(column: ColumnType) {
    setColumns(prev => [...prev, column])
  }

  function onColumnDeleted(columnId: string) {
    setColumns(prev => prev.filter(col => col.id !== columnId))
  }

  function onDragStart(event: DragStartEvent) {
    const { active } = event
    const col = columns.find(c => c.id === active.id)
    if (col) { setActiveColumn(col); return }
    const card = columns.flatMap(c => c.cards).find(c => c.id === active.id)
    if (card) setActiveCard(card)
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const isActiveCard = columns.flatMap(c => c.cards).some(c => c.id === active.id)
    if (!isActiveCard) return

    const activeCol = findColumn(active.id as string)
    const overCol = columns.find(c => c.id === over.id)
      ?? findColumn(over.id as string)

    if (!activeCol || !overCol || activeCol.id === overCol.id) return

    setColumns(prev => {
      const activeCard = activeCol.cards.find(c => c.id === active.id)!
      return prev.map(col => {
        if (col.id === activeCol.id) return { ...col, cards: col.cards.filter(c => c.id !== active.id) }
        if (col.id === overCol.id) return { ...col, cards: [...col.cards, activeCard] }
        return col
      })
    })
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    setActiveColumn(null)
    if (!over || active.id === over.id) return

    const isColumn = columns.some(c => c.id === active.id)

    if (isColumn) {
      const oldIndex = columns.findIndex(c => c.id === active.id)
      const newIndex = columns.findIndex(c => c.id === over.id)
      if (oldIndex === newIndex) return
      const newColumns = arrayMove(columns, oldIndex, newIndex)
      setColumns(newColumns)
      moveColumn(active.id as string, newIndex, boardId)
      return
    }

    const activeCol = findColumn(active.id as string)
    if (!activeCol) return

    const oldIndex = activeCol.cards.findIndex(c => c.id === active.id)
    const newIndex = activeCol.cards.findIndex(c => c.id === over.id)

    if (oldIndex !== newIndex) {
      setColumns(prev => prev.map(col => {
        if (col.id !== activeCol.id) return col
        return { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) }
      }))
    }

    moveCard(active.id as string, activeCol.id, newIndex, boardId)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Layout toggle */}
      <div className="flex justify-end mb-4 shrink-0">
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setLayout('horizontal')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${layout === 'horizontal'
              ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            ⇔ Kanban
          </button>
          <button
            onClick={() => setLayout('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${layout === 'horizontal'
              ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            ⊞ Grid
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {layout === 'horizontal' ? (
            <div className="flex gap-4 items-start overflow-x-auto pb-4">
              {columns.map(col => (
                <Column
                  key={col.id}
                  id={col.id}
                  boardId={boardId}
                  title={col.title}
                  cards={col.cards}
                  layout={layout}
                  onCardAdded={onCardAdded}
                  onCardDeleted={onCardDeleted}
                  onColumnDeleted={onColumnDeleted}
                />
              ))}
              <AddColumn boardId={boardId} onColumnAdded={onColumnAdded} />
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4">
              {columns.map(col => (
                <Column
                  key={col.id}
                  id={col.id}
                  boardId={boardId}
                  title={col.title}
                  cards={col.cards}
                  layout={layout}
                  onCardAdded={onCardAdded}
                  onCardDeleted={onCardDeleted}
                  onColumnDeleted={onColumnDeleted}
                />
              ))}
              <AddColumn boardId={boardId} onColumnAdded={onColumnAdded} />
            </div>
          )}
        </SortableContext>

        <DragOverlay>
          {activeCard && (
            <div className="bg-white rounded-lg p-3 shadow-lg border border-gray-100 w-72 rotate-2">
              <p className="text-sm font-medium text-gray-800">{activeCard.title}</p>
            </div>
          )}
          {activeColumn && (
            <div className="bg-gray-200 rounded-xl w-72 px-4 py-3 opacity-80 shadow-lg">
              <span className="font-medium text-sm text-gray-700">{activeColumn.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}