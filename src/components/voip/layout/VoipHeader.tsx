import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVoipAuth } from "@/contexts/VoipAuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Menu, X, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoipHeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function VoipHeader({ onMenuToggle, isMenuOpen }: VoipHeaderProps) {
  const { user, logout, isAdmin } = useVoipAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/voip/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <Link to="/voip/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="bg-primary p-1.5 rounded-lg">
          <Phone className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display text-base text-foreground">Client Dashboard</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {isAdmin && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Admin
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user ? getInitials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/voip/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
