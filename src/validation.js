const regex = /^\d{4}-\d{2}-\d{2}$/;

export const validarFecha = (fecha) => {
    return regex.test(fecha)
};

export const esDespues = (fecha1, fecha2) => {
    return fecha1.getFullYear() === fecha2.getFullYear() &&
        fecha1.getMonth() === fecha2.getMonth() &&
        fecha1.getDate() <= fecha2.getDate();
}