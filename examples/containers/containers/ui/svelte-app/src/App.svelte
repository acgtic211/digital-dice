<script>
	import { onMount } from "svelte";
	import { apiData, containersData } from './store.js';
	import ContainerInfo from "./ContainerInfo.svelte";
	let sim = false;

	async function initiateSimulation(){

		var res = await fetch('https://localhost:30001/acg:lab:virtual-containers/runApp', {
			method: 'PUT',
			body: {}
		});

		sim = await res.json();
		
		console.log('Run app: ', sim);

	}


	onMount(async() => {

		fetch('https://localhost:30001/acg:lab:virtual-containers/property/containersDetails', {
			method: 'GET'
		}).then(response => response.json())
		.then(data => {
			console.log(data);
			apiData.set(data);
		}).catch(error => {
			console.log(error);
			return [];
		})
	});


</script>

<div>

	<div>
		{#if sim}
			<button class="btn off" on:click={initiateSimulation}>Stop simulation</button>
		{:else}
			<button class="btn on" on:click={initiateSimulation}>Initiate simulation</button>
		{/if}
		
	</div>

	
	{#each Object.entries($containersData) as [k,v]}
		<div class="containers">
			<ContainerInfo contData={v}/>
		</div>
	{/each}
	

</div>

<style>
	.containers {
		float:left;
	}
	.btn{
		border-radius: 8px;
		justify-content: center;
	}

	.on{
		color: #ffffff;
		background-color: #35aa35;
	}

	.off{
		color: #ffffff;
		background-color: #ff1d1d;
	}

	

</style>

