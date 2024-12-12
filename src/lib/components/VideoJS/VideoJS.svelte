<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Action } from 'svelte/action';
	import type { HTMLVideoAttributes } from 'svelte/elements';
	import videojs from 'video.js';
	import 'video.js/dist/video-js.css';

	const mouseEnterAddClass: EventListener = function (e) {
		(e.target as HTMLElement)?.closest('.effect-container')?.classList.add('mouse-enter');
	};

	const mouseLeaveRemoveClass: EventListener = function (e) {
		(e.target as HTMLElement)?.closest('.effect-container')?.classList.remove('mouse-enter');
	};

	const startVideo: EventListener = function (e) {
		const effectContainer = (e.target as HTMLElement)?.closest('.effect-container');
		const video = effectContainer?.querySelector('.video-js');
		effectContainer?.classList.add('video-start');
		if (video)
			setTimeout(() => {
				videojs.getPlayer(video)?.ready(function () {
					this.play()?.then(() => {
						this.controls(true);
					});
					this.on('ended', () => {
						endVideo(this, effectContainer);
					});
				});
			}, 200);
	};

	function endVideo(player: videojs.Player, effectContainer: Element | null) {
		player.hasStarted(false);
		player.bigPlayButton.dispose();

		effectContainer?.classList.remove('video-start');
	}

	export function createEffectClasses() {
		document
			.querySelectorAll('.m-link')
			.forEach((el) => el.addEventListener('mouseenter', mouseEnterAddClass));
		document
			.querySelectorAll('.m-link')
			.forEach((el) => el.addEventListener('mouseleave', mouseLeaveRemoveClass));
		document
			.querySelectorAll('.m-play-button')
			.forEach((el) => el.addEventListener('mouseenter', mouseEnterAddClass));
		document
			.querySelectorAll('.m-play-button')
			.forEach((el) => el.addEventListener('mouseleave', mouseLeaveRemoveClass));
		document
			.querySelectorAll('.m-play-button')
			.forEach((el) => el.addEventListener('click', startVideo));
	}

	const action: Action<HTMLVideoElement> = (node) => {
		// the node has been mounted in the DOM
		$effect(() => {
			// setup goes here
			const player = videojs(node, {
				controls: false,
				preload: 'auto'
			});
			console.log(player);
			// register event listeners
			createEffectClasses();
			return () => {
				// remove event listeners
				document
					.querySelectorAll('.m-link')
					.forEach((el) => el.removeEventListener('mouseenter', mouseEnterAddClass));
				document
					.querySelectorAll('.m-link')
					.forEach((el) => el.removeEventListener('mouseleave', mouseLeaveRemoveClass));
				document
					.querySelector('.m-play-button')
					?.removeEventListener('mouseenter', mouseEnterAddClass);
				document
					.querySelector('.m-play-button')
					?.removeEventListener('mouseleave', mouseLeaveRemoveClass);
				document.querySelector('.m-play-button')?.removeEventListener('click', startVideo);
				player.dispose();
			};
		});
	};

	let { children, ...rest }: { children: Snippet } & HTMLVideoAttributes = $props();
</script>

<video class="video-js h-full w-full {rest.class}" {...rest} use:action>
	{@render children()}</video
>
