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
import { useState, useRef } from 'react'
import Column from './Column'
import AddColumn from './AddColumn'
import { LayoutGrid, Kanban } from 'lucide-react'
import { CardType, ColumnType } from './types'
import { moveCard, moveColumn, rebalanceCards, rebalanceColumns } from './actions'

type Layout = 'horizontal' | 'grid'

export default function Board({ boardId, initialColumns, currentRole }: {
  boardId: string
  initialColumns: ColumnType[]
  currentRole: 'owner' | 'editor' | 'viewer'
}) {
  const [columns, setColumns] = useState(initialColumns)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null)
  const [layout, setLayout] = useState<Layout>('horizontal')

  const dragSourceColId = useRef<string | null>(null)
  const dragDestColId = useRef<string | null>(null)
  const pendingRebalance = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }))

  function findColumn(cardId: string) {
    return columns.find(col => col.cards.some(c => c.id === cardId))
  }

  function onCardAdded(columnId: string, card: CardType) {
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

  function onCardUpdated(cardId: string, fields: Partial<CardType>) {
    setColumns(prev => prev.map(col => ({
      ...col,
      cards: col.cards.map(c => c.id === cardId ? { ...c, ...fields } : c)
    })))
  }

  function schedulRebalance(fn: () => void) {
    if (pendingRebalance.current) clearTimeout(pendingRebalance.current)
    pendingRebalance.current = setTimeout(fn, 500)
  }

  function onDragStart(event: DragStartEvent) {
    const { active } = event
    const col = columns.find(c => c.id === active.id)
    if (col) { setActiveColumn(col); return }
    const card = columns.flatMap(c => c.cards).find(c => c.id === active.id)
    if (card) {
      setActiveCard(card)
      dragSourceColId.current = findColumn(active.id as string)?.id ?? null
      dragDestColId.current = dragSourceColId.current
    }
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

    dragDestColId.current = overCol.id

    setColumns(prev => {
      const activeCard = activeCol.cards.find(c => c.id === active.id)!

      // Find where to insert in the destination column
      const overCardIndex = overCol.cards.findIndex(c => c.id === over.id)
      const insertIndex = overCardIndex >= 0 ? overCardIndex : overCol.cards.length

      return prev.map(col => {
        if (col.id === activeCol.id) {
          return { ...col, cards: col.cards.filter(c => c.id !== active.id) }
        }
        if (col.id === overCol.id) {
          const newCards = col.cards.filter(c => c.id !== active.id)
          newCards.splice(insertIndex, 0, activeCard)
          return { ...col, cards: newCards }
        }
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
      schedulRebalance(() => rebalanceColumns(newColumns.map(c => c.id)))
      dragSourceColId.current = null
      dragDestColId.current = null
      return
    }

    const sourceColId = dragSourceColId.current
    const destColId = dragDestColId.current
    dragSourceColId.current = null
    dragDestColId.current = null

    if (!sourceColId || !destColId) return

    if (sourceColId === destColId) {
      const col = columns.find(c => c.id === sourceColId)!
      const oldIndex = col.cards.findIndex(c => c.id === active.id)
      const newIndex = col.cards.findIndex(c => c.id === over.id)
      if (oldIndex === newIndex) return

      const reordered = arrayMove(col.cards, oldIndex, newIndex)
      setColumns(prev => prev.map(c =>
        c.id === sourceColId ? { ...c, cards: reordered } : c
      ))
      schedulRebalance(() => rebalanceCards(reordered.map(c => c.id)))
    } else {
      const destCol = columns.find(c => c.id === destColId)!
      const sourceCol = columns.find(c => c.id === sourceColId)!

      // Update column_id immediately, rebalance positions after debounce
      moveCard(active.id as string, destColId, 'a0', boardId)
      schedulRebalance(async () => {
        await rebalanceCards(destCol.cards.map(c => c.id))
        if (sourceCol.cards.length > 0) await rebalanceCards(sourceCol.cards.map(c => c.id))
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-4 shrink-0">
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setLayout('horizontal')}
            className={`flex flex-col cursor-pointer items-center gap-1 px-3 py-1.5 min-w-20 rounded-md text-xs font-medium 
              ${layout === 'horizontal'
                ? 'bg-white dark:bg-gray-700 text-indigo-800 dark:text-yellow-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <Kanban />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setLayout('grid')}
            className={`flex flex-col cursor-pointer items-center gap-1 px-3 py-1.5 min-w-20 rounded-md text-xs font-medium 
              ${layout === 'grid'
                ? 'bg-white dark:bg-gray-700 text-indigo-800 dark:text-yellow-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <LayoutGrid />
            <span>Grid</span>
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
                  currentRole={currentRole}
                  key={col.id}
                  id={col.id}
                  boardId={boardId}
                  title={col.title}
                  cards={col.cards}
                  layout={layout}
                  onCardAdded={onCardAdded}
                  onCardDeleted={onCardDeleted}
                  onCardUpdated={onCardUpdated}
                  onColumnDeleted={onColumnDeleted}
                />
              ))}
              <AddColumn
                boardId={boardId}
                onColumnAdded={onColumnAdded}
                lastPosition={columns[columns.length - 1]?.position ?? null}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4">
              {columns.map(col => (
                <Column
                  currentRole={currentRole}
                  key={col.id}
                  id={col.id}
                  boardId={boardId}
                  title={col.title}
                  cards={col.cards}
                  layout={layout}
                  onCardAdded={onCardAdded}
                  onCardDeleted={onCardDeleted}
                  onCardUpdated={onCardUpdated}
                  onColumnDeleted={onColumnDeleted}
                />
              ))}
              <div className="col-span-1 flex self-start">
                <AddColumn
                  boardId={boardId}
                  onColumnAdded={onColumnAdded}
                  lastPosition={columns[columns.length - 1]?.position ?? null}
                />
              </div>
            </div>
          )}
        </SortableContext>

        <DragOverlay>
          {activeCard && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-100 dark:border-gray-700 w-72 rotate-2">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{activeCard.title}</p>
            </div>
          )}
          {activeColumn && (
            <div className="bg-gray-200 dark:bg-gray-800 rounded-xl w-72 px-4 py-3 opacity-80 shadow-lg">
              <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{activeColumn.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}