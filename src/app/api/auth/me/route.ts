import { getSessionUser } from "@/lib/auth";
import { ok, route } from "@/lib/api";

export const GET = route(async () => ok({ user: await getSessionUser() }));
