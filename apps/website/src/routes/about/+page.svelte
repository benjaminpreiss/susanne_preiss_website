<script lang="ts">
	import '$lib/contentPage';
	import Footer from '$lib/components/Footer/Footer.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container white-footer white-header">
		<MImage class="bg-[url('/img/about_start_2.jpg')] bg-cover bg-left bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				About
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Susanne Preiss, zertifizierter Business Coach, ist in Deutschland eine der</span>
				<span>anerkanntesten Trainerinnen für Stressmanagement und arbeitet seit Jahren</span>
				<span>europaweit erfolgreich mit Führungskräften aus Top- und Middlemanagement,</span>
				<span>Politikern, Moderatoren und Selbstständigen zusammen. Bekannt wurde ihre Arbeit</span>
				<span>durch die ungewöhnliche Namensgebung, als sie im Jahre 2000 anfing in</span>
				<span>sogenannten Entschleunigungs-Kursen mit Führungskräften ein Programm zum</span>
				Stressabbau und zur Erholung zu entwickeln.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Die Financial Times titelte bereits im Jahre 2002 „Die Entdeckung der Langsamkeit –</span
				>
				<span>Susanne Preiss lehrt Stressgeplagten zu entschleunigen.“ Der Stern machte</span>
				<span>Susanne Preiss eigene Burnout-Geschichte im Jahr 2004 zur Titelstory unter dem</span>
				<span>Namen „Entschleunigung im Trend - Die Sehnsucht nach mehr Zeit“. Die Neue</span>
				<span
					>Zürcher Zeitung, der STERN, die Rheinische Post, Berliner Morgenpost, Brigitte, Für</span
				>
				<span>Sie, FOCUS, die Lübecker Nachrichten, TATLER´s aus England uvm. berichteten</span>
				<span>schon über den Erfolg ihrer Arbeit, und wie sie es schafft, Menschen aus allen</span>
				<span>Berufen alltagstaugliche Instrumente an die Hand zu geben, um mit dem Druck aus</span>
				<span>Beruf- und Alltagsleben besser umgehen zu können. Für ein Leben mit mehr</span>
				<span>Energie. Diverse Fernsehbeiträge im NDR, ZDF, WDR berichten regelmäßig über die</span>
				Arbeit als Auszeitcoach.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Menschen wie Willy Bogner, Frauke Ludowig, Willy Astor uvm. suchen bei Ihr in</span>
				<span>Einzelcoachings nach Wegen, erfolgreich und leistungsfähig zu bleiben.</span>
				<span>Zu Ihren Firmenkunden gehören große Namen, für die sie im Rahmen der</span>
				<span>Personalentwicklung auf diversen Feldern aktiv ist. Dazu gehören z.B. Procter &</span>
				<span>Gamble , Marriott Hotel Holding Group, Eppendorf AG, Silhouette Deutschland</span>
				<span>GmbH, Bitburger Braugruppe, Imperial Logistics, Hollister Incorporated, Russell</span>
				Reynolds, Deutsche Post DHL, der Hamburger Senat, etc.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Sie berät mittelständische Firmen in Sachen Energie-und Ressourcenmanagement,</span>
				<span>Personalentwicklung, Führung, Gesundheitsmanagement und</span>
				<span>Organisationsentwicklung mit maßgeschneiderten Konzepten. Gemeinsam mit</span>
				<span>anderen Experten aus den Bereichen Organisationsentwicklung,</span>
				<span
					>Personalentwicklung, Projektmanagement, Ernährung, Kardiologie, etc., gründete sie</span
				>
				2010 das Netzwerk <a href="https://www.fit-im-business.com">www.fit-im-business.com</a>.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Für ihre eigene, persönliche Weiterentwicklung hat sie Zertifizierungen und besucht</span
				>
				<span>Fortbildungen beim Human Performance Institute (Orlando), beim Stanford Center</span>
				<span>for Professional Training (San Francisco), beim Deutschen Olympischen Sportbund</span>
				<span
					>und befindet sich aktuell in der Master Ausbildung (Business Coach) bei V.I.E.L. in</span
				>
				Hamburg.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Sie ist die Europa Repräsentantin des „Chinese Nature Cure Instituts“ von Prof. Dr.</span
				>
				Tee Tong Ang aus Singapur.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Für ihre Erfüllung und Sinnstiftung im Leben, gründete sie 2015 den Verein</span>
				<span>Almaawiya e.V.(www.almaawiya.org), der jungen Menschen Bildung ermöglicht, in</span>
				einer vom Terror bedrohten Region Kenias, in der Nähe der somalischen Grenze.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sie wollen mich kennenlernen? Meinen Weg, der schon vielen geholfen hat?
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Schreiben Sie mir jetzt ein <a
					href="mailto:preiss@susanne-preiss.de"
					class="redAnchor text-[#ff0000]">Mail</a
				>
				oder rufen Sie mich an
				<a href="tel:00494069665175" class="redAnchor text-[#ff0000]">+49 (0) 40 – 69 66 51 77</a>.
			</p>
		</div>
	</div>
</div>
