# Launch checklist

The infrastructure PR creates the hosting root, leaving the site Planned until a real deploy passes acceptance. The application PR adds the existing app and release workflow. Keep both reviewable; do not merge the application before these prerequisites exist.

1. Review and merge the cloud-accounts PR after every check passes and its plans match: only the new root should create resources. CI applies infrastructure.
2. Repository visibility is public and the reference’s squash-only merges, automatic branch deletion, default-branch ruleset requiring `verify`, and main-only `production` environment have been configured. Preserve these settings.
3. With `AWS_PROFILE=household3d-ro`, run `terraform -chdir=sites/toms-crossing-map.isaacvelando.com output` in cloud-accounts. Set `DISTRIBUTION_ID` as a repository Actions variable using the returned distribution ID. The bucket and role are fixed by the reviewed configuration; no AWS secret is stored in GitHub.
4. Merge the application PR after `check`, `browser`, `webkit`, and `verify` pass. Inspect logs to confirm browser tests ran. Watch Verify on `main` through deploy and smoke.
5. In cloud-accounts, run `AWS_PROFILE=household3d-ro scripts/verify-site.sh https://toms-crossing-map.isaacvelando.com --bucket toms-crossing-map-site-634753796535 --no-pages --no-feed`. Record the distribution and verification date in a docs-only PR moving the site from Planned to Live.

Only hashed assets receive immutable caching and old hashes remain available to open pages. HTML and stable files receive five-minute caching. GLB is served as `model/gltf-binary`. The live CSP must match the checked-in policy exactly. A missing distribution variable fails before AWS credentials are requested or content is uploaded.

## Release sweep

Review every candidate path and text file, inspect GLB metadata, and check both the source and the built distribution. Never commit listening notes, transcripts, source timing ledgers, audio, credentials, local machine paths, generated output, or source maps. The current software license covers original software; attribution does not imply permission from the novel’s rights holders. Only reviewed early summaries and illustrative geometry ship.

Pattern checks can detect known categories; they cannot prove that arbitrary prose or every possible secret is safe. New content still needs a human-readable review. Build and test from a clean checkout so ignored private files cannot become dependencies.
