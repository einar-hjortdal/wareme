- Documentation
  - options for the `t` function
  - better example for `changeLanguage`
  - document `useTranslation` `idPrefix` parameter
  - SSR example

- Add support for `defaultMessage` without `id` prop. This would allow the following changes to codebases: 

Before:
```js
// component definition
PageHeading.Paragraphs = component(({ paragraphsId }) => {
  return (
    <ParagraphWrapper>
      <Translate
        id={paragraphsId}
        elements={{ paragraph: chunk => <Paragraph>{chunk}</Paragraph> }}
      />
    </ParagraphWrapper>
  )
})

// component usage
<PageHeading>
  <PageHeading.Title>{t('title')}</PageHeading.Title>
  <PageHeading.Paragraphs paragraphsId='shop.paragraphs' />
</PageHeading>
```

After:
```js
// component definition
PageHeading.Paragraphs = component(({ paragraphs }) => {
  return (
    <ParagraphWrapper>
      <Translate
        defaultMessage={paragraphs}
        elements={{ paragraph: chunk => <Paragraph>{chunk}</Paragraph> }}
      />
    </ParagraphWrapper>
  )
})

// component usage
<PageHeading>
  <PageHeading.Title>{t('title')}</PageHeading.Title>
  <PageHeading.Paragraphs {t('paragraphs')} />
</PageHeading>
```

## SPA functionality

The package currently focuses on SEO-optimized multilanguage apps, these are expected to have one unique 
URL for each language, therefore the language preference can be detected from the URL. Apps that do 
not require SEO do not need to have the complexity associated with the URL structure, but they benefit 
from 2 features that are currently missing:
- Detect browser language
- Persist preference in localStorage

This package will use localStorage because language preference cookies are not considered strictly necessary.