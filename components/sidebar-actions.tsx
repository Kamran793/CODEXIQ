'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { type Chat, ServerActionResult } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  IconShare,
  IconSpinner,
  IconTrash,
  IconUsers,
  IconEdit
} from '@/components/ui/icons'
import Link from 'next/link'
import { badgeVariants } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface SidebarActionsProps {
  chat: Chat
  removeChat: (args: { id: string; path: string }) => ServerActionResult<void>
  shareChat: (chat: Chat) => ServerActionResult<Chat>
  renameChat: (args: { id: string; title: string }) => ServerActionResult<void>
}

export function SidebarActions({
  chat,
  removeChat,
  shareChat,
  renameChat
}: SidebarActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [isRemovePending, startRemoveTransition] = React.useTransition()
  const [isSharePending, startShareTransition] = React.useTransition()
  const [isRenamePending, startRenameTransition] = React.useTransition()
  const [newTitle, setNewTitle] = React.useState(chat.title)
  const router = useRouter()

  const copyShareLink = React.useCallback(async (chat: Chat) => {
    if (!chat.sharePath) {
      return toast.error('Could not copy share link to clipboard')
    }

    const url = new URL(window.location.href)
    url.pathname = chat.sharePath
    navigator.clipboard.writeText(url.toString())
    setShareDialogOpen(false)
    toast.success('Share link copied to clipboard', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        fontSize: '14px'
      },
      iconTheme: {
        primary: 'white',
        secondary: 'black'
      }
    })
  }, [])

  return (
    <>
      <div className="space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-background"
              onClick={() => setShareDialogOpen(true)}
            >
              <IconShare />
              <span className="sr-only">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-background"
              onClick={() => setRenameDialogOpen(true)}
            >
              <span className="sr-only">Rename</span>
              <IconEdit />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rename chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-background"
              disabled={isRemovePending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete chat</TooltipContent>
        </Tooltip>
      </div>
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Change the title of your chat.
            </DialogDescription>
          </DialogHeader>
          <input
            className="w-full border rounded px-2 py-1 mt-2"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            disabled={isRenamePending}
            maxLength={100}
          />
          <DialogFooter>
            <Button
              disabled={isRenamePending || !newTitle.trim() || newTitle === chat.title}
              onClick={() => {
                startRenameTransition(async () => {
                  const result = await renameChat({ id: chat.id, title: newTitle.trim() })
                  if (result && 'error' in result) {
                    toast.error(result.error)
                    return
                  }
                  setRenameDialogOpen(false)
                  router.refresh()
                  toast.success('Chat renamed')
                })
              }}
            >
              {isRenamePending ? <IconSpinner className="mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share link to chat</DialogTitle>
            <DialogDescription>
              Anyone with the URL will be able to view the shared chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 rounded-md border p-4 text-sm">
            <div className="font-medium">{chat.title}</div>
            <div className="text-muted-foreground">
              {formatDate(chat.createdAt)} · {chat.messages.length} messages
            </div>
          </div>
          <DialogFooter className="items-center">
            {chat.sharePath && (
              <Link
                href={chat.sharePath}
                className={cn(
                  badgeVariants({ variant: 'secondary' }),
                  'mr-auto'
                )}
                target="_blank"
              >
                <IconUsers className="mr-2" />
                {chat.sharePath}
              </Link>
            )}
            <Button
              disabled={isSharePending}
              onClick={() => {
                startShareTransition(async () => {
                  if (chat.sharePath) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    copyShareLink(chat)
                    return
                  }

                  const result = await shareChat(chat)

                  if (result && 'error' in result) {
                    toast.error(result.error)
                    return
                  }

                  copyShareLink(result)
                })
              }}
            >
              {isSharePending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                <>Copy link</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovePending}
              onClick={event => {
                event.preventDefault()
                startRemoveTransition(async () => {
                  const result = await removeChat({
                    id: chat.id,
                    path: chat.path
                  })

                  if (result && 'error' in result) {
                    toast.error(result.error)
                    return
                  }

                  setDeleteDialogOpen(false)
                  router.refresh()
                  router.push('/')
                  toast.success('Chat deleted')
                })
              }}
            >
              {isRemovePending && <IconSpinner className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
