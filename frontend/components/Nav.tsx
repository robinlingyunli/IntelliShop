"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

export default function Nav() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          IntelliShop
        </Link>

        <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/cart" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Cart
          </Link>
          <Link href="/orders" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Orders
          </Link>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Log out
            </button>
          ) : (
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
