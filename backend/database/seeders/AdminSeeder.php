<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the Admin Guru BK account for SMAN 1 Talang Padang.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['phone_number' => '6281234567890'],
            [
                'name'         => 'Guru BK SMAN 1 Talang Padang',
                'email'        => 'gurubk@sman1talangpadang.sch.id',
                'phone_number' => '6281234567890',
                'password'     => Hash::make('admin123'),
                'role'         => 'admin',
                'is_wa_active' => true,
            ]
        );
    }
}
