import { LogOut, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '../../stores/authStore';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Boost Commission Tracker</h1>
              <p className="text-xs text-muted-foreground">Manager Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
