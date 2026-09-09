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
├── app.ts                        # Pengaturan aplikasi Express & middleware global
├── server.ts                     # Titik masuk server HTTP
├── config.ts                     # Pemuat konfigurasi
├── config/
│   └── env.ts                    # Pemuat variabel lingkungan
├── constants/
│   └── messages.ts               # Konstanta pesan bersama
├── controllers/                  # Penangan rute (satu per sumber daya)
├── services/                     # Lapisan logika bisnis
├── repositories/                 # Lapisan akses data (Prisma)
├── routes/                       # Definisi rute API
│   └── index.ts                  # Penggabung rute terpusat
├── middleware/                   # Middleware Express (otentikasi, validasi, kesalahan)
├── prisma/
│   └── client.ts                 # Instans klien Prisma
├── types/                        # Tipe TypeScript khusus aplikasi
├── utils/                        # Utilitas (serializer, response, password, jwt, errors)
└── validators/                   # Skema Zod (satu per sumber daya)
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

# Jalankan pengujian
npm test
```

## Endpoint API (Ringkasan)

| Sumber Daya                | Rute                                  |
|----------------------------|---------------------------------------|
| Otentikasi                 | `/api/v1/auth/*`                      |
| Dasbor                     | `/api/v1/dashboard/*`                 |
| Dompet                     | `/api/v1/wallets/*`                   |
| Kategori                   | `/api/v1/categories/*`                |
| Transaksi                  | `/api/v1/transactions/*`              |
| Anggaran                   | `/api/v1/budgets/*`                   |
| Tujuan Tabungan            | `/api/v1/savings-goals/*`             |
| Kontribusi Tabungan        | `/api/v1/savings-contributions/*`     |
| Transaksi Berulang         | `/api/v1/recurring-transactions/*`    |
| Lampiran                   | `/api/v1/attachments/*`               |

Otentikasi dilakukan melalui token JWT Bearer. Sertakan header `Authorization: Bearer <token>` untuk rute yang dilindungi.

## Variabel Lingkungan

```
DATABASE_URL=koneksi_postgresql_anda
JWT_ACCESS_SECRET=kunci_rahasia_access_anda
JWT_REFRESH_SECRET=kunci_rahasia_refresh_anda
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
PORT=3000
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## Catatan

- Proyek ini menggunakan `bigint` untuk primary key dan `publicId` (berbasis cuid) untuk identitas publik.
- Semua nilai uang (balance, amount, targetAmount, currentAmount) menggunakan `Prisma.Decimal` untuk menghindari masalah presisi floating-point.
- Operasi finansial (INCOME, EXPENSE, TRANSFER, Savings Contribution) dilakukan secara atomic menggunakan `prisma.$transaction()`.
- Semua resource diverifikasi ownership-nya terhadap user yang terautentikasi untuk mencegah masalah IDOR.

## Changelog

### [v0.1.1] - 2026-09-09

#### Ditambahkan

- **SavingsContribution** lengkap: repository, service, controller, validator, dan route baru di `/api/v1/savings-contributions/*`.
  - Operasi atomic: mengurangi wallet balance dan menambah `SavingsGoal.currentAmount` dalam satu transaksi.
  - Pencapaian otomatis (`isAchieved`) ketika `currentAmount >= targetAmount`.
  - Rollback pada delete: mengembalikan wallet balance dan mengurangi `currentAmount`.
- **Transfer Transaction** (`TRANSFER`) yang lengkap:
  - Atomic transfer antar wallet: mengurangi saldo dompet sumber dan menambah saldo dompet tujuan.
  - Validasi kepemilikan kedua dompet oleh user yang sama.
  - Validasi source != destination.
  - Validasi cukup balance.
  - Restore balance pada delete/update.
- **Migration baru**: `20260909103934_fix_schema_relations` untuk menambahkan kolom `destinationWalletId` pada `Transaction` dan tabel `SavingsContribution`.
- **Index database baru**: pada `destinationWalletId`, `nextRunDate`, `isActive`, `savingsGoalId`, `walletId` (savings contribution).
- **Validasi TRANSFER**: cross-field validation di Zod schema (wajib `destinationWalletPublicId`, tidak boleh sama dengan `walletPublicId`).
- **Validasi kategori tipe**: INCOME transaction hanya boleh memakai kategori bertipe INCOME, EXPENSE hanya boleh kategori bertipe EXPENSE.
- **Repository `findDueByUserId`** baru untuk scheduler yang aman.

#### Diperbaiki

- **Security / IDOR**: Memperbaiki 6 repository (`category`, `budget`, `savings-goal`, `recurring-transaction`, `transaction`, `attachment`) agar memvalidasi kepemilikan user pada operasi `update`/`delete`. Sebelumnya hanya memakai `publicId` tanpa `userId`, berisiko user mengubah resource orang lain.
- **Transaction delete ownership**: Repository `transaction.repository.ts` `delete` sekarang memvalidasi owner dan mengembalikan `destinationWalletId` untuk restore balance transfer.
- **Precision Decimal**: Service `savings-goal.service.ts` `addProgress` yang menggunakan `Number()` dan kehilangan presisi desimal diganti dengan `Prisma.Decimal.add()`.
- **Dashboard message**: Controller `dashboard.controller.ts` yang salah menggunakan `ApiSuccess.UPDATED` diganti dengan pesan "Success".
- **Recurring repository update ownership**: Repository `recurring-transaction.repository.ts` `update` sekarang memvalidasi kepemilikan.
- **Repository `attachment` update ownership**: Ditambahkan metode `update` yang memvalidasi kepemilikan.

#### Teknis

- `tsconfig.json`: ditambahkan `types: ["vitest/globals", "node"]` untuk mendukung test runner global API.
- `package.json`: ditambahkan script `test` (`vitest run`) dan `test:watch` (`vitest`), beserta dev dependencies `vitest`, `supertest`, `@types/supertest`, `reflect-metadata`.
- `vitest.config.ts`: file konfigurasi baru untuk Vitest.
- `src/tests/setup.ts`: setup Vitest dengan truncate database untuk isolasi test.
- `src/tests/helpers.ts`: helper untuk registrasi/login dan pembuatan user test.
- `src/tests/auth-wallet-transaction.test.ts`: suite test integrasi mencakup register, login, wallet, income, expense, transfer (termasuk transfer gagal), category type validation, savings goal, savings contribution (atomic, auto-achieve), budget, otorisasi, dan pencegahan IDOR.

### [v0.1.0] - Release Awal

- Fitur lengkap: auth, wallet, category, transaction (INCOME/EXPENSE), budget, savings goal, recurring transaction, attachment, dashboard.
- Prisma ORM dengan migrasi database inisial.
- JWT + bcrypt otentikasi.
- Validasi Zod terpusedi.
- Dokumentasi README.

## Lisensi

Proyek pribadi. Semua hak dilindungi.
