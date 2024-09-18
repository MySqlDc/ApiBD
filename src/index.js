import express from 'express'
import cors from 'cors'
import { 
    PORT,
    URL_APP
} from './config.js'
import routerV1 from './v1/index.js'
import routerV2 from './v2/index.js'

const app = express()

app.use(express.json());

app.use(cors({origin: URL_APP}))
app.use('/v1', routerV1)    
app.use('/v2', routerV2)


app.use((req, res, next) => {
    res.status(404).json({
        status: 404,
        message: 'ruta no encontrada'
    })
})

app.listen(PORT)