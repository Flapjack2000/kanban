import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Board from './BoardClient'
import BoardHeader from './BoardHeader'
import { getBoardRole } from '@/lib/boardRole'
import { redirect } from 'next/navigation'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await getBoardRole(id)
  if (!role) notFound()

  const { data: board } = await supabase
    .from('boards')
    .select(`
      id, title, owner_id,
      columns (
        id, title, position, wip_limit,
        cards (
          id, title, description, position, priority, due_date
        )
      ),
      board_members (
        user_id, role,
        profiles ( username )
      ),
      board_invites (
        id, token, role, expires_at
      )
    `)
    .eq('id', id)
    .single()

  if (!board) notFound()

  // Build full members list including owner
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', board.owner_id)
    .single()

  const members = [
    { user_id: board.owner_id, role: 'owner', profiles: ownerProfile },
    ...(board.board_members ?? []),
  ]

  const sortedColumns = [...(board.columns ?? [])]
    .sort((a, b) => a.position < b.position ? -1 : 1)
    .map(col => ({
      ...col,
      cards: [...(col.cards ?? [])].sort((a, b) => a.position < b.position ? -1 : 1)
    }))

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      <BoardHeader
        boardId={board.id}
        title={board.title}
        currentUserId={user.id}
        currentRole={role}
        members={members}
        invites={board.board_invites ?? []}
      />
      <div className="flex-1 overflow-x-auto p-6">
        <Board boardId={board.id} initialColumns={sortedColumns} currentRole={role} />
      </div>
    </div>
  )
}