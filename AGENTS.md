# VenueRadar BD working rules

Read docs/RESEARCH_GUIDE.md and docs/DATA_UPDATE_GUIDE.md before changing data. Version 1 is English-only and Dhaka-only. Prioritize genuine community centers, convention centers and independent event halls rather than expanding the hotel collection. Never claim complete Dhaka coverage without evidence. Preserve existing verified records and report additions, modifications, conflicts and gaps. This task already runs in an isolated checkout; do not create a worktree unless requested.

## Commit attribution for Tanzil Ahmed

When working and committing on behalf of repository owner tanzilamd, use the repository-local configuration requested by the owner:

```
git config --local user.name 'Tanzil Ahmed'
git config --local user.email '59307135+tanzilamd@users.noreply.github.com'
git config --local github.user 'tanzilamd'
```

Do not set global Git identity. Do not override this identity with Codex, command-scoped Git settings, or author/committer environment variables. Before committing, check `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT`. If the integration forces Codex attribution, inform the owner before any further commits. After pushing, verify the remote commit’s author name/email and GitHub account association through GitHub’s commit API, not just the local log. GitHub authentication identity and commit authorship are different things.

Never rewrite existing history, amend published commits, or force-push without explicit owner approval. Other contributors should retain their own identity when authoring their own work; these settings describe this owner’s requested Codex workflow.
