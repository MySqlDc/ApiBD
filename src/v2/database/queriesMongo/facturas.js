import Factura from "../../models/facturas.js";

// Crear una nueva factura
export const crearFactura = async (datosFactura) => {

  console.log("crear factura", datosFactura);

  try {
    const nuevaFactura = new Factura(datosFactura);
    console.log("nueva factura", nuevaFactura)
    const resultado = await nuevaFactura.save();
    console.log('Factura creada:', resultado);
    return resultado;
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;
  }
};

// Leer todas las facturas
export const leerFacturas = async () => {
  try {
    const facturas = await Factura.find().populate('productos');
    console.log('Facturas:', facturas);
    return facturas;
  } catch (error) {
    console.error('Error al leer facturas:', error);
    throw error;
  }
};

export const leerFactura = async (id) => {
  try {
    const factura = await Factura.findById(id);
    if(!factura){
      throw new Erro('factura no encontrada');
    }

    return factura;
  } catch (error) {
    console.error("Error en la creacion factura", error);
    throw error;
  }
}

// Actualizar una factura por ID
export const actualizarFactura = async (id, datosActualizados) => {
  try {
    const resultado = await Factura.findByIdAndUpdate(id, datosActualizados, { new: true });
    console.log('Factura actualizada:', resultado);
    return resultado;
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    throw error;
  }
};

// Eliminar una factura por ID
export const eliminarFactura = async (id) => {
  try {
    const resultado = await Factura.findByIdAndDelete(id);
    console.log('Factura eliminada:', resultado);
    return resultado;
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    throw error;
  }
};
