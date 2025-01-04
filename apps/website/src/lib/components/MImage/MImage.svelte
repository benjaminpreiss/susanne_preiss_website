<script lang="ts">
	let props = $props();
</script>

<div class="m-image h-full w-full {props.class}">
	{@render props.children?.()}
</div>
