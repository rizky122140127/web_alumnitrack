<?php

namespace Database\Seeders;

use App\Models\TracerQuestion;
use Illuminate\Database\Seeder;

class TracerQuestionSeeder extends Seeder
{
    /**
     * Seed sample tracer study questions for SMAN 1 Talang Padang.
     */
    public function run(): void
    {
        $questions = [
            [
                'question_text' => 'Apa status Anda saat ini setelah lulus dari SMAN 1 Talang Padang?',
                'question_type' => 'radio',
                'options'       => ['Kuliah/Mahasiswa', 'Bekerja', 'Wirausaha', 'Gap Year', 'Belum Bekerja'],
                'is_required'   => true,
                'order_number'  => 1,
            ],
            [
                'question_text' => 'Jika melanjutkan kuliah, di perguruan tinggi mana Anda terdaftar?',
                'question_type' => 'text',
                'options'       => null,
                'is_required'   => false,
                'order_number'  => 2,
            ],
            [
                'question_text' => 'Jurusan/Program Studi apa yang Anda ambil?',
                'question_type' => 'text',
                'options'       => null,
                'is_required'   => false,
                'order_number'  => 3,
            ],
            [
                'question_text' => 'Jika bekerja, di perusahaan/instansi mana Anda bekerja saat ini?',
                'question_type' => 'text',
                'options'       => null,
                'is_required'   => false,
                'order_number'  => 4,
            ],
            [
                'question_text' => 'Seberapa relevan pendidikan di SMAN 1 Talang Padang dengan aktivitas Anda saat ini?',
                'question_type' => 'scale',
                'options'       => ['1', '2', '3', '4', '5'],
                'is_required'   => true,
                'order_number'  => 5,
            ],
            [
                'question_text' => 'Kompetensi apa yang paling bermanfaat dari masa sekolah?',
                'question_type' => 'checkbox',
                'options'       => [
                    'Kemampuan Akademik',
                    'Soft Skill (Komunikasi, Kepemimpinan)',
                    'Keterampilan Teknologi/IT',
                    'Karakter & Kedisiplinan',
                    'Ekstrakurikuler',
                ],
                'is_required'   => true,
                'order_number'  => 6,
            ],
            [
                'question_text' => 'Berapa lama waktu yang Anda butuhkan untuk mendapatkan pekerjaan/kuliah setelah lulus?',
                'question_type' => 'radio',
                'options'       => [
                    'Kurang dari 3 bulan',
                    '3-6 bulan',
                    '6-12 bulan',
                    'Lebih dari 1 tahun',
                    'Belum mendapatkan',
                ],
                'is_required'   => true,
                'order_number'  => 7,
            ],
            [
                'question_text' => 'Berapa kisaran penghasilan Anda per bulan saat ini? (jika bekerja)',
                'question_type' => 'radio',
                'options'       => [
                    'Belum berpenghasilan',
                    'Di bawah Rp 2.000.000',
                    'Rp 2.000.000 - Rp 5.000.000',
                    'Rp 5.000.000 - Rp 10.000.000',
                    'Di atas Rp 10.000.000',
                ],
                'is_required'   => false,
                'order_number'  => 8,
            ],
            [
                'question_text' => 'Saran dan masukan Anda untuk peningkatan kualitas SMAN 1 Talang Padang:',
                'question_type' => 'text',
                'options'       => null,
                'is_required'   => false,
                'order_number'  => 9,
            ],
            [
                'question_text' => 'Seberapa puas Anda dengan pendidikan yang diterima di SMAN 1 Talang Padang?',
                'question_type' => 'scale',
                'options'       => ['1', '2', '3', '4', '5'],
                'is_required'   => true,
                'order_number'  => 10,
            ],
        ];

        foreach ($questions as $q) {
            TracerQuestion::updateOrCreate(
                ['order_number' => $q['order_number']],
                $q
            );
        }
    }
}
