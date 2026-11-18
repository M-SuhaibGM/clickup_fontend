'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function LogoutDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-(--c-1e1f21) border-(--c-333438) text-(--c-white)">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
          <AlertDialogDescription className="text-(--c-8a8c91)">
            You will need to sign in again to access your workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-(--c-2a2b2e) border-(--c-333438) text-(--c-white) hover:bg-(--c-333438) hover:text-(--c-white)">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
