# Manage VenueRadar BD

Open **https://tanzilahmed.tech/venueradar-bd/manage.html** after the manager release is deployed. The public footer and About dialog also link to it.

## Edit, add or remove a hall

1. Search by hall name or area, then select a result. For a new listing, select **Add a hall**.
2. Edit the name, area/zone, address, phone numbers and Maps link. Separate multiple numbers with commas or new lines. Domestic mobile and landline formats are normalized automatically. The Maps link can fill the source field; check that it refers to the correct business and branch.
3. Select **Save to draft**, then review the change list. Nothing is public yet. **Remove hall** asks for confirmation and stages a removal. **Discard draft** restores the last loaded published version.

Keep a public source URL. Choose **Owner contribution** if the fact is supplied by you but has not been independently established from that source. Those contacts stay labelled as owner supplied. Previously sourced information and hidden research fields are retained when untouched. Correct a warning only when its underlying issue has actually been resolved.

Missing data is allowed. Invalid phone formats, unsafe links, duplicate names, unsupported fields and locations outside the Dhaka boundary are rejected before publication. Adding a number clears stale “phone not found” metadata automatically. Area indexes and collection membership are rebuilt together, so you do not need to edit those files.

Drafts are stored in this browser when storage is available. Download a JSON backup before clearing browser data, switching devices or replacing a draft. A stale draft is not restored over newer published data.

## Publish from the editor

The public directory never requires an account. Publishing requires repository-owner access because it changes the public repository.

1. Create an optional GitHub **fine-grained personal access token**, limited to `tanzilamd/venueradar-bd`, with **Contents: read and write**.
2. Open **Connect GitHub to publish**, enter it and select **Connect**. The editor accepts the owner account `tanzilamd`. The token stays in memory in this tab; it is not stored in Local Storage, Session Storage, exports or repository files.
3. Review the proposed additions, edits and removals, then select **Publish changes** and confirm.

One normal commit updates the venue file and derived indexes atomically. Removed records and previous edited versions are archived under `docs/archive/venues.json`. Author and committer use Tanzil Ahmed and the owner's GitHub noreply address. The ref update never uses force. GitHub Pages validates and builds the commit before deployment; the editor provides an Actions link.

If the venue dataset changed on GitHub while you were editing, publication stops before replacing it. Download the draft backup and reload current data before applying your changes again. A token/authentication/network failure does not erase the draft or imply publication succeeded.

## Publish without a token

Select **Download JSON**, then upload the downloaded `venues.json` to the repository's **public/data** folder using GitHub's upload page. Replace only that file and commit with your GitHub account. The workflow regenerates area indexes and collection membership. Keep the downloaded backup; use Git history to recover any manual removal. The visual editor's direct-publish option additionally writes the explicit archive snapshots.

## Why earlier manual edits failed

The reviewed failed workflow (`40231157011`, commit `8d2a43b`) reported stale missing-phone metadata and an unsupported phone. A number must be an object with normalized value, source, review date and status, plus matching evidence; adding one must remove its incompatible missing-phone state. The editor performs these operations together. Schema and evidence checks remain enabled.

Historical reports do not impose a frozen record count or require a deleted venue to stay active. Runtime checks validate the current records and their provenance. Capacity/facility research remains in the data when already present, but it is not required for new listings and is not displayed in the simplified public interface.
