<script>
	import Footer from '$lib/components/Footer/Footer.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container white-footer white-header">
		<MImage class="bg-[url('/img/business_start.jpg')] bg-cover bg-top bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Alle doof im Büro?
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Nehmen wir mal an, Sie haben ein Anliegen, mit dem Sie nicht weiterkommen. Etwas,</span
				>
				<span
					>worüber Sie immer öfter nachgrübeln. Etwas, was Sie nicht in den Schlaf kommen lässt</span
				>
				<span>oder wütend macht. Sie drehen sich im Kreis und kommen zu keiner Lösung. Oder</span>
				<span>vielleicht bringt ihr Verhalten Kollateralschäden mit sich, die sie nur schwer</span>
				<span
					>„wiedergutmachen“ können. Vielleicht haben Sie auch das Gefühl, dass das Problem die</span
				>
				<span
					>anderen sind. Zu langsam, zu unkooperativ, irgendwie zu blöd... Egal, was es ist:</span
				>
				<span
					>irgendwie raubt Ihnen „das Problem“ wertvolle Energie, die Sie an anderer Stelle gut</span
				>
				gebrauchen könnten.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>In meinen Business Coachings steht das Thema Energie- und Ressourcenmanagement</span>
				<span
					>an erster Stelle. Dazu gehört zunächst die Analyse des „Problems“. Wo verlieren Sie</span
				>
				<span
					>Energie? Was wünschen Sie sich stattdessen? Wie wäre Ihr Leben, Ihre Energie, wenn</span
				>
				<span
					>das Problem gelöst wäre? Was oder wen brauchen Sie dazu? Ich helfe Ihnen dabei, den</span
				>
				<span
					>Problemstrudel zu verlassen und Ihren Fokus auf mögliche Lösungen zu richten. Ihre</span
				>
				<span
					>Lösung. Nicht meine. Ihre einzigartigen Fähigkeiten und Ressourcen spielen dabei eine</span
				>
				<span
					>zentrale Rolle. Und wenn diese gut eingesetzt werden, dann kommen Sie in Ihre Kraft,</span
				>
				<span
					>können Ihr Potential auf die Straße bringen und diese Kraft ist ansteckend. Let´s find
					your</span
				>
				<span>greatness. Ich begleite Sie mit Ihrem Anliegen nicht als Berater sondern als</span>
				<span
					>Sparringspartner. Zukunfts- und lösungsorientiert, effizient, empathisch und vor allem
					mit</span
				>
				viel Spaß.
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sie sehen für sich und Ihre Aufgabe gerade den Wald vor lauter Bäumen nicht?
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
				<span class="block">Dr. Birgit Schöller,</span>
				Fachanwältin für Familienrecht, München
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Susanne Preiss hat einen klaren und liebevollen Blick auf ihr gegenüber. Sie hat intuitiv
				und schnell den Kern der Frage erfasst, die mich beschäftigt, hat sich nicht dadurch
				irritieren lassen, dass ich zunächst dachte, es sei etwas ganz anderes. Sehr konstruktiv und
				lösungsorientiert hat sie mich zu neuen Ansätzen geführt, wie ich mit meinem Thema umgehen
				kann. Neben dem Umstand, dass sie mir in kurzer Zeit enorm geholfen hat, hat es auch viel
				Spaß gemacht, mit ihr zu „arbeiten“.
			</p>
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">Friederike Lange,</span>
				Verlagsleitung, München
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Wer den Wald vor lauter Bäumen nicht mehr sieht, oder die Bäume einem gar über den Kopf zu
				wachsen drohen, wer nicht mehr weiß, wo lang und wohin es weiter geht, dem kann ich ein
				Coaching mit Susanne Preiss nur wärmstens empfehlen - und das in jeder Lebenslage! Anstatt
				im Jetzt zu verharren oder Vergangenes zu bedauern, hilft Susanne Preiss einem wieder
				gestärkt, selbstbewusst und voller Zuversicht in die Zukunft zu blicken. Und das ganz aus
				eigener Kraft! Sie gibt einem das Werkzeug an die Hand, um seine Werte zu definieren, seine
				Ziele klar zu formulieren und konsequent zu verfolgen - im Arbeits- wie auch im Privatleben.
				Mit ihrem langjährigen, branchenübergreifenden und tiefgreifenden Erfahrungshorizont, ihrer
				unendlichen Geduld und Ruhe fühlt sich bei ihr mit Sicherheit jeder Coachee sofort
				aufgehoben.
			</p>
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Unternehmerin aus Baden-Württemberg
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Liebe Susanne, als Coach bist Du vertrauenswürdig, kompetent, einfühlsam und auf meiner
				Wellenlänge. Du hast gut erkannt, wo der Hase im Pfeffer liegt. Du hast Dich auf mich und
				meine Situation eingestellt und Dir Zeit genommen. Du hast mir nichts übergestülpt, sondern
				mich unter Deiner Anleitung suchen und finden lassen. Verständnisvoll, dass man trotz aller
				Intelligenz an manchen Stellen psychologisch hängt und einfach die Hürde allein nicht
				überwindet. Du hast die für mich passenden Übungen gut ausgesucht und ich habe Ansporn
				bekommen, sie mit den anderen mir bekannten Übungen abwechslungsreich zu ergänzen. Für mich
				war die Zeit mit Dir hier vor Ort deshalb so wertvoll, weil ich mit Dir hier meinen Alltag
				zukünftig besser gestalten kann. Die Flipcharts in meinem Büro brauchen zwar viel Platz,
				aber sie zwingen mich zur Umsetzung.
			</p>
		</div>
	</div>
</div>
