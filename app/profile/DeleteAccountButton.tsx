'use client'

import { deleteAccount } from './actions'

export default function DeleteAccountButton() {
  async function handleClick() {
    if (!confirm('Delete your account? This cannot be undone. \nThis will also delete all of the boards you own.')) return
    await deleteAccount()
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-red-500 hover:underline"
    >
      Delete account
    </button>
  )
}