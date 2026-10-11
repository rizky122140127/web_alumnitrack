<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->frontendRedirect('/auth/login', [
                'google_error' => 'Login Google belum dikonfigurasi. Hubungi pengelola sekolah.',
            ]);
        }

        $intent = $request->query('intent') === 'admin' ? 'admin' : null;
        $request->session()->put('google_auth_intent', $intent);

        return Socialite::driver('google')
            ->scopes(['openid', 'email', 'profile'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $intent = $request->session()->pull('google_auth_intent');
        $returnPath = $intent === 'admin' ? '/auth/admin' : '/auth/login';

        if (! $this->isConfigured()) {
            return $this->frontendRedirect($returnPath, [
                'google_error' => 'Login Google belum dikonfigurasi. Hubungi pengelola sekolah.',
            ]);
        }

        if ($request->filled('error')) {
            return $this->frontendRedirect($returnPath, [
                'google_error' => 'Proses masuk Google dibatalkan.',
            ]);
        }

        $googleUser = Socialite::driver('google')->user();
        $email = $googleUser->getEmail();
        $googleId = $googleUser->getId();
        $emailVerified = filter_var(
            $googleUser->getRaw()['email_verified'] ?? false,
            FILTER_VALIDATE_BOOLEAN,
        );

        if (! $email || ! $googleId || ! $emailVerified) {
            return $this->frontendRedirect($returnPath, [
                'google_error' => 'Google tidak memberikan email terverifikasi. Periksa izin akun lalu coba lagi.',
            ]);
        }

        $user = User::where('google_id', $googleId)
            ->orWhere('email', $email)
            ->first();

        if ($user) {
            if ($intent === 'admin' && $user->role !== 'admin') {
                return $this->frontendRedirect($returnPath, [
                    'google_error' => 'Akun Google ini tidak memiliki hak akses admin.',
                ]);
            }

            if ($user->google_id && $user->google_id !== $googleId) {
                return $this->frontendRedirect($returnPath, [
                    'google_error' => 'Email ini sudah terhubung dengan akun Google lain.',
                ]);
            }

            if ($user->role === 'alumni' && $user->alumni_approval_status !== 'approved') {
                return $this->frontendRedirect($returnPath, [
                    'google_error' => $user->alumni_approval_status === 'rejected'
                        ? 'Pendaftaran alumni Anda ditolak. Silakan hubungi admin.'
                        : 'Pendaftaran alumni Anda masih menunggu verifikasi admin.',
                ]);
            }

            $user->forceFill([
                'google_id' => $googleId,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            $code = $this->storeAuthCode([
                'type' => 'login',
                'user_id' => $user->id,
                'expected_role' => $intent,
            ]);

            return $this->frontendRedirect('/auth/google/callback', ['code' => $code]);
        }

        if ($intent === 'admin') {
            return $this->frontendRedirect($returnPath, [
                'google_error' => 'Akun Google ini belum terdaftar sebagai admin. Hubungi pengelola sekolah.',
            ]);
        }

        $code = $this->storeAuthCode([
            'type' => 'register',
            'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Alumni',
            'email' => $email,
            'google_id' => $googleId,
        ]);

        return $this->frontendRedirect('/auth/register', [
            'google_code' => $code,
            'name' => $googleUser->getName() ?: '',
            'email' => $email,
        ]);
    }

    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|size:64',
        ]);

        $authData = Cache::pull($this->cacheKey($validated['code']));

        if (! is_array($authData) || ($authData['type'] ?? null) !== 'login') {
            return response()->json([
                'message' => 'Kode autentikasi Google tidak valid atau sudah kedaluwarsa.',
            ], 422);
        }

        $user = User::with('alumniProfile')->find($authData['user_id'] ?? 0);
        if (
            ! $user
            || ! in_array($user->role, ['admin', 'alumni'], true)
            || ($user->role === 'alumni' && $user->alumni_approval_status !== 'approved')
        ) {
            return response()->json([
                'message' => 'Akun belum dapat digunakan. Hubungi admin untuk bantuan.',
            ], 403);
        }

        if (($authData['expected_role'] ?? null) === 'admin' && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Akun Google ini tidak memiliki hak akses admin.',
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('google-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login dengan Google berhasil.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|size:64',
            'phone_number' => 'required|string|max:30|unique:users,phone_number',
            'nisn' => 'required|string|size:10|unique:users,nisn',
            'graduation_year' => 'required|integer|min:2000|max:2099',
            'current_status' => ['sometimes', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
        ]);

        $identity = Cache::pull($this->cacheKey($validated['code']));
        if (! is_array($identity) || ($identity['type'] ?? null) !== 'register') {
            return response()->json([
                'message' => 'Sesi pendaftaran Google tidak valid atau sudah kedaluwarsa. Silakan mulai kembali.',
            ], 422);
        }

        if (User::where('email', $identity['email'])->orWhere('google_id', $identity['google_id'])->exists()) {
            return response()->json([
                'message' => 'Email Google ini sudah terdaftar. Silakan masuk menggunakan Google.',
            ], 409);
        }

        $user = DB::transaction(function () use ($validated, $identity) {
            $user = User::create([
                'name' => $identity['name'],
                'email' => $identity['email'],
                'google_id' => $identity['google_id'],
                'email_verified_at' => now(),
                'phone_number' => $validated['phone_number'],
                'nisn' => $validated['nisn'],
                'password' => Hash::make(Str::random(64)),
                'role' => 'alumni',
                'alumni_approval_status' => 'pending',
            ]);

            AlumniProfile::create([
                'user_id' => $user->id,
                'graduation_year' => $validated['graduation_year'],
                'current_status' => $validated['current_status'] ?? 'belum_kerja',
            ]);

            return $user->load('alumniProfile');
        });

        return response()->json([
            'message' => 'Pendaftaran berhasil dikirim dan menunggu verifikasi admin.',
            'user' => $user,
            'approval_status' => 'pending',
        ], 201);
    }

    private function storeAuthCode(array $data): string
    {
        $code = Str::random(64);
        Cache::put($this->cacheKey($code), $data, now()->addMinutes(10));

        return $code;
    }

    private function cacheKey(string $code): string
    {
        return 'google-auth:'.hash('sha256', $code);
    }

    private function frontendRedirect(string $path, array $query): RedirectResponse
    {
        $url = rtrim(config('app.frontend_url'), '/').$path;

        return redirect()->away($url.'?'.http_build_query($query));
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }
}
