import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Board from './BoardClient'
import Link from 'next/link'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: board } = await supabase
    .from('boards')
    .select(`
      id, title,
      columns (
        id, title, position, wip_limit,
        cards (
          id, title, position, priority, due_date
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!board) notFound()

  const sortedColumns = [...(board.columns ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(col => ({
      ...col,
      cards: [...(col.cards ?? [])].sort((a, b) => a.position - b.position)
    }))

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/boards"
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Boards
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-900 dark:text-white font-medium">{board.title}</span>
        </nav>
      </div>
      <div className="flex-1 overflow-x-auto p-6">
        <Board boardId={board.id} initialColumns={sortedColumns} />
      </div>
    </div>
  )
}