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

- Play mode (`games.play_mode`, host-set from the admin dashboard: `individual` | `groups`) is display-level only: player scores are always computed and stored per player, and group totals are always summed client-side from member scores. Never write scores to `groups` rows — non-host devices cannot update `groups` under RLS, and the summed display keeps offline and mode-switch behaviour automatic.
