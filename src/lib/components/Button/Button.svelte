<script lang="ts">
	let props = $props();
</script>

<button class="box-border h-[1.875rem] rounded-none bg-transparent {props.class}"
	>{@render props.children?.()}</button
>
