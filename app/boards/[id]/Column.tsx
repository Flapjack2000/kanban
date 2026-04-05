'use client'

import { useRef, useState } from 'react'
import { createCard, deleteCard, deleteColumn, renameColumn } from './actions'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X } from 'lucide-react'
import CardModal from './CardModal'
import { CardType } from './types'
import { generateKeyBetween } from 'fractional-indexing'

type CardItemProps = {
  card: CardType
  boardId: string
  columnTitle: string
  onCardDeleted: (cardId: string) => void
  onCardUpdated: (cardId: string, fields: Partial<CardType>) => void
  currentRole: 'owner' | 'editor' | 'viewer'
}

type ColumnProps = {
  id: string
  boardId: string
  title: string
  cards: CardType[]
  layout: 'horizontal' | 'grid'
  currentRole: 'owner' | 'editor' | 'viewer'
  onCardAdded: (columnId: string, card: CardType) => void
  onCardDeleted: (cardId: string) => void
  onColumnDeleted: (columnId: string) => void
  onCardUpdated: (cardId: string, fields: Partial<CardType>) => void
}

function CardItem({ card, boardId, columnTitle, onCardDeleted, onCardUpdated, currentRole }: CardItemProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [localCard, setLocalCard] = useState(card)
  const [dragging, setDragging] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const dragListeners = currentRole !== 'viewer' ? {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      setDragging(true)
      listeners?.onPointerDown?.(e)
    },
    onPointerUp: () => setDragging(false),
  } : {}

  async function handleDelete() {
    if (!confirm('Delete this card?')) return
    onCardDeleted(card.id)
    await deleteCard(card.id, boardId)
  }

  function handleUpdate(cardId: string, fields: Partial<CardType>) {
    setLocalCard(prev => ({ ...prev, ...fields }))
    onCardUpdated(cardId, fields)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => { if (!dragging) setModalOpen(true) }}
        className={`group bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700 ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...dragListeners}
            className="flex-1"
          >
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {localCard.title}
            </p>
          </div>
          {currentRole !== 'viewer' && (
            <button
              onClick={e => { e.stopPropagation(); handleDelete() }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {localCard.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${localCard.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
              localCard.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                localCard.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
              {localCard.priority}
            </span>
          )}
          {localCard.due_date && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${new Date(localCard.due_date) < new Date()
              ? 'bg-red-50 text-red-500 dark:bg-red-900 dark:text-red-300'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
              {new Date(localCard.due_date).toLocaleDateString()}
            </span>
          )}
          {localCard.description && (
            <span className="text-xs hyphens-auto text-gray-400 dark:text-gray-500">
              {localCard.description.length > 250
                ? `${localCard.description.slice(0, 250).trim()}...`
                : localCard.description}
            </span>
          )}
        </div>
      </div>

      {modalOpen && (
        <CardModal
          card={localCard}
          boardId={boardId}
          columnTitle={columnTitle}
          onClose={() => setModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}

export default function Column({ currentRole, id, boardId, title, cards, layout, onCardAdded, onCardDeleted, onColumnDeleted, onCardUpdated }: ColumnProps) {
  const [adding, setAdding] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [columnTitle, setColumnTitle] = useState(title)
  const formRef = useRef<HTMLFormElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const dragProps = currentRole !== 'viewer' ? { ...attributes, ...listeners } : {}

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  async function handleAddCard(formData: FormData) {
    const title = formData.get('title') as string
    const lastPosition = cards[cards.length - 1]?.position ?? null
    const tempCard: CardType = {
      id: crypto.randomUUID(),
      title,
      description: null,
      priority: null,
      due_date: null,
      position: generateKeyBetween(lastPosition, null),
    }
    onCardAdded(id, tempCard)
    formRef.current?.reset()
    setAdding(false)
    await createCard(id, boardId, formData)
  }

  async function handleDeleteColumn() {
    if (!confirm(`Delete "${columnTitle}" and all its cards?`)) return
    await deleteColumn(id, boardId)
    onColumnDeleted(id)
  }

  async function handleRenameColumn() {
    if (columnTitle.trim() && columnTitle !== title) {
      await renameColumn(id, columnTitle.trim(), boardId)
    }
    setEditingTitle(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/col bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0 flex flex-col ${layout === 'horizontal' ? 'w-72' : 'w-full'}`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {editingTitle ? (
          <input
            autoFocus
            value={columnTitle}
            onChange={e => setColumnTitle(e.target.value)}
            onBlur={handleRenameColumn}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRenameColumn()
              if (e.key === 'Escape') { setColumnTitle(title); setEditingTitle(false) }
            }}
            className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent outline-none border-b border-indigo-400"
          />
        ) : (
          <span
            {...dragProps}
            onDoubleClick={() => setEditingTitle(true)}
            className={`font-medium text-sm text-gray-700 dark:text-gray-200 flex-1 ${currentRole !== 'viewer' ? 'cursor-grab' : 'cursor-default'}`}
          >
            {columnTitle}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{cards.length}</span>
          {currentRole !== 'viewer' && (
            <button
              onClick={handleDeleteColumn}
              onPointerDown={e => e.stopPropagation()}
              className="opacity-0 group-hover/col:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              boardId={boardId}
              columnTitle={title}
              onCardDeleted={onCardDeleted}
              onCardUpdated={onCardUpdated}
              currentRole={currentRole}
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
              className="w-full text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none bg-transparent"
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          currentRole !== 'viewer' && (
            <button
              onClick={() => setAdding(true)}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-left px-1 py-1 transition-colors"
            >
              <span className="flex gap-2 items-center"><Plus size={16} /> Add card</span>
            </button>
          )
        )}
      </div>
    </div>
  )
}