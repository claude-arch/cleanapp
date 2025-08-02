import { SparklesIcon } from '@heroicons/react/24/solid';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <SparklesIcon className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <div className="absolute inset-0 h-12 w-12 mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary"></div>
          </div>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Loading...</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please wait while we prepare your experience</p>
      </div>
    </div>
  );
}
