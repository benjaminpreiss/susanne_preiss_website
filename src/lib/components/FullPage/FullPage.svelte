<script lang="ts">
	import type { Snippet } from 'svelte';
	import 'fullpage.js/dist/fullpage.css';
	import type {
		FullPageCallback,
		FullPageConstructor,
		FullPageInstance,
		FullPageOptions
	} from './types';

	let {
		options,
		callback,
		children
	}: {
		options: FullPageOptions;
		callback: FullPageCallback;
		children: Snippet;
	} = $props();

	let fullpage: FullPageInstance;

	import type { Action } from 'svelte/action';

	const fullpageAction: Action<HTMLDivElement, FullPageConstructor> = (node, FullPage) => {
		// the node has been mounted in the DOM
		$effect(() => {
			// setup goes here
			fullpage = new FullPage('#fullpage', options);
			callback(fullpage);
			return () => {
				console.log('destroying...');
				// teardown goes here
				if (fullpage) {
					console.log('...fullpage');
					fullpage.destroy('all');
				}
			};
		});
	};
</script>

{#await (async () => (await import('fullpage.js')).default)() then FullPage}
	<div use:fullpageAction={FullPage} id="fullpage">
		{@render children()}
	</div>
{/await}
