declare namespace App {
  interface Locals {
    /** Explicit content identity supplied before rendering Markdoc; never inferred from URL. */
    contentLocale?: import('./lib/content/schema').Locale;
  }
}
