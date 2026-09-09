# CashTrack Backend

> ⚠️ **PENTING: Proyek ini secara keseluruhan (termasuk README ini, seluruh kode sumber, file konfigurasi, dan dokumentasi) di-generate 100% oleh AI.** Manusia hanya berperan dalam memberikan arahan dan mengambil keputusan (*decision-making*), sedangkan seluruh penulisan kode, arsitektur, dan implementasi teknis dilakukan oleh AI. Harap tinjau dan verifikasi kembali sebelum digunakan di lingkungan produksi.

## Ringkasan

CashTrack Backend adalah API sisi server untuk aplikasi keuangan pribadi CashTrack. Dibangun dengan Express.js, TypeScript, dan Prisma (PostgreSQL), API ini menyediakan endpoint REST untuk mengelola dompet, transaksi, anggaran, tujuan tabungan, kategori, transaksi berulang, otentikasi, dan lampiran berkas.

## Teknologi

| Lapisan      | Teknologi                             |
|--------------|---------------------------------------|
| Runtime      | Node.js                               |
| Framework    | Express.js                            |
| Bahasa       | TypeScript                            |
| Basis Data   | PostgreSQL (melalui Prisma ORM)       |
| Otentikasi   | JWT + bcrypt                          |
| Validasi     | Zod                                   |
| Logging      | Morgan                                |
| Keamanan     | Helmet, CORS                          |

## Struktur Proyek

```
src/
├── app.ts              # Pengaturan aplikasi Express & middleware global
├── server.ts           # Titik masuk server HTTP
├── config.ts           # Pemuat konfigurasi
├── config/
│   └── env.ts          # Pemuat variabel lingkungan
├── constants/
│   └── messages.ts     # Konstanta pesan bersama
├── controllers/        # Penangan rute (satu per sumber daya)
├── services/           # Lapisan logika bisnis
├── repositories/       # Lapisan akses data (Prisma)
├── routes/             # Definisi rute API
│   └── index.ts        # Penggabung rute terpusat
├── middleware/         # Middleware Express (otentikasi, validasi, kesalahan)
├── prisma/
│   └── client.ts       # Instans klien Prisma
└── validators/         # Skema Zod (satu per sumber daya)
```

## Prasyarat

- Node.js >= 22
- PostgreSQL
- npm

## Pengaturan

```bash
# Klon & pasang dependensi
git clone <repo-url>
cd cashtrack-backend
npm install

# Konfigurasi lingkungan
cp .env.example .env
# Edit .env dengan kredensial PostgreSQL dan rahasia JWT Anda

# Jalankan migrasi basis data
npm run prisma:migrate

# Hasilkan klien Prisma
npm run prisma:generate

# Jalankan server pengembangan
npm run dev

# Bangun untuk produksi
npm run build
npm start
```

## Endpoint API (Ringkasan)

| Sumber Daya         | Rute                                  |
|---------------------|---------------------------------------|
| Otentikasi          | `/api/v1/auth/*`                      |
| Dompet              | `/api/v1/wallets/*`                   |
| Transaksi           | `/api/v1/transactions/*`              |
| Kategori            | `/api/v1/categories/*`                |
| Anggaran            | `/api/v1/budgets/*`                   |
| Tujuan Tabungan     | `/api/v1/savings-goals/*`             |
| Transaksi Berulang  | `/api/v1/recurring-transactions/*`    |
| Dasbor              | `/api/v1/dashboard/*`                 |
| Lampiran            | `/api/v1/attachments/*`               |

Otentikasi dilakukan melalui token JWT Bearer. Sertakan header `Authorization: Bearer <token>` untuk rute yang dilindungi.

## Variabel Lingkungan

```
DATABASE_URL=koneksi_postgresql_anda
JWT_SECRET=kunci_rahasia_anda
JWT_EXPIRES_IN=1d
PORT=3000
BCRYPT_ROUNDS=12
```

## Lisensi

Proyek pribadi. Semua hak dilindungi.
