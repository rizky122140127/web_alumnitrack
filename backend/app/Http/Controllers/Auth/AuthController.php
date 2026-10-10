<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\MagicLink;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'nullable|email|unique:users,email',
            'phone_number'    => 'required|string|unique:users,phone_number',
            'password'        => 'required|string|min:6|confirmed',
            'role'            => ['sometimes', Rule::in(['alumni', 'siswa'])],
            // Alumni profile fields (optional on register)
            'nisn'            => 'required_if:role,alumni|string|size:10|unique:alumni_profiles,nisn',
            'graduation_year' => 'required_if:role,alumni|integer|min:2000|max:2099',
            'current_status'  => ['sometimes', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
        ]);

        $user = User::create([
            'name'         => $validated['name'],
            'email'        => $validated['email'] ?? null,
            'phone_number' => $validated['phone_number'],
            'password'     => Hash::make($validated['password']),
            'role'         => $validated['role'] ?? 'alumni',
        ]);

        // Create alumni profile if registering as alumni
        if ($user->role === 'alumni' && isset($validated['nisn'])) {
            AlumniProfile::create([
                'user_id'         => $user->id,
                'nisn'            => $validated['nisn'],
                'graduation_year' => $validated['graduation_year'],
                'current_status'  => $validated['current_status'] ?? 'belum_kerja',
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'user'    => $user->load('alumniProfile'),
            'token'   => $token,
        ], 201);
    }

    /**
     * Login with email/phone + password (conventional).
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login'    => 'required|string', // accepts email or phone_number
            'password' => 'required|string',
        ]);

        // Try finding by email first, then by phone number
        $user = User::where('email', $validated['login'])
            ->orWhere('phone_number', $validated['login'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Kredensial tidak valid.',
            ], 401);
        }

        // Revoke previous tokens
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user'    => $user->load('alumniProfile'),
            'token'   => $token,
        ]);
    }

    /**
     * Generate a magic link for a specific user (Admin only).
     */
    public function generateMagicLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $token = Str::random(64);

        $magicLink = MagicLink::create([
            'user_id'    => $validated['user_id'],
            'token'      => $token,
            'expires_at' => now()->addHours(24),
            'is_used'    => false,
        ]);

        // In production, this would be sent via WA Gateway
        $linkUrl = config('app.frontend_url', 'http://localhost:5173')
            . '/auth/magic-link?token=' . $token;

        return response()->json([
            'message'    => 'Magic link berhasil dibuat.',
            'magic_link' => $linkUrl,
            'token'      => $token,
            'expires_at' => $magicLink->expires_at->toIso8601String(),
        ]);
    }

    /**
     * Validate magic link token and issue Sanctum token.
     */
    public function validateMagicLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $magicLink = MagicLink::where('token', $validated['token'])->first();

        if (!$magicLink) {
            return response()->json([
                'message' => 'Token tidak ditemukan.',
            ], 404);
        }

        if (!$magicLink->isValid()) {
            return response()->json([
                'message' => 'Token sudah digunakan atau sudah kedaluwarsa.',
            ], 422);
        }

        // Mark as used
        $magicLink->update(['is_used' => true]);

        $user = $magicLink->user;
        $user->tokens()->delete();
        $authToken = $user->createToken('magic-link-token')->plainTextToken;

        return response()->json([
            'message' => 'Autentikasi magic link berhasil.',
            'user'    => $user->load('alumniProfile'),
            'token'   => $authToken,
        ]);
    }

    /**
     * Get current authenticated user profile.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('alumniProfile');

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Update alumni profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'email'          => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'phone_number'   => 'sometimes|string|unique:users,phone_number,' . $user->id,
            'is_wa_active'   => 'sometimes|boolean',
            // Alumni profile fields
            'current_status' => ['sometimes', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
            'campus_name'    => 'sometimes|nullable|string|max:255',
            'major_name'     => 'sometimes|nullable|string|max:255',
            'company_name'   => 'sometimes|nullable|string|max:255',
            'job_title'      => 'sometimes|nullable|string|max:255',
        ]);

        // Update user fields
        $userFields = collect($validated)->only([
            'name', 'email', 'phone_number', 'is_wa_active',
        ])->toArray();

        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // Update alumni profile fields
        $profileFields = collect($validated)->only([
            'current_status', 'campus_name', 'major_name', 'company_name', 'job_title',
        ])->toArray();

        if (!empty($profileFields) && $user->alumniProfile) {
            $user->alumniProfile->update($profileFields);
        }

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $user->fresh()->load('alumniProfile'),
        ]);
    }

    /**
     * Logout (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
}
