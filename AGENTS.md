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

- Play mode (`games.play_mode`, host-set from the admin dashboard: `individual` | `groups`): group scoring reads the stored `groups.score`, which a database trigger (`sync_group_score` on `players`) keeps equal to the sum of member player scores. Never write group scores from client code and never bypass the trigger — non-host devices cannot update `groups` under RLS, and the trigger keeps the stored total correct for every path (sightings, overrides, achievement resyncs, players joining/leaving).
