# Website-Inhalte bearbeiten

Hier liegen die bearbeitbaren Texte und Einstellungen. `de` bezeichnet die deutsche
Sprachversion. Programmcode liegt außerhalb dieses Ordners. Die Migration ist noch
unvollständig und darf nicht auf die produktive Website hochgeladen werden.

## Wo ändere ich was?

| Änderung                                                              | Datei oder Ordner                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Seitentitel, Beschreibung, Titelbild, Texte und Abschnittsreihenfolge | `pages/de/*.mdoc`                                               |
| Startseite und Reihenfolge ihrer acht Abschnitte                      | `pages/de/home.mdoc`                                            |
| About                                                                 | `pages/de/about.mdoc`                                           |
| Personalentwicklung / Businesscoaching                                | `pages/de/personal.mdoc` / `business.mdoc`                      |
| Top Management Sparring / Key Note Speaker                            | `pages/de/sparring.mdoc` / `speaker.mdoc`                       |
| Workshops / Online-Trainings                                          | `pages/de/workshops.mdoc` / `online.mdoc`                       |
| Regenerative Changemaker / Nachhaltigkeit                             | `pages/de/changemaker.mdoc` / `nachhaltigkeit.mdoc`             |
| Presse                                                                | `pages/de/press.mdoc`                                           |
| Kontakt / Impressum / Datenschutz                                     | `shared/de/contact.mdoc` / `imprint.mdoc` / `privacy.mdoc`      |
| Menü, Schaltflächen, Beschriftungen für Screenreader                  | `ui.json`                                                       |
| Untere Navigation: Kontakt und rechtliche Links                       | `settings/navigation.json`                                      |
| Angezeigte Sprachnamen                                                | `settings/language-names.json`                                  |
| Alte Webadressen                                                      | `settings/legacy-routes.json` — nur nach technischer Abstimmung |

Kontakt und Rechtstexte bleiben eigenständige Seiten. Bitte nicht in andere Seiten
kopieren. Englische Testinhalte liegen außerhalb dieses Ordners und werden nicht
veröffentlicht.

## Untere Navigation

Die untere Navigation wird einmal in `settings/navigation.json` festgelegt, nicht
in den Kopfbereichen einzelner Seiten:

```json
{
  "footerNavigation": {
    "primary": "contact",
    "legal": ["imprint", "privacy"]
  }
}
```

`primary` ist der größere Kontaktlink. `legal` enthält Impressum und Datenschutz
jeweils genau einmal, in der angezeigten Reihenfolge. Andere Kennungen, doppelte
oder fehlende Einträge und zusätzliche Felder sind nicht erlaubt. Die bestehende
Reihenfolge bleibt Impressum, Datenschutz. Das frühere Seitenfeld `shared` entfällt
und wird nicht mehr akzeptiert.

Die Werte sind stabile `translationKey`-Kennungen, keine Webadressen oder
Beschriftungen. Die Ziele folgen den veröffentlichten `slug`-Angaben der jeweiligen
Sprache; Beschriftungen kommen aus `ui.json`. Alle drei Zielseiten und vollständige
UI-Texte müssen in jeder veröffentlichten Sprache vorhanden und veröffentlicht sein,
sonst schlägt der Build fehl. Inhalte bleiben unter `shared/`; die Navigation
ändert deren Ablage nicht. Die Links erscheinen nicht im Hauptmenü. Auf Kontakt-
und rechtlichen Seiten bleibt unten stattdessen der Schließen-/Zurück-Link.

## Kopfbereich und Text

Jede Datei beginnt mit Seitenangaben zwischen zwei Zeilen aus `---`, zum Beispiel:

```yaml
title: 'Ein Seitentitel'
publication: 'published'
```

`title` und `description` sind Metadaten. Die sichtbare Hauptüberschrift steht im
Text (`#`), weitere Überschriften verwenden `##`. Genau eine Hauptüberschrift pro
Seite. Absätze trennt eine Leerzeile; `**Text**` ist fett, `*Text*` kursiv.
Links schreiben Sie ausdrücklich als `[Beschriftung](https://example.com)` oder
`[Mail](mailto:preiss@susanne-preiss.de)`. Bloße URLs werden nicht automatisch verlinkt.
Für einen bewussten Umbruch in Überschriften/Absätzen verwenden Sie `{% br /%}`,
nicht `<br>`. Für eine ausgeschriebene nummerierte Absatzzeile statt einer Liste:
`1\. Text`. Listen verwenden `- Text` bzw. `1. Text`. Anführungszeichen und Satzzeichen
werden nicht automatisch typografisch verändert.

### Strukturierte Daten für Leistungen und Kurse

Passende Seiten unter `pages/` können zusätzlich im Kopfbereich ein ausdrücklich
geprüftes Angebot beschreiben:

```yaml
structuredData:
  type: Service
  name: 'Business Coaching'
  description: 'Eine sachliche Zusammenfassung des auf dieser Seite beschriebenen Angebots.'
```

Erlaubt sind `Service` für Leistungen und `Course` für ein beschriebenes Lernprogramm.
`name` und `description` müssen durch den sichtbaren Seiteninhalt belegt und in der
Sprache der Seite verfasst sein. Der Anbieter ist hier ausschließlich Susanne Preiss;
fremde Angebote dürfen so nicht ausgezeichnet werden. Für Startseite und About wird
stattdessen automatisch `WebSite` beziehungsweise `Person` ausgegeben.
Keine Bewertungen, Preise, Termine, Verfügbarkeit oder Abschlüsse ergänzen, die nicht
belegt sind. Ein Kurs ohne Termine ist kein angekündigtes `Event`. Das Feld ist
optional und erscheint nicht als neuer sichtbarer Text. Strukturierte Daten garantieren
keine besondere Darstellung in Suchergebnissen.

## Abschnitte im Seitenkörper anordnen

Markdoc verbindet Text mit wenigen benannten Bausteinen. Zum Umordnen verschieben
Sie einen vollständigen Block samt öffnender und schließender Zeile. Es gibt keine
zusätzliche Reihenfolgeliste und keine Einzeldateien für lokale Abschnitte.
Die bestehende Kennung `key` bleibt beim Block, auch wenn sich seine Position ändert.

```markdoc
{% prose key="people-development-1" %}

# Personalentwicklung

Hier steht der Text.

{% /prose %}

{% heading key="courses" centered=true %}

## Kurse.

{% /heading %}
```

### Verfügbare Bausteine

- `home-intro`: Einleitung der Startseite; `key`, `image`, `alt`. Im Block stehen
  Hauptüberschrift und Begleittext. Die bestehenden Fragmentziele bleiben erhalten.
- `home-tile`: verlinkter Startseitenabschnitt; `key`, `image`, `alt`,
  `destination="content:translationKey"`, optional `mobileImage`, `side="left"`
  oder `"right"` und `tone="dark"` oder `"light"` für die Bedienelemente.
  Der Inhalt enthält eine `##`-Überschrift und optional Begleittext, keine weiteren Links.
  Abschnittsreihenfolge und Beschriftungen der Abschnittssteuerung folgen diesen Blöcken.
- `article`: zusammenhängender Text wie About; ohne Attribute.
- `prose`: Textabschnitt; benötigt eine eindeutige `key`-Kennung.
- `heading`: hervorgehobener Überschriftenabschnitt; `key`, optional `centered=true`.
- `resource-list`: Gruppe von `resource`-Blöcken; ohne Attribute.
- `resource`: Karte in einer Ressourcenliste; `key`, `destination`, optional `image`
  mit `alt`. Der Karteninhalt darf keine weiteren Links enthalten.
- `course`: Bild/Kurs-Panel; `key`, `destination`, `image`, `alt`, optional
  `side="left"` oder `side="right"` (Standard: links).
- `illustration`: Bild mit Text; `key`, `image`, `alt`, optional `side` wie oben.
- `video`: Videoplatzierung; `key`, `id`, `title`, `src`, optional `poster`.
  Im Block stehen sichtbare Überschrift und gegebenenfalls Begleittext. Ein
  Svelte-Player mit Video.js 10 übernimmt Wiedergabe und Bedienelemente; ohne
  JavaScript bleiben ein natives Video und ein lokalisierter Hinweis verfügbar.
  Streaming-Playlists (`.m3u8`) werden nicht als sichtbare Links angeboten.
  `cover="workshop"` ist der Standard. Das bestehende TEDx-Layout verwendet
  `cover="talk"` zusammen mit `coverImage`; andere Layoutwerte sind nicht erlaubt.
- `br`: leerer Inline-Umbruch, geschrieben als `{% br /%}`.

Alle Bausteine außer `resource` und `br` stehen auf oberster Ebene, nicht ineinander.
`resource` steht ausschließlich innerhalb von `resource-list`. Keine beliebigen
Komponenten, CSS-Klassen, Styles, HTML, Variablen, Funktionen oder Partials verwenden.
Layout und Interaktionen gehören in den Programmcode.

```markdoc
{% resource-list %}

{% resource key="online-training-2-1" destination="/pdf/online1.pdf" %}

## Kursinformationen

{% /resource %}

{% resource key="contact-link" destination="content:contact" %}

## Kontakt aufnehmen

{% /resource %}

{% /resource-list %}
```

Ziele sind vorhandene `/pdf/datei.pdf`, vollständige `https://`-Adressen oder
`content:translationKey`. Letzteres wird über die veröffentlichte Seite **derselben
Sprache** aufgelöst, nicht über einen fest eingetragenen Slug. Fehlende/Entwurfsziele
führen zu einem Fehler, niemals zu einem stillen Sprachwechsel. Normale Markdown-Links
auf interne Seiten werden ebenfalls gegen die gebauten Routen geprüft.
Externe Ziele werden syntaktisch geprüft; deren Erreichbarkeit ist keine Build-Voraussetzung.

Bildreferenzen `/img/datei.jpg` (auch `.JPG`, `.jpeg`, `.png`, `.webp`) benennen
Originaldateien unter `../src/assets/images/`, **nicht** unter `public/img/`.
Keine Imports im Markdoc nötig. Astro erzeugt AVIF, WebP und JPEG-Fallbacks
(PNG bei PNG-Originalen, damit Transparenz erhalten bleibt) in mehreren Breiten
bis maximal 1920 Pixel, ohne hochzuskalieren. Die Breiten sind 320, 640, 960,
1280, 1440, 1600 und 1920 Pixel (durch das Original bzw. die Komponente begrenzt);
die Bildqualität steht auf 50. Poster verwenden weiterhin Qualität 80.
Layout, `sizes` und Ladepriorität
werden von den Komponenten bestimmt. Auf der Startseite laden die ersten beiden
Bilder in der redaktionellen Reihenfolge sofort; nur das erste erhält hohe Priorität.
Alle übrigen Bilder sind im HTML nativ lazy. Ein IntersectionObserver setzt sie
auf eager, sobald sie höchstens 150vh ober- oder unterhalb des Viewports liegen.
Der Abstand wird aus der Viewport-Höhe in Pixel umgerechnet und bei Resize aktualisiert.
Ohne JavaScript oder Observer-Unterstützung bleibt native Lazy-Loading aktiv.
`picture`, `srcset` und die Format-/Größenauswahl bleiben browsergesteuert;
es gibt keine sequenzielle Lade-Warteschlange.
Die Startseitenabschnitte verwenden `scroll-snap-stop: always`, damit einzelne
Scrollgesten möglichst keine Einrastpunkte überspringen (kein JavaScript-Scroll-Limit).
Ein Neuladen der Startseite ohne Fragment beginnt oben; Zurück/Vorwärts stellt
weiterhin die Scrollposition her. Explizite Abschnittsfragmente bleiben erhalten.
`mobileImage` erhält die eigene Bildauswahl
im Hochformat. Poster werden als einzelne optimierte JPEG-/PNG-URL bis 1280 Pixel
erzeugt, da die Poster-API kein `picture` unterstützt.
Fehlende oder ungültige Bildreferenzen brechen den Build ab.
SVG-Illustrationen bleiben unverändert unter `../public/svg/`; Downloads unter
`../public/pdf/`. Favicons bleiben ebenfalls unverändert in `public/`.
`alt=""` bezeichnet ein dekoratives Bild; beschreibende
Alternativtexte müssen zum tatsächlichen Bildinhalt passen. Videoquellen verwenden
vollständige HTTPS-URLs. Bestehende Video-IDs sind Fragmentziele und müssen bleiben.

Die Player-Bedienelemente folgen der **Seitensprache**. `mediaLocale="de"` oder
`"en"` benennt dagegen die tatsächliche Sprache des Videos; bei unbekannter Sprache
weglassen, niemals aus der Sprache einer übersetzten Seite ableiten.

Untertitel sind optional: `captionSrc` (HTTPS oder `/captions/datei.vtt`),
`captionLocale` und `captionLabel` müssen gemeinsam angegeben werden. Für ein
Transkript gehören `transcript` (ein erlaubtes Ziel wie oben) und `transcriptLocale`
zusammen. Interne Transkriptziele werden ausdrücklich in dieser Sprache aufgelöst.
Nur vorhandene, überprüfte Untertitel/Transkripte eintragen. Die aktuellen deutschen
Seiten erfinden keine Übersetzungen; englische Testdateien bleiben Testdateien.
Player-Optionen, JavaScript und Hydrierungsdirektiven gehören nicht in die Inhalte.

## Veröffentlichung und Sprachen

`publication: "draft"` bleibt unveröffentlicht, `"published"` gibt die Seite für den
Build frei — das ist noch kein Upload. Alle eingebetteten Abschnitte übernehmen
Sprache und Veröffentlichung ihrer Seite. Nur selbständig verwaltete Seiten wie
Kontakt/Rechtstexte haben eigene Identität und Veröffentlichungsangaben.

Bitte `translationKey`, `locale`, Block-`key` und Video-`id` nur nach Abstimmung
ändern. Übersetzungen verwenden dieselbe `translationKey`. `slug` ist dagegen der
vollständige, frei wählbare öffentliche Pfad — unabhängig von `locale`:

```yaml
translationKey: contact
locale: de
slug: /kontakt
```

Die englische Entsprechung kann `locale: en` und `slug: /contact` verwenden.
Für mehrdeutige Namen sind `/regenerative-changemaker` und
`/en/regenerative-changemaker` möglich. Die deutsche Startseite verwendet `/`,
eine tatsächlich veröffentlichte englische Startseite `/en/`. Ein Sprachpräfix
wird **nie automatisch** ergänzt. Auch verschachtelte Pfade wie `/angebote/coaching`
sind erlaubt. Sprachwechsel, Menüs und `content:...`-Links folgen der Kennung,
nicht ähnlichen Pfaden; eine Pfadänderung benötigt keine Komponentenänderung.
Normale, ausdrücklich eingetragene Markdown-Links müssen mitgeändert werden.

Erlaubt sind `/` oder mit `/` beginnende Segmente aus Kleinbuchstaben `a-z`,
Ziffern und einzelnen Bindestrichen zwischen Wörtern. Optionaler abschließender
Slash wird vereinheitlicht: `/kontakt` wird `/kontakt/`; `/` bleibt `/`.
Keine Leerzeichen, Umlaute (stattdessen z. B. `ue`), Punkte, Unterstriche,
Großbuchstaben, leere Segmente, Prozentkodierung, Backslashes, `?` oder `#`.
Externe URLs, `//...` und Traversierung sind verboten.

Auch Entwürfe reservieren ihren normalisierten Pfad. Doppelte Pfade über Sprachen
und Sammlungen hinweg sowie Kollisionen mit Dateien unter `public/`, festen Seiten
und Weiterleitungen stoppen den Build. Veröffentlichte kanonische Seiten haben
Vorrang vor überholten Alias-Adressen. `/` und `/index.html` verwenden dasselbe
physische `index.html`; es gibt dafür keine getrennt konfigurierten HTTP-Antworten.
Die alten `/de/...`-Adressen und bekannten `/html/...`-Adressen verweisen direkt
auf die aktuelle deutsche kanonische Adresse, ohne Weiterleitungsketten.

Neue Sprachen benötigen veröffentlichte Kontakt-/
Rechtstexte sowie vollständige UI-Beschriftungen. Entwürfe und fehlende Übersetzungen
erscheinen weder im Menü noch als Sprachwechsel. `heroPosition` und `heroTone` sind
Darstellungseinstellungen, keine gewöhnlichen Textfelder.

In JSON-Dateien ändern Sie Werte, nicht Schlüssel. Doppelte Anführungszeichen und
Kommas sind wichtig; Kommentare und abschließende Kommas sind nicht erlaubt.
Anführungszeichen innerhalb eines Werts werden als `\"` geschrieben.

## Änderungen prüfen

Vom Repository-Hauptordner aus:

```sh
pnpm dev      # Lokale Vorschau; Strg+C beendet sie
pnpm check    # Astro-/TypeScript-/Svelte-Verträge
pnpm build    # Markdoc, Seitenangaben, Routen, Verweise und Dateien prüfen
pnpm test     # Automatisierte Prüfungen einschließlich isolierter Inhaltsänderungen
```

Unbekannte Tags/Attribute, fehlende Pflichtangaben, ungültige Verschachtelung, doppelte
Block-Kennungen und fehlende Verweise stoppen den Build. Die alte `sections`-Angabe
ist nicht mehr zulässig. Prüfen Sie Änderungen auch auf großem und kleinem Bildschirm.
Einige Migrationstests vergleichen den Text absichtlich mit der alten Website: Bei
gewollten Textänderungen müssen Erwartungen gezielt überprüft werden, nicht einfach
Tests entfernt werden. Diese Befehle veröffentlichen nichts.
