'use client'

import { useRef, useState } from 'react'
import { createColumn } from './actions'

type Props = {
  boardId: string
  onColumnAdded: (column: { id: string; title: string; position: number; wip_limit: number | null; cards: [] }) => void
}

export default function AddColumn({ boardId, onColumnAdded }: Props) {
  const [adding, setAdding] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    const title = formData.get('title') as string
    const tempColumn = {
      id: crypto.randomUUID(),
      title,
      position: 0,
      wip_limit: null,
      cards: [] as [],
    }
    onColumnAdded(tempColumn)
    formRef.current?.reset()
    setAdding(false)
    await createColumn(boardId, formData)
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="bg-gray-200 dark:bg-gray-800 bg-opacity-70 hover:bg-opacity-100 rounded-xl w-72 shrink-0 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-left transition-all"
      >
        + Add column
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-gray-200 dark:bg-gray-800 rounded-xl w-72 shrink-0 p-3 flex flex-col gap-2"
    >

      <input
        name="title"
        type="text"
        placeholder="Column title..."
        autoFocus
        autoComplete="off"
        required
        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg outline-none border border-gray-100 dark:border-gray-700"
      />
      <div className="flex gap-2">
        <button type="submit" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">
          Add column
        </button>
        <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </form>
  )
}