<?php

namespace Database\Seeders;

use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AlumniSeeder extends Seeder
{
    /**
     * Seed sample alumni data for SMAN 1 Talang Padang.
     */
    public function run(): void
    {
        $alumniData = [
            [
                'name'            => 'Ahmad Fauzi',
                'phone_number'    => '6281200000001',
                'graduation_year' => 2022,
                'nisn'            => '0012345001',
                'current_status'  => 'mahasiswa',
                'campus_name'     => 'Universitas Lampung',
                'major_name'      => 'Teknik Informatika',
            ],
            [
                'name'            => 'Siti Nurhaliza',
                'phone_number'    => '6281200000002',
                'graduation_year' => 2022,
                'nisn'            => '0012345002',
                'current_status'  => 'bekerja',
                'company_name'    => 'PT Telkom Indonesia',
                'job_title'       => 'Customer Service',
            ],
            [
                'name'            => 'Budi Santoso',
                'phone_number'    => '6281200000003',
                'graduation_year' => 2023,
                'nisn'            => '0012345003',
                'current_status'  => 'gap_year',
            ],
            [
                'name'            => 'Dewi Lestari',
                'phone_number'    => '6281200000004',
                'graduation_year' => 2023,
                'nisn'            => '0012345004',
                'current_status'  => 'mahasiswa',
                'campus_name'     => 'Institut Teknologi Sumatera',
                'major_name'      => 'Teknik Elektro',
            ],
            [
                'name'            => 'Rizky Pratama',
                'phone_number'    => '6281200000005',
                'graduation_year' => 2021,
                'nisn'            => '0012345005',
                'current_status'  => 'wirausaha',
                'company_name'    => 'Pratama Digital',
                'job_title'       => 'Founder & CEO',
            ],
            [
                'name'            => 'Anisa Rahma',
                'phone_number'    => '6281200000006',
                'graduation_year' => 2023,
                'nisn'            => '0012345006',
                'current_status'  => 'belum_kerja',
            ],
            [
                'name'            => 'Fajar Hidayat',
                'phone_number'    => '6281200000007',
                'graduation_year' => 2021,
                'nisn'            => '0012345007',
                'current_status'  => 'bekerja',
                'company_name'    => 'Bank BRI',
                'job_title'       => 'Teller',
            ],
            [
                'name'            => 'Putri Amelia',
                'phone_number'    => '6281200000008',
                'graduation_year' => 2022,
                'nisn'            => '0012345008',
                'current_status'  => 'mahasiswa',
                'campus_name'     => 'Universitas Indonesia',
                'major_name'      => 'Kedokteran',
            ],
            [
                'name'            => 'Dimas Prasetyo',
                'phone_number'    => '6281200000009',
                'graduation_year' => 2024,
                'nisn'            => '0012345009',
                'current_status'  => 'belum_kerja',
            ],
            [
                'name'            => 'Rina Wulandari',
                'phone_number'    => '6281200000010',
                'graduation_year' => 2024,
                'nisn'            => '0012345010',
                'current_status'  => 'mahasiswa',
                'campus_name'     => 'Universitas Gadjah Mada',
                'major_name'      => 'Hukum',
            ],
        ];

        foreach ($alumniData as $data) {
            $user = User::updateOrCreate(
                ['phone_number' => $data['phone_number']],
                [
                    'name'         => $data['name'],
                    'phone_number' => $data['phone_number'],
                    'password'     => Hash::make('alumni123'),
                    'role'         => 'alumni',
                    'is_wa_active' => true,
                ]
            );

            AlumniProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nisn'            => $data['nisn'],
                    'graduation_year' => $data['graduation_year'],
                    'current_status'  => $data['current_status'],
                    'campus_name'     => $data['campus_name'] ?? null,
                    'major_name'      => $data['major_name'] ?? null,
                    'company_name'    => $data['company_name'] ?? null,
                    'job_title'       => $data['job_title'] ?? null,
                ]
            );
        }
    }
}
