//Metodo entra un contenedor aleatoriamente aumenta el peso del contenedor entre 0 y 1 (que no aumente por encima de la capacidad max) devuelve el nuevo contenedor

function throwGarbage(container){

    let garbage = Math.round(Math.random() * (1 * 10 - 1 * 10)) / (1 * 10);
   
    let newCapacity = container.capacity + garbage
    console.log(newCapacity);
   
    container.capacity = newCapacity.toFixed(2);

    return container;

}

module.exports = throwGarbage