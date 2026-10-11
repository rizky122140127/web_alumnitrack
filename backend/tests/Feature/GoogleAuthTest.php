<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_login_code_issues_a_single_use_api_token(): void
    {
        $user = User::create([
            'name' => 'Google Alumni',
            'email' => 'google@example.test',
            'google_id' => 'google-user-100',
            'phone_number' => '6281234500100',
            'nisn' => '0012345100',
            'password' => 'password123',
            'role' => 'alumni',
            'alumni_approval_status' => 'approved',
        ]);
        $code = str_repeat('a', 64);
        Cache::put('google-auth:'.hash('sha256', $code), [
            'type' => 'login',
            'user_id' => $user->id,
        ], now()->addMinutes(10));

        $this->postJson('/api/auth/google/exchange', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token', 'user']);

        $this->postJson('/api/auth/google/exchange', ['code' => $code])
            ->assertUnprocessable();

        $adminOnlyCode = str_repeat('b', 64);
        Cache::put('google-auth:'.hash('sha256', $adminOnlyCode), [
            'type' => 'login',
            'user_id' => $user->id,
            'expected_role' => 'admin',
        ], now()->addMinutes(10));

        $this->postJson('/api/auth/google/exchange', ['code' => $adminOnlyCode])
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun Google ini tidak memiliki hak akses admin.');
    }

    public function test_google_callback_completes_login_and_exchanges_code_for_api_token(): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-client-secret',
            'services.google.redirect' => 'http://localhost/auth/google/callback',
            'app.frontend_url' => 'http://localhost:5173',
        ]);

        $user = User::create([
            'name' => 'Google Alumni',
            'email' => 'google.login@example.test',
            'phone_number' => '6281234500104',
            'nisn' => '0012345104',
            'password' => 'password123',
            'role' => 'alumni',
            'google_id' => 'google-login-user',
            'alumni_approval_status' => 'approved',
        ]);

        $provider = \Mockery::mock(Provider::class);
        $googleUser = \Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getEmail')->andReturn('google.login@example.test');
        $googleUser->shouldReceive('getId')->andReturn('google-login-user');
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $callback = $this->withSession(['google_auth_intent' => null])
            ->get('/auth/google/callback');
        $callback->assertRedirect();
        parse_str((string) parse_url($callback->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertArrayHasKey('code', $query);

        $this->postJson('/api/auth/google/exchange', ['code' => $query['code']])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_google_redirect_reports_missing_oauth_credentials(): void
    {
        config([
            'services.google.client_id' => null,
            'services.google.client_secret' => null,
        ]);

        $this->get('/auth/google/redirect')
            ->assertRedirectContains('google_error=Login+Google+belum+dikonfigurasi');
    }

    public function test_legacy_student_cannot_exchange_a_google_login_code(): void
    {
        $user = User::create([
            'name' => 'Siswa Lama',
            'email' => 'student@example.test',
            'google_id' => 'google-student-100',
            'phone_number' => '6281234500103',
            'nisn' => '0012345103',
            'password' => 'password123',
            'role' => 'siswa',
        ]);
        $code = str_repeat('c', 64);
        Cache::put('google-auth:'.hash('sha256', $code), [
            'type' => 'login',
            'user_id' => $user->id,
        ], now()->addMinutes(10));

        $this->postJson('/api/auth/google/exchange', ['code' => $code])
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun belum dapat digunakan. Hubungi admin untuk bantuan.');
    }

    public function test_google_registration_completes_school_data_and_waits_for_approval(): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-client-secret',
            'services.google.redirect' => 'http://localhost/auth/google/callback',
        ]);

        $provider = \Mockery::mock(Provider::class);
        $googleUser = \Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getEmail')->andReturn('new.google@example.test');
        $googleUser->shouldReceive('getId')->andReturn('google-new-user');
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $googleUser->shouldReceive('getName')->andReturn('Alumni Baru');
        $googleUser->shouldReceive('getNickname')->andReturn(null);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $callback = $this->get('/auth/google/callback');
        $callback->assertRedirect();
        parse_str((string) parse_url($callback->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->postJson('/api/auth/google/register', [
            'code' => $query['google_code'],
            'phone_number' => '6281234500101',
            'nisn' => '0012345101',
            'graduation_year' => 2024,
            'current_status' => 'mahasiswa',
        ])->assertCreated()
            ->assertJsonPath('approval_status', 'pending')
            ->assertJsonPath('user.name', 'Alumni Baru')
            ->assertJsonPath('user.email', 'new.google@example.test');

        $this->assertDatabaseHas('users', [
            'email' => 'new.google@example.test',
            'google_id' => 'google-new-user',
            'nisn' => '0012345101',
            'alumni_approval_status' => 'pending',
        ]);
        $this->assertDatabaseHas('alumni_profiles', [
            'graduation_year' => 2024,
        ]);
    }

    public function test_google_login_redirects_existing_account_and_rejects_pending_alumni(): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-client-secret',
            'services.google.redirect' => 'http://localhost/auth/google/callback',
        ]);

        $user = User::create([
            'name' => 'Pending Google Alumni',
            'email' => 'pending.google@example.test',
            'google_id' => 'google-pending-user',
            'phone_number' => '6281234500102',
            'nisn' => '0012345102',
            'password' => 'password123',
            'role' => 'alumni',
            'alumni_approval_status' => 'pending',
        ]);

        $provider = \Mockery::mock(Provider::class);
        $googleUser = \Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getEmail')->andReturn('pending.google@example.test');
        $googleUser->shouldReceive('getId')->andReturn('google-pending-user');
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $this->get('/auth/google/callback')
            ->assertRedirectContains('google_error=Pendaftaran+alumni+Anda+masih+menunggu+verifikasi+admin');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'alumni_approval_status' => 'pending',
        ]);
    }
}
