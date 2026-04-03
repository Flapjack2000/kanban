import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=/invite/${token}`, request.url))
  }

  const { data: invite } = await supabaseAdmin
    .from('board_invites')
    .select('id, board_id, role, expires_at')
    .eq('token', token)
    .single()

  if (!invite) {
    return NextResponse.redirect(new URL('/boards?error=invalid_invite', request.url))
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/boards?error=expired_invite', request.url))
  }

  const { data: board } = await supabaseAdmin
    .from('boards')
    .select('owner_id')
    .eq('id', invite.board_id)
    .single()

  if (board?.owner_id !== user.id) {
    await supabaseAdmin
      .from('board_members')
      .upsert(
        { board_id: invite.board_id, user_id: user.id, role: invite.role },
        { onConflict: 'board_id,user_id' }
      )
  }

  return NextResponse.redirect(new URL(`/boards/${invite.board_id}`, request.url))
}