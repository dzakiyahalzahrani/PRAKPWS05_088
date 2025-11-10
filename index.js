// ===== Import Module =====
const express = require('express')
const path = require('path')
const crypto = require('crypto')
const mysql = require('mysql2') // pastikan sudah install: npm install mysql2
const app = express()
const port = 3000

// ===== Middleware =====
app.use(express.json()) // agar bisa baca body JSON dari Postman
app.use(express.urlencoded({ extended: true })) // dukung form-encoded juga
app.use(express.static(path.join(__dirname, 'public'))) // folder frontend

// ===== Koneksi ke database MySQL =====
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',           // ubah sesuai user MySQL kamu
  password: 'pafnadcasl',   // ubah sesuai password MySQL kamu
  database: 'apikey_db',  // ubah sesuai nama database kamu
  port: 3308
})

// ===== Tes koneksi =====
db.connect((err) => {
  if (err) {
    console.error('❌ Gagal konek ke database:', err.message)
  } else {
    console.log('✅ Terhubung ke database MySQL')
  }
})

// ===== ROUTES =====

// 🏠 Halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// 🪄 Endpoint untuk membuat dan menyimpan API key
app.post('/create', (req, res) => {
  const apiKey = crypto.randomBytes(16).toString('hex') // hasil 32 karakter hex

  saveKey(apiKey, (err) => {
    if (err) {
      console.error('❌ Gagal menyimpan API key:', err.message)
      return res.status(500).json({ error: 'Gagal menyimpan API key ke database' })
    }
    console.log(`✅ API key baru dibuat: ${apiKey}`)
    res.status(201).json({ message: '✅ API key berhasil dibuat', apiKey })
  })
})

// 🔑 Endpoint untuk memvalidasi API key (uji dengan Postman)
app.post('/valid', (req, res) => {
  const { apiKey } = req.body

  if (!apiKey) {
    return res.status(400).json({ error: 'API key wajib dikirim dalam body JSON' })
  }

  const sql = 'SELECT * FROM api_keys WHERE key_value = ?'
  db.query(sql, [apiKey], (err, results) => {
    if (err) {
      console.error('Error saat validasi:', err)
      return res.status(500).json({ error: 'Terjadi kesalahan pada server' })
    }

    if (results.length === 0) {
      return res.status(404).json({ valid: false, message: 'API key tidak ditemukan' })
    }

    res.json({
      valid: true,
      message: 'API key terdaftar dan valid',
      data: results[0]
    })
  })
})

// ===== Fungsi untuk menyimpan API key ke database =====
function saveKey(key, callback) {
  const sql = 'INSERT INTO api_keys (key_value, created_at) VALUES (?, NOW())'
  db.query(sql, [key], (err) => {
    if (err) return callback(err)
    callback(null)
  })
}

// ===== Jalankan server =====
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`)
})