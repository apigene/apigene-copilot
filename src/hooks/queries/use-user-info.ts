"use client";

import useSWR from "swr";
import { User } from "@/types/user";
import { fetcher } from "lib/utils";

export function useUserInfo() {
  return useSWR<User>("/api/user", fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });
}
