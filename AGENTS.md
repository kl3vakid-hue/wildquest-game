<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- Offline mode: `cached()` in `src/services/offlineCache.ts` must persist every successful live fetch (including the first one that seeds the cache — a code path that returns the live promise without writing silently breaks all offline screens) and must return the stored copy at once when `navigator.onLine` is false or the fetch stalls past its 2.5s deadline; the query library otherwise retries network failures for ~8s, leaving screens empty. The `PAGES_CACHE` name in `src/lib/pwa.ts` must equal the navigation `cacheName` in `vite.config.ts`.
- Play mode (`games.play_mode`, host-set from the admin dashboard: `individual` | `groups`): group scoring reads the stored `groups.score`, which a database trigger (`sync_group_score` on `players`) keeps equal to the sum of member player scores. Never write group scores from client code and never bypass the trigger — non-host devices cannot update `groups` under RLS, and the trigger keeps the stored total correct for every path (sightings, overrides, achievement resyncs, players joining/leaving).
