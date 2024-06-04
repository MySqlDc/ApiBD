export const esDespues = (fecha1, fecha2) => {
    return fecha1.getTime() <= fecha2.getTime()
}