import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full text-center p-8 space-y-6">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto shadow-xs">
          <Link2 className="w-6 h-6 stroke-[1.8]" />
        </div>

        <div>
          <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400">
            404 Error
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
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
