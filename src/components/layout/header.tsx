"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">
            AsiaCommerce Event
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/events" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
              Events
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/my-events" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                  My Events
                </Link>
                <Link href="/profile" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                  Profile
                </Link>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground/70 hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3 border-t pt-4">
            <Link
              href="/"
              className="text-sm font-medium py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/events"
              className="text-sm font-medium py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/my-events" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>
                  My Events
                </Link>
                <Link href="/profile" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </Link>
              </>
            ) : (
              <Button asChild size="sm" className="w-full mt-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
