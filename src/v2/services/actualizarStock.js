import { getQuery, putQuery } from "../database/queries.js";
import { crearFactura, eliminarFactura, leerFacturaCodigo, leerFacturas } from "../database/queriesMongo/facturas.js";
import { getPedidos } from '../services/api_elian.js'
import { esDespues } from '../validators/facturaValidator.js'

export const actualizarItems = async (items) => {
    let updateKit = false;
    for(const item of items){
        if(item.sku === null) continue;

        const { response } = await getQuery("SELECT producto_id FROM sku_producto WHERE sku = $1", [item.sku])

        if( !response){
            console.log("Fallo la consulta de datos");continue;
        }

        if(response.mensaje){
            console.log("el sku del producto no esta registrado", item);continue;
        } 

        if(!item.sku.startsWith('KIT')){
            await putQuery("UPDATE productos SET unidades_virtuales = unidades_virtuales "+(item.status==="SIN SALIDA"?"-":"+")+" $1 WHERE id = $2", [item.unidades, response.data[0].producto_id])
        } else {
            updateKit = true;
            await putQuery("UPDATE productos SET unidades_virtuales = unidades_virtuales "+(item.status==="SIN SALIDA"?"-":"+")+" $1 WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE id = $2)", [item.unidades, response.data[0].producto_id])
        }
    }

    if(updateKit) await getQuery("SELECT inventario_kit_general()");

    console.log("items actualizados")
}

export const actualizarPedidos = async() => {
    let hace5dias = new Date();
    hace5dias.setDate(hace5dias.getDate() - 5);

    try{
        const registros = await leerFacturas();
        let data = [];

        let datosShopi = await getPedidos("SHOPIFY");
        data = data.concat(datosShopi);
        
        let datosFala = await getPedidos("FALABELLA");
        data = data.concat(datosFala);

        let datosML = await getPedidos("MERCADOLIBRE");
        data = data.concat(datosML);
        
        let datosFiltrados = data.filter(pedido => {
            const esFechaReciente = esDespues(hace5dias, new Date(pedido.date_generate));
            const existeEnRegistros = registros.some(registro => {registro.codigo === pedido.id});
          
            return esFechaReciente || existeEnRegistros;
        }).map(pedido => {return {...pedido.order, fecha: pedido.date_generate}})
        .filter(dato => {
            const existeCambio = registros.filter(registro => registro.codigo === dato.id).length > 0 && dato.status !== 'SIN SALIDA';
            const noExisteSinSalida = !registros.filter(registro => registro.codigo === dato.id).length > 0 && dato.status === 'SIN SALIDA';

            return  existeCambio || noExisteSinSalida
        });
        
        const items = datosFiltrados.flatMap(pedido => {
                return pedido.items.map(item => ({
                    sku: item.item.sku,
                    unidades: item.item.quantity,
                    status: pedido.status,
                    codigo: pedido.id,
                    plataforma: pedido.platform
                }))
            }).filter(item => item.sku !== null);

        await actualizarItems(items);

        for(const elemento of datosFiltrados){
            if(elemento.status !== 'SIN SALIDA'){
                const factura = await leerFacturaCodigo(elemento.id);
                if(!factura) continue;

                await eliminarFactura(factura._id);
            } else {
                const productos = elemento.items.map(item => ({sku: item.item.sku, "unidades": item.item.quantity}))
                await crearFactura({codigo: elemento.id, fecha: elemento.fecha, estado: elemento.status, productos});
            }
        };

        console.log("actualizado")

        return {status: 200, response: {confirmacion: "se actualizo el registro de pedidos"}}
    } catch(error){

        console.log(error)
        return {status: 400, response: {error}}
    }
}