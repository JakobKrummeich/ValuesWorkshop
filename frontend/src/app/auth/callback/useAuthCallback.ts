"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import {
  handleCallback$,
  navigateReplace,
} from "../../../adapters/authAdapter";
import { errorMessage } from "../../../shared/errorMessage";

const returnUrlSchema = z.string().startsWith("/").catch("/");

export interface AuthCallbackResult {
  error: string | null;
}

export function useAuthCallback(): AuthCallbackResult {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = handleCallback$().subscribe({
      next(user) {
        navigateReplace(returnUrlSchema.parse(user.state));
      },
      error(callbackError) {
        setError(errorMessage(callbackError));
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { error };
}
