<script lang="ts">
	let { children, ...props } = $props();
</script>

<div class="m-box-container mx-auto my-10 max-w-[800px] px-[3.125rem] {props.class}">
	{@render children()}
</div>
