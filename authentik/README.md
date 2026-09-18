# authentik theme (id.funami.tech)

`custom.css` is the YuruVerse theme for the **YuruID** brand on authentik 2026.8.
It is stored in authentik itself, as the brand's `branding_custom_css`, not mounted
from disk. This copy is the source of truth for edits.

## Applying a change

```bash
B64=$(base64 -w0 custom.css)
# inside the authentik server container
printf %s "$B64" | base64 -d > /tmp/yuru.css
ak shell -c "
from authentik.brands.models import Brand
b = Brand.objects.get(default=True)
b.branding_custom_css = open('/tmp/yuru.css').read()
b.save()
"
```

Or paste it into the admin interface: **System → Brands → authentik-default → Custom CSS**.

## What it depends on

- `https://funami.tech/assets/fonts/InterVariable.woff2` for the typeface (served with
  `access-control-allow-origin: *`, which fonts need).
- `https://funami.tech/assets/img/yuifunami.png` as the heading icon, and
  `mizuki6-4k.png` as the flow background (set on the brand, not here).
  **Both live in this repo under `src/assets/img/` and must stay there**: an earlier
  deploy dropped them and broke the login page.

## Notes

- The flow executor renders the brand logo in its own block (`.pf-c-brand`,
  `part="branding"`) while the title lives in a nested `ak-flow-card` shadow root, so
  the two cannot be flexed together. The logo block is hidden and the icon is drawn as
  a `::before` on the heading instead.
- The heading text is the **flow title**, not a brand field. It is set on
  `default-authentication-flow` and currently reads "YuruID Login".
