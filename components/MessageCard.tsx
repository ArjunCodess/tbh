'use client'

import React from 'react'
import axios from 'axios'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Eye, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from './ui/button'
import { toast } from 'sonner'
import type { Message } from '@/lib/models/message.schema'
import type { apiResponse } from '@/types/apiResponse'
import Link from 'next/link'

dayjs.extend(relativeTime)

type MessageCardProps = {
  message: Message
  onMessageDelete: (messageId: string) => void
}

export default function MessageCard({ message, onMessageDelete }: MessageCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true)
      const response = await axios.delete<apiResponse>(`/api/delete-message/${message._id}`)
      toast.success(response.data.message)
      onMessageDelete(message._id as string)
    } catch {
      toast.error('Failed to delete message')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <p className="text-lg leading-relaxed line-clamp-4 break-words whitespace-pre-wrap">
            {message.content}
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            {dayjs(message.createdAt).fromNow()}
          </p>
          <div className="flex gap-2 pt-1">
            <Button asChild variant="outline" size="sm" className="flex-1 text-sm bg-transparent">
              <Link href={`/dashboard/message/${message._id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this message.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-700" onClick={handleDeleteConfirm}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}