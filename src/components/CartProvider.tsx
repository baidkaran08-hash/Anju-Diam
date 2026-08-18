"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Client-side mirror of the server cart and wishlist.
 *
 * The server is the only authority — every mutation posts and then adopts the
 * response, so the count in the header can never drift from what checkout will
 * actually see. The cost is a round trip per action, which at this scale is
 * imperceptible and worth the correctness.
 */

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  category: string;
  metal: string;
  stoneShape: string;
  diamondCount: number;
  diamondCaratW: number;
  illusionSet: boolean;
  image: string | null;
  priceMinor: number;
  currency: string;
  quantity: number;
  note: string | null;
};

type CartState = {
  count: number;
  subtotalMinor: number;
  currency: string;
  items: CartLine[];
};

type Ctx = CartState & {
  ready: boolean;
  busy: boolean;
  wishlist: string[];
  add: (productId: string, quantity?: number, note?: string) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const EMPTY: CartState = { count: 0, subtotalMinor: 0, currency: "THB", items: [] };

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [cartResponse, wishResponse] = await Promise.all([
        fetch("/api/cart", { cache: "no-store" }),
        fetch("/api/wishlist", { cache: "no-store" }),
      ]);
      if (cartResponse.ok) setCart(await cartResponse.json());
      if (wishResponse.ok) setWishlist((await wishResponse.json()).ids ?? []);
    } catch {
      // Offline or a failed fetch leaves the last known state in place, which
      // is friendlier than blanking the header.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback<Ctx["add"]>(async (productId, quantity = 1, note) => {
    setBusy(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity, note }),
      });
      if (!response.ok) return false;
      setCart(await response.json());
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const setQuantity = useCallback<Ctx["setQuantity"]>(async (productId, quantity) => {
    setBusy(true);
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      if (response.ok) setCart(await response.json());
    } finally {
      setBusy(false);
    }
  }, []);

  const clear = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/cart", { method: "DELETE" });
      if (response.ok) setCart(await response.json());
    } finally {
      setBusy(false);
    }
  }, []);

  const toggleWishlist = useCallback<Ctx["toggleWishlist"]>(async (productId) => {
    // Optimistic here, because a heart that lags feels broken and the failure
    // mode is trivial — the next refresh corrects it.
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setWishlist(data.ids ?? []);
      return Boolean(data.saved);
    } catch {
      void refresh();
      return false;
    }
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({ ...cart, ready, busy, wishlist, add, setQuantity, clear, toggleWishlist, refresh }),
    [cart, ready, busy, wishlist, add, setQuantity, clear, toggleWishlist, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>.");
  return context;
}
