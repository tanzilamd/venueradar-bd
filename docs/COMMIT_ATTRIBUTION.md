# Commit attribution

Owner-authorized identity for future commits in this checkout:

- Name: Tanzil Ahmed
- Email: 59307135+tanzilamd@users.noreply.github.com
- GitHub account: tanzilamd

Configured with repository-local `user.name`, `user.email`, and `github.user`. Global Git configuration is not modified. `github.user` is a convenience setting; GitHub associates commits through the author email.

Verify before committing:

```sh
git config --show-origin --get user.name
git config --show-origin --get user.email
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
```

Verify after pushing:

```sh
gh api repos/tanzilamd/venueradar-bd/commits/HEAD --jq '{sha,author_login:.author.login,author_name:.commit.author.name,author_email:.commit.author.email,committer_login:.committer.login}'
```

The author login should be `tanzilamd`. Existing Codex-authored commits are preserved; no history rewrite or force-push is authorized. If an integration forces Codex attribution, stop and tell the owner before making more commits.
