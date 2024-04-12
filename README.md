# wareme

Utilities for Dark projects

## Note

Currently not published on npm: `bun link` does not seem to work.

1. link monorepo
```
bun link
bun link v1.1.3 (2615dc74)
Success! Registered "wareme"

To use wareme in a project, run:
  bun link wareme

Or add it in dependencies in your package.json file:
  "wareme": "link:wareme"
```

2. add package to repository
```
bun link @wareme/translations --save
[0.02ms] ".env"
bun link v1.1.3 (2615dc74)

 installed @wareme/translations@link:@wareme/translations

 1 package installed [3.00ms]
```
3. project doesn't work. No error messages during bundling, just doesn't work.