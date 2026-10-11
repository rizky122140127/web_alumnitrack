<?php

namespace Tests\Feature;

use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_another_admin_account(): void
    {
        $admin = User::create([
            'name' => 'Admin Utama',
            'phone_number' => '6281234500200',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin-users', [
            'name' => 'Admin Baru',
            'email' => 'admin.baru@example.test',
            'phone_number' => '6281234500201',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertCreated()
            ->assertJsonPath('admin.name', 'Admin Baru')
            ->assertJsonPath('admin.role', 'admin');

        $this->postJson('/api/auth/login', [
            'login' => '6281234500201',
            'password' => 'passwordbaru123',
        ])->assertOk()
            ->assertJsonPath('user.role', 'admin');

        $this->assertDatabaseHas('users', [
            'email' => 'admin.baru@example.test',
            'phone_number' => '6281234500201',
            'role' => 'admin',
            'alumni_approval_status' => 'approved',
        ]);
    }

    public function test_only_admin_can_create_admin_accounts(): void
    {
        $this->postJson('/api/admin-users', [
            'name' => 'Tidak Sah',
            'phone_number' => '6281234500202',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertUnauthorized();

        $alumni = User::create([
            'name' => 'Alumni',
            'phone_number' => '6281234500203',
            'password' => 'password123',
            'role' => 'alumni',
        ]);
        Sanctum::actingAs($alumni);

        $this->postJson('/api/admin-users', [
            'name' => 'Tidak Sah',
            'phone_number' => '6281234500204',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertForbidden();
    }

    public function test_admin_can_view_and_edit_alumni_profile_and_contact_data(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281234500210',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        $alumni = User::create([
            'name' => 'Alumni Lama',
            'email' => 'alumni@example.test',
            'phone_number' => '6281234500211',
            'nisn' => '0012345211',
            'password' => 'password123',
            'role' => 'alumni',
        ]);
        AlumniProfile::create([
            'user_id' => $alumni->id,
            'graduation_year' => 2022,
            'current_status' => 'mahasiswa',
            'campus_name' => 'Universitas Lama',
            'major_name' => 'Pendidikan',
        ]);

        Sanctum::actingAs($admin);
        $this->getJson("/api/alumni/{$alumni->id}")
            ->assertOk()
            ->assertJsonPath('user.nisn', '0012345211')
            ->assertJsonPath('user.alumni_profile.campus_name', 'Universitas Lama');

        $this->putJson("/api/alumni/{$alumni->id}", [
            'name' => 'Alumni Diperbarui',
            'email' => 'alumni.baru@example.test',
            'phone_number' => '6281234500299',
            'is_wa_active' => false,
            'nisn' => '0012345299',
            'graduation_year' => 2023,
            'current_status' => 'bekerja',
            'campus_name' => null,
            'major_name' => null,
            'company_name' => 'Sekolah Mitra',
            'job_title' => 'Analis',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Alumni Diperbarui')
            ->assertJsonPath('user.alumni_profile.current_status', 'bekerja')
            ->assertJsonPath('user.alumni_profile.company_name', 'Sekolah Mitra');

        $this->assertDatabaseHas('users', [
            'id' => $alumni->id,
            'phone_number' => '6281234500299',
            'nisn' => '0012345299',
            'is_wa_active' => false,
        ]);
        $this->assertDatabaseHas('alumni_profiles', [
            'user_id' => $alumni->id,
            'graduation_year' => 2023,
            'job_title' => 'Analis',
        ]);
    }
}
