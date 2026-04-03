import { createClient } from '@/lib/supabase/server'

export type BoardRole = 'owner' | 'editor' | 'viewer' | null

export async function getBoardRole(boardId: string): Promise<BoardRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: board } = await supabase
    .from('boards')
    .select('owner_id')
    .eq('id', boardId)
    .single()

  if (board?.owner_id === user.id) return 'owner'

  const { data: member } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .single()

  return (member?.role as BoardRole) ?? null
}