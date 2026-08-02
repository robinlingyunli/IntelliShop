"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaUserAlt } from "react-icons/fa";
import { IoMdCart } from "react-icons/io";

import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import SearchBox from "@/components/SearchBox";

export default function Nav() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSeller = isLoggedIn && user?.role === "seller";

  const handleAvatarClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setMenuOpen((open) => !open);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex-shrink-0 text-lg font-semibold tracking-wide text-zinc-900 dark:text-zinc-50"
        >
          IntelliShop
        </Link>

        {!isSeller && <SearchBox />}

        <nav className="flex flex-shrink-0 items-center gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {isSeller && (
            <Link href="/seller" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              DASHBOARD
            </Link>
          )}
          {!isSeller && (
            <>
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                HOME
              </Link>
              <Link href="/shop" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                SHOP
              </Link>
              <Link href="/orders" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                ORDERS
              </Link>

              <Link
                href="/cart"
                className="relative text-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <IoMdCart />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {itemCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <div className="relative">
            <button
              onClick={handleAvatarClick}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            >
              {isLoggedIn && user ? (
                <span className="text-xs font-semibold uppercase text-zinc-900 dark:text-zinc-100">
                  {user.username.charAt(0)}
                </span>
              ) : (
                <FaUserAlt className="text-xs" />
              )}
            </button>

            {menuOpen && isLoggedIn && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-100 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-900">
                  {user?.username}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
