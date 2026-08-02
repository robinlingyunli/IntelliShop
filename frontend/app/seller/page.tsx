"use client";

import { useAuth } from "@/lib/auth-context";

export default function SellerInfoPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Seller Info
      </h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Username</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user?.username}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Account type</dt>
            <dd className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
              {user?.role}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Member since</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user ? new Date(user.created_at).toLocaleDateString() : ""}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
