# User Guide Studio

The Management header contains a compass button for opening user guides and Guide Studio.

## Database setup

Run `Script/create_user_guide.sql` once against the application database. The script is idempotent and:

- creates the `GuideStep` table;
- adds `Employee.TotalLoginHours`;
- backfills login hours from `UsersSession` while merging overlapping sessions.

After deployment, `FileProcessingHub` recalculates the employee aggregate whenever a user session closes. The eligibility rule is:

```text
GuideStep.MaxLoginHours <= 0
or Employee.TotalLoginHours < GuideStep.MaxLoginHours
```

Available APIs:

- `GET /api/GuideStep/GetGuides`
- `POST /api/GuideStep/SaveGuide`
- `DELETE /api/GuideStep/DeleteGuide/{guideKey}`
- `GET /api/Employee/GetMyGuideEligibility?maxLoginHours=8`

Guide writes are restricted to IT, Admin, Superuser, or configured superusers.

## Manual setup

1. Click the compass button and select **Set up guides**.
2. Enter the guide title, stable key, and route.
3. Select **Capture element**, then click the control that the step should highlight.
4. Edit the step title, placement, content format, and formatted content.
5. Repeat capture for the remaining steps, use **Preview**, then save.

Set **Show below login hours** to the experience threshold and enable **Auto-start when eligible** when the guide should open automatically. A value of `0` means the guide is not restricted by accumulated login time.

The runtime shows `Step x of y`, highlights the captured element, waits up to five seconds for dynamically rendered elements, and centers the message when a selector is absent or cannot be found.

## Wiki setup

Enter a wiki URL or paste Markdown/HTML into the **From wiki** tab. Guide Studio auto-detects the format. URL loading uses the current browser session; if a wiki blocks cross-origin requests, paste its content instead.

### Markdown convention

```markdown
# Create a quotation

## Step 1: Open the quotation module
Selector: `#quotationMenu`
Placement: right

Select **Quotation** from the menu.

## Step 2: Create the record
Selector: `#btnNew`
Placement: bottom

Click **New**, then complete the required fields.

## Completion message
Placement: center

The quotation is ready to submit.
```

- The first level-1 heading is the guide title.
- Every level-2 or level-3 heading starts a step.
- `Selector`, `Placement`, `Route`, and `Format` are optional step metadata.
- Supported placements are `auto`, `top`, `right`, `bottom`, `left`, and `center`.
- Step content supports headings, lists, bold, emphasis, inline code, and safe links.

### HTML convention

Every `<h2>` or `<h3>` starts a step. The target and placement can be stored on the heading.

```html
<h1>Create a quotation</h1>
<h2 data-selector="#quotationMenu" data-placement="right">Open the module</h2>
<p>Select <strong>Quotation</strong> from the menu.</p>
<h2 data-selector="#btnNew" data-placement="bottom">Create the record</h2>
<p>Click <strong>New</strong>.</p>
```

Unsafe scripts, event handlers, embedded objects, and JavaScript URLs are removed before content is displayed.

## JavaScript API

```javascript
await UserGuide.start("quotation-create");
UserGuide.stop();
await UserGuide.openStudio();
const guides = await UserGuide.list();
```

Guides use `/api/GuideStep` and the `GuideStep` table by default. Existing browser data can still be read as a temporary fallback when the API or schema is unavailable, but shared guide writes require the API. A different store can be supplied without changing the tour or Studio:

```javascript
UserGuide.setStorageAdapter({
    async list() { /* return all guides */ },
    async save(guide) { /* upsert and return guide */ },
    async remove(id) { /* delete guide */ }
});
```

For stable capture results, prefer unique element IDs or add a `data-guide` attribute to important controls.
