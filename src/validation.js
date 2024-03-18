const regex = /^\d{4}-\d{2}-\d{2}$/;

export const validarFecha = (fecha) => {
    return regex.test(fecha)
};