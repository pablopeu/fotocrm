import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import basicAuth from 'express-basic-auth'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import validator from 'validator'
import xss from 'xss'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Paths
const DATA_DIR = path.join(__dirname, '..', 'data')
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json')
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json')

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: { error: 'Demasiadas solicitudes, intente más tarde.' }
})
app.use('/api/', limiter)

// Servir uploads estáticos
app.use('/uploads', express.static(UPLOADS_DIR))

// Basic Auth para rutas admin
const adminAuth = basicAuth({
  users: { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'admin123' },
  challenge: true,
  realm: 'FotoCRM Admin'
})

// Configuración de Multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y WebP.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

// Helpers para leer/escribir JSON
async function readJSON(filepath) {
  try {
    const data = await fs.readFile(filepath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return filepath.includes('categories') ? { categories: [] } : { photos: [] }
    }
    throw error
  }
}

async function writeJSON(filepath, data) {
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

// Sanitizar input
function sanitize(str) {
  if (typeof str !== 'string') return str
  return xss(validator.escape(str.trim()))
}

// ===================
// RUTAS PÚBLICAS
// ===================

// GET /api/categories - Obtener árbol de categorías
app.get('/api/categories', async (req, res) => {
  try {
    const data = await readJSON(CATEGORIES_FILE)
    res.json(data)
  } catch (error) {
    console.error('Error al leer categorías:', error)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

// GET /api/photos - Listar todas las fotos
app.get('/api/photos', async (req, res) => {
  try {
    const data = await readJSON(PHOTOS_FILE)
    res.json(data)
  } catch (error) {
    console.error('Error al leer fotos:', error)
    res.status(500).json({ error: 'Error al obtener fotos' })
  }
})

// GET /api/photos/:id - Obtener foto específica
app.get('/api/photos/:id', async (req, res) => {
  try {
    const data = await readJSON(PHOTOS_FILE)
    const photo = data.photos.find(p => p.id === req.params.id)
    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' })
    }
    res.json(photo)
  } catch (error) {
    console.error('Error al leer foto:', error)
    res.status(500).json({ error: 'Error al obtener foto' })
  }
})

// GET /api/search - Buscar fotos
app.get('/api/search', async (req, res) => {
  try {
    const { query, steel, category } = req.query
    const data = await readJSON(PHOTOS_FILE)

    let results = data.photos

    if (query) {
      const sanitizedQuery = sanitize(query).toLowerCase()
      results = results.filter(p =>
        p.text?.toLowerCase().includes(sanitizedQuery) ||
        p.name?.toLowerCase().includes(sanitizedQuery)
      )
    }

    if (steel) {
      const sanitizedSteel = sanitize(steel).toLowerCase()
      results = results.filter(p => p.steel_type?.toLowerCase() === sanitizedSteel)
    }

    if (category) {
      results = results.filter(p => p.cat_id === category)
    }

    res.json({ photos: results })
  } catch (error) {
    console.error('Error en búsqueda:', error)
    res.status(500).json({ error: 'Error al buscar' })
  }
})

// ===================
// RUTAS ADMIN (protegidas)
// ===================

// POST /api/admin/categories - Crear categoría
app.post('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const { name, parent_id } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Nombre requerido' })
    }

    const data = await readJSON(CATEGORIES_FILE)
    const newCategory = {
      id: uuidv4(),
      name: sanitize(name),
      parent_id: parent_id || null,
      children: []
    }

    if (parent_id) {
      const findAndAdd = (categories) => {
        for (const cat of categories) {
          if (cat.id === parent_id) {
            cat.children = cat.children || []
            cat.children.push(newCategory)
            return true
          }
          if (cat.children && findAndAdd(cat.children)) {
            return true
          }
        }
        return false
      }
      findAndAdd(data.categories)
    } else {
      data.categories.push(newCategory)
    }

    await writeJSON(CATEGORIES_FILE, data)
    res.status(201).json(newCategory)
  } catch (error) {
    console.error('Error al crear categoría:', error)
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

// PUT /api/admin/categories/:id - Actualizar categoría
app.put('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const { name } = req.body
    const data = await readJSON(CATEGORIES_FILE)

    const findAndUpdate = (categories) => {
      for (const cat of categories) {
        if (cat.id === req.params.id) {
          cat.name = sanitize(name)
          return cat
        }
        if (cat.children) {
          const found = findAndUpdate(cat.children)
          if (found) return found
        }
      }
      return null
    }

    const updated = findAndUpdate(data.categories)
    if (!updated) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    await writeJSON(CATEGORIES_FILE, data)
    res.json(updated)
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    res.status(500).json({ error: 'Error al actualizar categoría' })
  }
})

// DELETE /api/admin/categories/:id - Eliminar categoría
app.delete('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const data = await readJSON(CATEGORIES_FILE)

    const findAndDelete = (categories) => {
      const index = categories.findIndex(c => c.id === req.params.id)
      if (index !== -1) {
        categories.splice(index, 1)
        return true
      }
      for (const cat of categories) {
        if (cat.children && findAndDelete(cat.children)) {
          return true
        }
      }
      return false
    }

    if (!findAndDelete(data.categories)) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    await writeJSON(CATEGORIES_FILE, data)
    res.json({ message: 'Categoría eliminada' })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    res.status(500).json({ error: 'Error al eliminar categoría' })
  }
})

// POST /api/admin/upload - Subir foto(s)
app.post('/api/admin/upload', adminAuth, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' })
    }

    const { cat_id, steel_type, text } = req.body
    const data = await readJSON(PHOTOS_FILE)

    const newPhotos = req.files.map(file => ({
      id: uuidv4(),
      cat_id: cat_id || null,
      steel_type: sanitize(steel_type) || null,
      url: `/uploads/${file.filename}`,
      text: sanitize(text) || '',
      created_at: new Date().toISOString()
    }))

    data.photos.push(...newPhotos)
    await writeJSON(PHOTOS_FILE, data)

    res.status(201).json({ photos: newPhotos })
  } catch (error) {
    console.error('Error al subir fotos:', error)
    res.status(500).json({ error: 'Error al subir fotos' })
  }
})

// PUT /api/admin/photos/:id - Actualizar foto
app.put('/api/admin/photos/:id', adminAuth, async (req, res) => {
  try {
    const { text, cat_id, steel_type } = req.body
    const data = await readJSON(PHOTOS_FILE)

    const photo = data.photos.find(p => p.id === req.params.id)
    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' })
    }

    if (text !== undefined) photo.text = sanitize(text)
    if (cat_id !== undefined) photo.cat_id = cat_id
    if (steel_type !== undefined) photo.steel_type = sanitize(steel_type)
    photo.updated_at = new Date().toISOString()

    await writeJSON(PHOTOS_FILE, data)
    res.json(photo)
  } catch (error) {
    console.error('Error al actualizar foto:', error)
    res.status(500).json({ error: 'Error al actualizar foto' })
  }
})

// DELETE /api/admin/photos/:id - Eliminar foto
app.delete('/api/admin/photos/:id', adminAuth, async (req, res) => {
  try {
    const data = await readJSON(PHOTOS_FILE)
    const index = data.photos.findIndex(p => p.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: 'Foto no encontrada' })
    }

    const photo = data.photos[index]

    // Eliminar archivo físico
    try {
      const filename = path.basename(photo.url)
      await fs.unlink(path.join(UPLOADS_DIR, filename))
    } catch (err) {
      console.warn('No se pudo eliminar archivo físico:', err.message)
    }

    data.photos.splice(index, 1)
    await writeJSON(PHOTOS_FILE, data)

    res.json({ message: 'Foto eliminada' })
  } catch (error) {
    console.error('Error al eliminar foto:', error)
    res.status(500).json({ error: 'Error al eliminar foto' })
  }
})

// Error handler para multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Archivo demasiado grande. Máximo 5MB.' })
    }
    return res.status(400).json({ error: error.message })
  }
  if (error) {
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
  next()
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`FotoCRM Backend corriendo en puerto ${PORT}`)
})
