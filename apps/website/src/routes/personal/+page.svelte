<script lang="ts">
	import '$lib/contentPage';
	import VideoJs from '$lib/components/VideoJS/VideoJS.svelte';
	import MHalfCover from '$lib/components/MHalfCover/MHalfCover.svelte';
	import Footer from '$lib/components/Footer/Footer.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
	import MVideoContainer from '$lib/components/MVideoContainer/MVideoContainer.svelte';
	import MPlayButton from '$lib/components/MPlayButton/MPlayButton.svelte';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container black-footer black-header">
		<MImage class="bg-[url('/img/personal_start.jpg')] bg-cover bg-center bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Ist Ihr Job so lala? Dann lesen Sie weiter.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>„Find your greatness“ - das ist in meinem Verständnis der wichtigste Kern, wenn es darum</span
				>
				<span
					>geht, Mitarbeiter und Teams zu entwickeln. Denn mein „bestes Selbst“ kommt zu Tage,</span
				>
				<span
					>wenn ich in einer positiven Energie unterwegs bin. Einer Energie, die ansteckend ist.</span
				>
				<span>Für mein Team, für die Organisation, für meine Familie und Freunde.</span>
				<span>Dann kann ich Herausforderungen und Veränderungen gelassener begegnen.</span>
				<span
					>Und dazu ist es einerseits wichtig, zu lernen, welche Faktoren meine Energie beeinflussen</span
				>
				<span>und andererseits Kompetenzen erlernen, wie Kollegen und Mitarbeiter bestmöglich</span>
				ihre Energie bereitstellen können.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Diese Workshop-Formate sind Beispiele, die in der Vergangenheit hervorragend</span>
				<span
					>funktioniert haben, um das „beste Selbst“ des Einzelnen oder des Teams zu entwickeln.</span
				>
				Gerne erarbeite ich auch mit Ihnen gemeinsam ein auf Ihr Anliegen passendes Workshop-Format.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sie brauchen für Ihr Team jetzt einen Schuß Frische und ein Bündel neuer Skills von außen?
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
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">#Find your Greatness Vol 1:</span>
				Mehr Energie für den Job.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				In diesem Workshop geht es um das Führen der eigenen Person, denn nur wer sich selbst gut
				führen kann, kann auch andere gut führen. Hier vermittele ich die Grundlagen eines klugen
				Energie- und Ressourcenmanagements, um leistungsfähig zu bleiben, in einem Leben mit hoher
				Leistungsdichte. In meinem Verständnis ist dieser Workshop für jeden Menschen in
				arbeitsintensiven Berufen ein Grundbaustein in Sachen persönlichem Wachstum. Auf diesem
				Fundament lassen sich hervorragend viele weitere Fähigkeiten und Fertigkeiten entwickeln.
			</p>
		</div>
	</div>
	<MVideoContainer class="workshops-video effect-container">
		<div class="m-video h-full aspect1:h-full">
			<VideoJs id="video2" poster="/img/personal_video4.jpg">
				<!-- firmenworkshops video in livepeer studio susanne-preiss project -->
				<source
					src="https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/aaa8246iaw87lkrs/index.m3u8"
					type="application/x-mpegURL"
				/>
				<p
					class="vjs-no-js mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					To view this video please enable JavaScript, and consider upgrading to a web browser that
					<a href="https://videojs.com/html5-video-support/" target="_blank">
						supports HTML5 video
					</a>
				</p>
			</VideoJs>
		</div>
		<MHalfCover side="left" transparent={false} class="black-footer black-header">
			<h4
				class="my-5 mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] p-0 px-[calc(1.5rem+3vmin)] text-center font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Film "Firmenworkshops"
			</h4>
		</MHalfCover>
		<MHalfCover side="right" transparent={true} class="white-footer white-header">
			<MPlayButton />
		</MHalfCover>
	</MVideoContainer>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">#Find your Greatness Vol 2:</span>
				Mehr PS im Team.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				In diesem Workshop geht es um die Stärken des Einzelnen. Denn der Fokus liegt allzu häufig
				darauf, was Mitarbeiter nicht gut können. Der Blick auf die Stärken, und diese zu
				identifizieren, bringt die Kraft. So eine Art PS-Booster. Was ist denn eigentlich das, was
				ich am besten kann? Wo liegt mein Talent? Viele Menschen arbeiten seit Jahren in einem Beruf
				und erlauben sich diese Frage gar nicht. Ich helfe Ihnen dabei, dass Ihre Mitarbeiter eigene
				Talente entdecken oder noch mehr davon finden, und vor allem die Talente der Kollegen im
				Team. Denn wenn es uns gelingt, ein Team zu bauen, in dem unterschiedliche Fähigkeiten Raum
				bekommen, sich zu entfalten, wenn der Teamkollege versteht, warum genau das Talent des
				anderen zum Gelingen des Projektes beiträgt, dann kann das Team eine große Kraft entwickeln
				(oder: die PS auf die Straße bringen).
			</p>
		</div>
	</div>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">#Find your Greatness Vol 3:</span>
				Teambuilding.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				In diesem Workshop liegt der Fokus darauf, als Team gut zusammenzuwachsen, oder überhaupt
				zusammenzufinden oder eine gute gemeinsame Erfahrung außerhalb des Arbeitsumfeldes zu
				machen. Es ist nicht immer einfach, wenn zu einem bestehenden Team neue Kollegen dazu
				kommen. Oder wenn im Zuge von Change permanent neue Teams entstehen. Und deshalb ist es gut,
				ab und zu einen Reflektionsraum über die Frage aufzuspannen, warum wir eigentlich in Teams
				zusammenarbeiten. Warum wir nicht einfach alles allein machen. Wie es gelingt, in einer
				neuen Konstellation möglichst schnell wirksam und arbeitsfähig zu werden und einen
				gemeinsamen Teamspirit zu finden - das wollen wir erarbeiten. Wertschätzend und wohlwollend.
			</p>
		</div>
	</div>
	<MVideoContainer class="workshops-video effect-container">
		<div class="m-video h-full aspect1:h-full">
			<VideoJs id="video3" poster="/img/personal_video6.jpg">
				<!-- teambuilding video in livepeer studio susanne-preiss project -->
				<source
					src="https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/25f5e39p426wjiy2/index.m3u8"
					type="application/x-mpegURL"
				/>
				<p
					class="vjs-no-js mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					To view this video please enable JavaScript, and consider upgrading to a web browser that
					<a href="https://videojs.com/html5-video-support/" target="_blank">
						supports HTML5 video
					</a>
				</p>
			</VideoJs>
		</div>
		<MHalfCover side="left" transparent={false} class="black-footer black-header">
			<h4
				class="my-5 mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] p-0 px-[calc(1.5rem+3vmin)] text-center font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Film "Teambuilding"
			</h4>
		</MHalfCover>
		<MHalfCover side="right" transparent={true} class="white-footer white-header">
			<MPlayButton />
		</MHalfCover>
	</MVideoContainer>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">#Find your Greatness Vol 4:</span>
				Leadership Projektteams.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				In diesem Workshop geht es darum, dass die Führungskraft eine Methodenkompetenz erlernt, um
				Teams möglichst schnell kraftvoll und wirksam werden zu lassen. Das ist besonders dann
				wichtig, wenn im Rahmen von Projekten permanent neue Teams entstehen. Da braucht die
				Führungskraft neben dem fachlichen Know How insbesondere exzellente Führungsqualitäten. Es
				geht um Wertebildung und gelebter Kultur im Team, genauso wie um die konstruktive
				Konfliktfähigkeit und Transparenz.
			</p>
		</div>
	</div>
	<div
		class="m-heading-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="my-[calc(1.625rem+4.5vmin)] mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Das sagen meine Kunden.
			</h4>
		</div>
	</div>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">Ulrike Hallegger, Vice President Rooms Operations & Services,</span>
				Marriott Hotel Holding GmbH Europe
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				In March I provided my team with the opportunity to attend the Refuel Your Energy Workshop
				facilitated by Susanne Preiss. I cannot tell you how excited I am about that experience
				almost three months later. This holistic program strengthend our team spirit and built a
				solid foundation for reducing stress, increasing energy, and promoting overall wellbeing at
				work and at home.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				I wanted to take a moment and reiterate the core principles that our team practiced during
				the workshop:
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				1. What is impacting our day to day work life and making mindful choices
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				2. Meditation Exercises that increase your quality of life and are easy to execute on a
				daily basis
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				3. Removing yourself from socially added stress factors and prioritizing on the key
				attributes at home and at work
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				The benefits to our team are clear and I would encourage everyone to seek out opportunities
				like this one. Your teams will benefit, you will benefit, and your company will benefit from
				the increased productivity and job satisfaction.
			</p>
		</div>
	</div>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">Head of international HR Policies</span>
				Metro AG
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Besonders hervorheben möchte ich die brilliante Seminarleitung durch Frau Preiss. Sie hat es
				geschafft auf jeden Seminarteilnehmer individuell einzugehen, ohne den Teamgedanken zu
				vernachlässigen.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Ich kann das Seminar nachhaltig für all diejenigen empfehlen, die bereit sind, sich ein
				Stück weit zu öffnen.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sie erhalten ein Vielfaches ihrer Investition zurück.
			</p>
		</div>
	</div>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">Director Human Resources</span>
				SGS Germany
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Susanne Preiss versteht es meisterhaft, die Teilnehmer mit Humor, hoher Kompetenz und
				Professionalität in das Thema einzuführen. Mit ihrer gewinnenden Art überzeugt sie
				Teilnehmer davon, wie wichtig es sowohl für einen selbst als auch für das Unternehmen ist,
				sich selbst in der Balance zu halten und mit alltagstauglichen Übungen die eigenen
				Energiereserven kurzfristig wieder aufzuladen.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Die erlernten Methoden bewirken auch über die Maßnahme hinaus einen nachhaltigen Gewinn für
				jeden einzelnen und das Unternehmen.
			</p>
		</div>
	</div>
</div>
