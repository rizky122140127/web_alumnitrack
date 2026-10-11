<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the administrator account for SMAN 1 Talang Padang.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['phone_number' => '6281234567890'],
            [
                'name'         => 'Admin SMAN 1 Talang Padang',
                'email'        => 'admin@sman1talangpadang.sch.id',
                'phone_number' => '6281234567890',
                'password'     => Hash::make('admin123'),
                'role'         => 'admin',
                'is_wa_active' => true,
            ]
        );
    }
}
