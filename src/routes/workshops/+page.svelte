<script>
	import Button from '$lib/components/Button/Button.svelte';
	import Footer from '$lib/components/Footer/Footer.svelte';
	import MHalfCover from '$lib/components/MHalfCover/MHalfCover.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
	import MImageContainer from '$lib/components/MImageContainer/MImageContainer.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import MPlayButton from '$lib/components/MPlayButton/MPlayButton.svelte';
	import MVideoContainer from '$lib/components/MVideoContainer/MVideoContainer.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import VideoJs from '$lib/components/VideoJS/VideoJS.svelte';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container black-footer black-header">
		<MImage class="bg-[url('/img/workshops_start.jpg')] bg-cover bg-center bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Und ewig grüßt das Murmeltier.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Wie bleiben Sie leistungsfähig in einem Leben hoher Leistungsdichte, schnellem Tempo</span
				>
				<span
					>und permanenten Veränderungen? Und vor allem, wie gelingt es Ihnen dabei, gesund und</span
				>
				<span
					>zufrieden zu bleiben? Das lernen Sie in meinen offenen Kursen. Für ein Leben mit mehr</span
				>
				Energie - nicht nur für den Beruf, sondern auch für Ihr Privatleben.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Fakt ist: Die Anforderungen steigen - aber unsere Energie bleibt gleich. Energie meint in</span
				>
				<span
					>diesem Zusammenhang die Kraft, gute Leistung erbringen zu können. Für viele Menschen</span
				>
				<span
					>bedeutet das ein Wettlauf mit der Zeit. Sie fangen an, Ihre Zeit zu managen. Sie sind</span
				>
				<span
					>erschöpft und nicht mehr wirklich ihr bestes Selbst. Viel wichtiger ist es aber, die
					eigene</span
				>
				Energie klug zu managen.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>In diesem Auszeit-Training haben Sie Zeit, um die wichtigsten Methoden für ein kluges</span
				>
				<span>Energie- und Ressourcenmanagement zu erlernen. Sie lernen die wichtigste</span>
				<span
					>Managementaufgabe: sich selbst zu führen. Ich helfe Ihnen dabei, in Ihre Kraft zu kommen</span
				>
				für Ihr bestes Selbst „Find your greatness!“
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sie wollen leistungsfähig bleiben? Und sich Ihre gute Laune erhalten?
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
	<MVideoContainer class="workshops-video effect-container">
		<div class="m-video h-full aspect1:h-full">
			<VideoJs id="video1" poster="/img/workshops_video2.jpg">
				<!-- kurse video in livepeer studio susanne-preiss project -->
				<source
					src="https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/0ca4xk0fr579ze1k/index.m3u8"
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
				Film "Offene Kurse"
			</h4>
		</MHalfCover>
		<MHalfCover side="right" transparent={true} class="black-footer black-header">
			<MPlayButton />
		</MHalfCover>
	</MVideoContainer>
	<div
		class="m-heading-container-middle effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px] text-center"
	>
		<h4
			class="my-[calc(1.625rem+4.5vmin)] mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic"
		>
			Kurse.
		</h4>
	</div>
	<MImageContainer class="effect-container">
		<MHalfCover side="right" transparent={false} class="black-footer black-header">
			<a class="m-link" href="/pdf/workshops1.pdf" target="_blank" rel="noreferrer noopener">
				<p
					class="m-0 mb-5 mt-0 p-0 px-[calc(1.5rem+3vmin)] text-center font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					Keine Termine
				</p>
				<p
					class="m-0 mb-5 mt-0 p-0 px-[calc(1.5rem+3vmin)] text-center font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					verfügbar
				</p>
				<h4
					class="my-5 mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] p-0 px-[calc(1.5rem+3vmin)] text-center font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic"
				>
					Einsteigerkurs Steinhude
				</h4>
				<p
					class="m-0 mb-5 mt-0 p-0 px-[calc(1.5rem+3vmin)] text-center font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					Steinhuder Meer
				</p>
			</a>
		</MHalfCover>
		<MHalfCover side="left" transparent={true} class="black-footer black-header"></MHalfCover>
		<MImage class="bg-[url('/img/steinhuder_meer.JPG')] bg-cover bg-center bg-no-repeat" />
	</MImageContainer>
	<MImageContainer class="effect-container">
		<MHalfCover side="left" transparent={false} class="black-footer black-header">
			<a class="m-link" href="/pdf/workshops2.pdf" target="_blank" rel="noreferrer noopener">
				<p
					class="m-0 mb-5 mt-0 p-0 px-[calc(1.5rem+3vmin)] text-center font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					Keine Termine
				</p>
				<p
					class="m-0 mb-5 mt-0 p-0 px-[calc(1.5rem+3vmin)] text-center font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					verfügbar
				</p>
				<h4
					class="my-5 my-5 mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] p-0 p-0 px-[calc(1.5rem+3vmin)] text-center text-center font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic"
				>
					Fortgeschrittenenkurs Vigilius
				</h4>
				<p
					class="m-0 mb-5 mt-0 p-0 px-[calc(1.5rem+3vmin)] text-center font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
				>
					Südtirol
				</p>
			</a>
		</MHalfCover>

		<MHalfCover side="right" transparent={true} class="black-footer black-header"></MHalfCover>
		<MImage class="bg-[url('/img/vigilius_2.jpg')] bg-cover bg-center bg-no-repeat" />
	</MImageContainer>
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
				Radiologin, 40 Jahre
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Liebe Susanne, zuerst einmal Dir vielen Dank für diese tollen, perfekt durchorganisierten 2
				Tage. Ich bin gerne dabei gewesen, mich wohl gefühlt, erholt und Reserven wieder aufgetankt.
				Und dies ist v.a. Dir zu verdanken, denn Du hast uns - eine in sich recht differente Gruppe
				- nicht nur sehr professionell, sondern auch sehr authentisch durch diese 2 Tage geführt. Du
				warst großartig!
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				In den letzten Tagen habe ich es tatsächlich geschafft, den Tag mit den 8 Alltagsübungen zu
				beginnen. Der Kreislauf wird wirklich aktiviert. Auch wenn ich zurück bin in meinem
				Alltagsleben so fühle ich mich dennoch gestärkt, resistenter und mit wieder ein bisschen
				mehr gesundem Selbstbewusstsein ausgestattet. Vielen Dank für Dein Engagement!
			</p>
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Josef May, Geschäftsführer, Silhouette Deutschland
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Auszeittraining. Interessantes Wort für jemanden, der jahrelang unter Hochdruck arbeitet und
				langsam merkt, wie die Nerven dünner und der Schlaf unruhiger werden. Spannendes Training
				zum Entschleunigen. Perfekte Trainerin, die jeden Menschen dort abholt, wo er steht und dort
				hinbringt, wo er hin gehört. Echt nichts für Esoteriker – aber wohltuend für Pragmatiker mit
				vielen Tipps und Anleitungen für ein besseres Leben in Balance. Ab sofort. Mich haben die
				beiden Tage Auszeit für mein Leben in Echtzeit nachhaltig weitergebracht.
			</p>
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sabine Galas, Journalistin, München
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Zwei Tage, die mich gänzlich neu gepolt haben – das ist mein Fazit aus dem „Unplugged-
				Seminar“ am Steinhuder Meer. Mit Qi-Gong habe ich einen für mich maßgeschneiderten Weg
				gefunden, um mit Stress und Alltagsbelastung besser fertig zu werden. Die Übungen tun mir
				unglaublich gut, geben mir stetig neue Energie – und ein angenehmes Gefühl der
				Unabhängigkeit. „Kopf schwebt“ – und ich fühle mich frei! Danke, Susanne!
			</p>
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Tina Voß, Geschäftsführende Gesellschafterin Tina Voß GmbH
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Ich mochte sofort den schnellen Erholungseffekt und war angenehm überrascht, dass ich in
				keiner Ecke des Kurses Esoterik-Einflüsse gefunden habe. Es ist schlicht eine leicht zu
				lernende perfekte Methode, um zu entspannen und sich wohlzufühlen.
			</p>
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Ulrike Ruschemeier-Kochen, Vorstand el Leasing & Service AG
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Die Übungen mache ich täglich - und sie tun mir so gut! Ich habe deutlich weniger
				Verspannungen und bin wirklich gelassener. Dir noch mal vielen, vielen Dank für die schöne
				Zeit, für Deine geduldigen Erklärungen und die vielen Anregungen.
			</p>
		</div>
	</div>
</div>
