# Garbage-IIoT experimental scenario
Experimental scenario of a garbage recollection service using DD.

## Requirements

To execute the different scenarios, you need to have installed the following software:

1. Docker.
2. Kubernetes.
3. MongoDB as a replica set.

## Replicating the scenario
First you need to adjust the parameters inside the `.env.example` and rename them to `.env`. Then build the docker image for each of the components of the scenario. Those components are inside the folders:
* Containers
* Routes
* Trucks

For each folder inside those folders, you need to create a docker image with the following naming pattern `dd-garbage-{nameOfTheThing}-{nameOfTheMicroservice}`, i.e., `dd-garbage-containers-controller`. To do so use the following command inside each of the microservices folders (where the dockerfile is located):

```
docker build -t dd-garbage-containers-controller
```

Once created the images for each of the microservices you need to run the following command inside the `k8s` folder for each `.yml` file insde the folder.

```
kubectl apply -f {nameOfTheThing}.yml
```