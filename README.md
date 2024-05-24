# Digital Dice Actualización
## Adecuación a requisitos de SoftwareX
### Cambios en el software

1. [ ] Despliegue de mongoDB replicaset en Kubernetes
2. [x] Establecimiento de configuración de infraestructura y artefactos Kubernetes
3. [ ] Configuración de variables de entorno para Digital Dice en Kubernetes configmap. Incluida TD de dispositivo a manejar.
4. [ ] Generación de secretos para Digital Dice en Kubernetes. Incluidos cerfificados SSL auto-firmados. Documentación de como generarlos y añadir excepciones en el navegador.
5. [ ] Configuración de Ingress para Digital Dice en instalación local de Kubernetes.
6. [ ] Establecimiento de rutas de manera automática a partir de la TD.
7. [ ] Generación de comportamiento default para Digital Dice virtualizados en caso de que no haya virtualBehaviour.
8. [ ] Generación de TD del Digital Dice automática a partir de la TD del dispositivo.
9. [ ] Generación de OpenAPI a partir de la TD del Digital Dice.
10. [ ] Establecimiento de UI en los ejemplos del repo.
11. [ ] Establecimiento de 3 ejemplos (simpleLight, container, maletín) para desplegar en el repo. Los dos primeros virtualizados y el último no.
12. [ ] Generación de documentación del repo.
13. [x] Agregar licencia MIT al repo.
14. [ ] Liberación del repo en GitHub.
15. [ ] Redacción de publicación en SoftwareX. Cuidado limitaciones: 3000 palabras y 6 figuras max.
16. [ ] Revisión de la publicación por parte de los autores.
17. [ ] Envío de la publicación a SoftwareX.


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