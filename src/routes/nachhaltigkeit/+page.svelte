<script>
	import Footer from '$lib/components/Footer/Footer.svelte';
	import MBoxContainer from '$lib/components/MBoxContainer/MBoxContainer.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import RedArrow from '$lib/components/RedArrow/RedArrow.svelte';
	import sustainabilityModules from './modules.json';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container white-footer white-header">
		<MImage class="bg-[url('/img/nachhaltigkeit_start.jpg')] bg-cover bg-center bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Nicht so tun, als ob einen das alles nichts angeht.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Gerade die letzten beiden Jahre zeigen uns mit Macht, dass sich Gesellschaft und</span
				>
				<span>Wirtschaft weltweit dramatisch ändern. Zur Fridays-For-Future-Bewegung kann man</span>
				<span>stehen, wie man will – aber es ist nicht zu leugnen, dass Klimakrise und</span>
				<span
					>Nachhaltigkeit bei vielen Menschen ein dringliches Thema geworden sind. Autos mit</span
				>
				<span>Verbrennungsmotor stehen auf dem Prüfstand, die Massentierhaltung kollabiert und</span
				>
				<span>Flugreisen auf Kurzstrecken sind fast peinlich geworden. Und Corona als</span>
				Brandbeschleuniger sortiert unbarmherzig aus, was gefragt ist und was nicht.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Wie nah geht uns diese Entwicklung ganz persönlich? Halten wir wirtschaftlich</span>
				halbwegs mit? Und wie können wir in dieser Welt gesund und zufrieden leben?
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Mich beschäftigen diese Zusammenhänge zwischen Energie- und</span>
				<span>Ressourcenmanagement auf der einen, und Nachhaltigkeit auf der anderen Seite</span>
				<span>schon seit geraumer Zeit. Als Trainerin und Business Coach war es für mich somit</span
				>
				<span>folgerichtig, 2020 eine zusätzliche Ausbildung zum zertifizierten „Sustainable</span>
				Business Transformation Manager“ zu machen.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Die Kernfrage ist: Wie passt alles zusammen? Wie gelangt der Nachhaltigkeitsgedanke</span
				>
				<span>auch in unsere Herzen, unsere Nervenbahnen und in unsere Hände? Wie</span>
				<span
					>wird aus einer Einsicht ein Reflex? Schließlich wollen wir als Menschen, Team und</span
				>
				<span
					>Organisation leistungsfähig, kreativ, und resilient sein. Wir suchen Erfüllung und</span
				>
				Freude an unserer Arbeit sowie natürlich auch in unserem privaten Leben.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Dies gilt ganz besonders für die nachwachsende Generation. Mir begegnen immer</span>
				<span>mehr Führungskräfte in meinen Seminaren, die mir sehr deutlich machen, dass es</span>
				<span>den gut ausgebildeten, engagierten Bewerbern nicht mehr nur um den reinen Job,</span>
				<span>mehr Geld und Karriere geht. Leben und Arbeiten ohne Sinn, ohne soziales</span>
				Miteinander, ohne ökologische Produkte braucht wirklich kein junger Mensch.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Für Ihr <b class="font-semibold">Nachhaltigkeits-Coaching und -vision</b> biete ich Ihnen
					mit dem Gut</span
				>
				<span>Haidehof in Wedel eine äußerst interessante Location an. Hier arbeiten junge,</span>
				<span
					>engagierte Agrarpioniere in der regenerativen Landwirtschaft mit Modellcharakter:</span
				>
				<b class="font-semibold">www.gut-haidehof.de</b>
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Lassen Sie uns gemeinsam an Ihrer individuellen Nachhaltigkeitsstrategie arbeiten.</span
				>
				Und sofort Ideen umsetzen. Zeit, zu handeln. Heute. Jetzt.
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
	<MBoxContainer class="white-bg-footer white-bg-header">
		{#each sustainabilityModules as module}
			<div
				class="m{module.id} effect-container m-2.5 border-[0.8px] border-solid border-black p-2.5"
			>
				<a class="m-link" href={module.pdfLink} target="_blank" rel="noreferrer noopener">
					<h6
						class="m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
					>
						{module.title}
					</h6>
					<p
						class="m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
					>
						{module.description}
					</p>
					<p
						class="redAnchor m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] text-[#ff0000] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
					>
						PDF <RedArrow
							class="h-[0.7em] transition-transform duration-100 ease-in-out [.mouse-enter_&]:translate-x-full [.mouse-enter_&]:transition-transform [.mouse-enter_&]:duration-100 [.mouse-enter_&]:ease-in-out"
						/>
					</p>
				</a>
			</div>
		{/each}
	</MBoxContainer>
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
				<span class="block">Ulrich Kühn, Vorstand</span>
				codecentric AG
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Wenn man intellektuell verstanden hat, dass wir auf unserem Planeten über unsere
				Verhältnisse leben und das komplexe Thema Nachhaltigkeit in operatives Handeln überführen
				möchte, dann ist das Seminar genau das Richtige!
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
				<span class="block">Alex Obertop, Direktor</span>
				Side Hotel Hamburg
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Mit dem ganzheitlichen Ansatz und einer tollen Umsetzung wird der Fokus eines jeden
				Teilnehmers nachjustiert oder sogar neu ausgerichtet. Für mich und meinem Unternehmen gibt
				es keinen Schritt zurück mehr, sondern immer weiter an unserer Entwicklung zum Thema Umwelt
				und Nachhaltigkeit zu arbeiten.
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
				<span class="block">Martin Lüning, Senior Key Account Manager</span>
				Weischer.Cinema
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Schon der Einstieg in die Thematik anhand des Beispiels der nachhaltigen, regenerativen
				Landwirtschaft auf dem Haidehof, gepaart mit den leidenschaftlichen Ausführungen des
				Intensivmediziners Dr. Stephan Böhm, der sich nach eigener Aussage mit der Leitung des Gutes
				und den gesetzten Zielen der größten Herausforderung seines Lebens gestellt hat, spricht für
				sich.
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
				<span class="block">Olaf Engemann, Vorstand</span>
				Süddeutsche Krankenversicherung
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Über die 17 Ziele für nachhaltige Entwicklung der UN habe ich mir meine persönlichen Ziel
				und Werte nochmals bewusst machen können und letztendlich den Grundstein für meine
				nachhaltigen persönlichen, wie unternehmerischen Zukunftsziele gesetzt.
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
				<span class="block">Tanya Kumst, Geschäftsführerin</span>
				Kumst Medien
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Selten habe ich ein Seminar erlebt, welches so viele neue Ansatzpunkte bringt und durch die
				Umgebung des Haidehofs einen beseelt und voller neuer umsetzungsgarantierter Ideen den Tag
				rückblickend zu einem besonderen Erlebnis macht.
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
				<span class="block">Gerald Scheer, Bereichsleiter Controlling</span>
				Medac
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Denn ich habe das Thema Nachhaltigkeit eben auch sehr auf meine persönliche, vor allen auch
				berufliche Situation bezogen, die zwar von einigem Komfort gekennzeichnet ist, aber mein
				Potenzial und meine Stärken bei Weitem nicht widerspiegeln. Ich möchte mich also dort
				einbringen, wo ich selber nachhaltig sein kann. Ich möchte Spuren hinterlassen und
				Wirksamkeit erzeugen. Dazu muss ich die Ressource „Gerald“ am richtigen Ort und in der
				richten Form einsetzen.
			</p>
		</div>
	</div>
</div>
