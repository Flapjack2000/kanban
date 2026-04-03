'use client'

import { useRef, useState } from 'react'
import { createCard, deleteCard, deleteColumn } from './actions'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Card = {
  id: string
  title: string
  priority: string | null
  due_date: string | null
  position: number
}

type Props = {
  id: string
  boardId: string
  title: string
  cards: Card[]
  layout: 'horizontal' | 'grid'
  onCardAdded: (columnId: string, card: Card) => void
  onCardDeleted: (columnId: string, cardId: string) => void
  onColumnDeleted: (columnId: string) => void
}

function CardItem({ card, boardId, onCardDeleted }: {
  card: Card
  boardId: string
  onCardDeleted: (columnId: string, cardId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  async function handleDelete() {
    if (confirm('Delete this card?')) {
      onCardDeleted('', card.id)
      await deleteCard(card.id, boardId)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="group bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-2">
        <p {...attributes} {...listeners} className="text-sm font-medium text-gray-800 dark:text-gray-100 cursor-grab flex-1">
          {card.title}
        </p>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs shrink-0"
        >
          ✕
        </button>
      </div>
      {card.priority && (
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${card.priority === 'urgent' ? 'bg-red-100 text-red-700' :
            card.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              card.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
          }`}>
          {card.priority}
        </span>
      )}
    </div>
  )
}

export default function Column({ id, boardId, title, cards, layout, onCardAdded, onCardDeleted, onColumnDeleted }: Props) {
  const [adding, setAdding] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  async function handleAddCard(formData: FormData) {
    const title = formData.get('title') as string
    const tempCard: Card = {
      id: crypto.randomUUID(),
      title,
      priority: null,
      due_date: null,
      position: cards.length,
    }
    onCardAdded(id, tempCard)
    formRef.current?.reset()
    setAdding(false)
    await createCard(id, boardId, formData)
  }

  async function handleDeleteColumn() {
    if (confirm(`Delete "${title}" and all its cards?`)) {
      onColumnDeleted(id)
      await deleteColumn(id, boardId)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/col bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0 flex flex-col ${layout === 'horizontal' ? 'w-72' : 'w-full'
        }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="px-4 py-3 flex items-center justify-between cursor-grab"
      >
        <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{cards.length}</span>
          <button
            onClick={handleDeleteColumn}
            onPointerDown={e => e.stopPropagation()}
            className="opacity-0 group-hover/col:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              boardId={boardId}
              onCardDeleted={onCardDeleted}
            />
          ))}
        </SortableContext>

        {adding ? (
          <form ref={formRef} action={handleAddCard} className="bg-white dark:bg-gray-900 rounded-lg p-2 shadow-sm border border-gray-100 dark:border-gray-700">
            <input
              name="title"
              type="text"
              placeholder="Card title..."
              autoFocus
              autoComplete="off"
              required
              className="w-full text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none bg-white dark:bg-gray-900"
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-left px-1 py-1 transition-colors"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  )
}