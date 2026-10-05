import type { Locale } from './schema';
import dictionaries from '../../../content/ui.json';
import names from '../../../content/settings/language-names.json';
export const navigationKeys = [
  'home',
  'online-training',
  'workshops',
  'people-development',
  'changemaker',
  'sustainability',
  'business-coaching',
  'executive-sparring',
  'speaking',
  'about',
  'press',
] as const;
export type NavigationKey = (typeof navigationKeys)[number];
export interface UIStrings {
  navigation: Record<NavigationKey, string>;
  sectionNavigation: string;
  menu: string;
  home: string;
  contact: string;
  imprint: string;
  privacy: string;
  close: string;
  back: string;
  language: string;
  play: string;
  pause: string;
  videoUnavailable: string;
  videoNoScript: string;
  transcript: string;
}
// English remains unavailable until reviewed shared content and UI are supplied.
export const ui: Partial<Record<Locale, UIStrings>> = dictionaries;
export const languageNames: Record<Locale, string> = names;
