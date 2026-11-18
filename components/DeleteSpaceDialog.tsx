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

export default function DeleteSpaceDialog({
  open,
  spaceName,
  doomedProjects,
  deleting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  spaceName?: string;
  doomedProjects: number;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[color:var(--c-232426)] border-[color:var(--c-333438)] text-[color:var(--c-white)]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete space</AlertDialogTitle>
          <AlertDialogDescription className="text-[color:var(--c-8a8c91)]">
            Delete <span className="font-semibold text-[color:var(--c-white)]">&quot;{spaceName}&quot;</span>?{' '}
            {doomedProjects > 0
              ? `Its ${doomedProjects} project${doomedProjects === 1 ? '' : 's'}, their channels, lists and tasks will be permanently removed.`
              : 'This space has no projects.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting} className="bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] border-[color:var(--c-333438)] hover:bg-[color:var(--c-333438)]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); onConfirm(); }} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
            {deleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
