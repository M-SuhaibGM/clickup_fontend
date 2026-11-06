import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Decorative Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50 border border-border">
          <svg 
            className="h-10 w-10 text-muted-foreground" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">404</h1>
          <h2 className="text-lg font-semibold text-foreground">Page not found</h2>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}