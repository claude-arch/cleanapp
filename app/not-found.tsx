import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Page not found
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
