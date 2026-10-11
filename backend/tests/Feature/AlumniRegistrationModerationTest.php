<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AlumniRegistrationModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_alumni_registration_requires_approval_before_login(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Calon Alumni',
            'phone_number' => '6281234500001',
            'email' => 'calon@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nisn' => '0012345001',
            'graduation_year' => 2025,
            'current_status' => 'mahasiswa',
        ])->assertCreated()
            ->assertJsonPath('approval_status', 'pending')
            ->assertJsonPath('token', null)
            ->assertJsonPath('user.alumni_approval_status', 'pending');

        $this->postJson('/api/auth/login', [
            'nisn' => '0012345001',
            'password' => 'password123',
        ])->assertForbidden()
            ->assertJsonPath('approval_status', 'pending');

        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281234500099',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/alumni-registrations')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Calon Alumni');

        $alumni = User::where('phone_number', '6281234500001')->firstOrFail();
        $this->patchJson("/api/alumni-registrations/{$alumni->id}", [
            'status' => 'approved',
        ])->assertOk()
            ->assertJsonPath('user.alumni_approval_status', 'approved');

        auth()->forgetGuards();
        $this->postJson('/api/auth/login', [
            'nisn' => '0012345001',
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('user.alumni_approval_status', 'approved');
    }

    public function test_rejected_alumni_cannot_login_with_nisn_and_password(): void
    {
        $alumni = User::create([
            'name' => 'Pendaftar Ditolak',
            'phone_number' => '6281234500002',
            'nisn' => '0012345002',
            'password' => 'password123',
            'role' => 'alumni',
            'alumni_approval_status' => 'rejected',
        ]);

        $this->postJson('/api/auth/login', [
            'nisn' => '0012345002',
            'password' => 'password123',
        ])->assertForbidden()
            ->assertJsonPath('approval_status', 'rejected');
    }

    public function test_registration_rejects_student_role_and_legacy_students_cannot_access_the_portal(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Siswa Kelas 12',
            'phone_number' => '6281234500004',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'siswa',
            'nisn' => '0012345004',
            'graduation_year' => 2027,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $student = User::create([
            'name' => 'Siswa Lama',
            'phone_number' => '6281234500005',
            'nisn' => '0012345005',
            'password' => 'password123',
            'role' => 'siswa',
        ]);

        $this->postJson('/api/auth/login', [
            'nisn' => '0012345005',
            'password' => 'password123',
        ])->assertUnauthorized();

        Sanctum::actingAs($student);
        $this->getJson('/api/profile')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun ini tidak memiliki akses ke portal.');
    }

    public function test_approval_queue_is_admin_only_and_existing_alumni_remain_approved(): void
    {
        $alumni = User::create([
            'name' => 'Alumni Lama',
            'phone_number' => '6281234500003',
            'nisn' => '0012345003',
            'password' => 'password123',
            'role' => 'alumni',
        ]);
        $this->assertSame('approved', $alumni->fresh()->alumni_approval_status);

        Sanctum::actingAs($alumni);
        $this->getJson('/api/alumni-registrations')->assertForbidden();
        $this->patchJson("/api/alumni-registrations/{$alumni->id}", [
            'status' => 'approved',
        ])->assertForbidden();
    }
}
