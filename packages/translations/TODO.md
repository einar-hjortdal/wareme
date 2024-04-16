- `--external @wareme/event-emitter`?

## SPA functionality

The package currently focuses on SEO-optimized multilanguage apps, these are expected to have one unique 
URL for each language, therefore the language preference can be detected from the URL. Apps that do 
not require SEO do not need to have the complexity associated with the URL structure, but they benefit 
from 2 features that are currently missing:
- Detect browser language
- Persist preference in localStorage

This package will use localStorage because language preference cookies are not considered strictly necessary.