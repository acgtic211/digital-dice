<script>
import { onMount } from "svelte";


    export let contData;
    var h;
    var color;
    var yh;
    var expand = false;

    function interactInfo(opt){
        expand = !expand;
    }

    onMount(async ()=> {
        h = parseInt((contData.capacity/contData.totalCapacity)*100);
        switch(contData.garbageClass){
            case 'organic':
                color = "olive";
                break;
            case 'paper':
                color = "#0374dd";
                break;
            case 'plastic':
                color = "yellow";
                break;
            default:
                color = "black";
                break;
        }

        yh = 105 - h;
        
    })
</script>

<div class="card">
    <div class="box">

        <div class="img">
            <svg width="110" height="110" viewBox="0 0 110 110">
                <rect width="110" height="110" style="fill: #9a9a9a;" rx="8" ry="8">
                    
                </rect>
                <rect width="100" height={h} style="fill:{color};" x="5" y="{yh}" rx="8" ry="8"/>
            </svg>
        </div>

        <div class="text">
            <div class="fragment">
                <p class="pd f">Serial number: </p>
                <p class="pd">{contData.serialNumber}</p>
            </div>
            {#if expand == true}
                <div class="fragment">
                    <p class="pd f">Capacity: </p>
                    <p class="pd">{contData.capacity.toFixed(2)}/{contData.totalCapacity}</p>
                </div>
                <div class="fragment">
                    <p class="pd f">Address: </p>
                    <p class="pd">{contData.address}</p>
                </div>
                <div class="fragment">
                    <p class="pd f">Garbage class: </p>
                    <p class="pd {contData.garbageClass}">{contData.garbageClass}</p>
                </div>
                <div class="fragment">
                    <p class="pd f">Temperature: </p>
                    <p class="pd">{contData.temperature}</p>
                </div>
            {/if}
            <div class="btn-div">
                <button class="btn" on:click={interactInfo}>Show</button>
            </div>
        </div>
    </div>
</div>


<style>
    .card{
        background-color: #9a9a9a;
        border-radius: 8px;
        margin: 5px;
        padding: 5px;
    }

    .box{
        background-color: white;
        border-radius: 8px;
        padding: 5px;
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    .img{

    }

    .text{

    }


    .fragment{
        height: 35px;
    }

    .f{
        font-weight: bold;
    }
    .pd{
        display: inline-block;
    }

    .btn{
        text-decoration: none;
        border-radius: 8px;
        display: block;
        width: 100px;
    }

    .btn:hover{
        box-shadow: 0px 15px 20px rgba(51, 51, 51, 0.4);
        background-color: #0374dd;
        color: #ffffff
    }

    .btn-div{
        margin-top: 10px;
    }

</style>