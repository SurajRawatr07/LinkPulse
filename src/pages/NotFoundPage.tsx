import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a] p-4">
      <Card className="max-w-md w-full text-center p-8 space-y-6">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center mx-auto shadow-xs">
          <Link2 className="w-6 h-6 stroke-[1.8]" />
        </div>

        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            404 Error
          </span>
          <h1 className="font-serif text-3xl font-normal text-neutral-900 dark:text-white mt-1">
            Page Not Found
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
            The page you requested does not exist or has been moved to a new route.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <Link to="/app/dashboard">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
