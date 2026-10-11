<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'phone_number' => 'required|string|unique:users,phone_number',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'prohibited',
            'nisn' => 'required|string|regex:/^\d{10}$/|unique:users,nisn',
            'graduation_year' => 'required|integer|min:2000|max:2099',
            'current_status' => ['sometimes', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
        ]);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone_number' => $validated['phone_number'],
                'nisn' => $validated['nisn'],
                'password' => Hash::make($validated['password']),
                'role' => 'alumni',
                'alumni_approval_status' => 'pending',
            ]);

            AlumniProfile::create([
                'user_id' => $user->id,
                'graduation_year' => $validated['graduation_year'],
                'current_status' => $validated['current_status'] ?? 'belum_kerja',
            ]);

            return $user;
        });

        return response()->json([
            'message' => 'Pendaftaran berhasil dikirim dan menunggu verifikasi admin sekolah.',
            'user' => $user->load('alumniProfile'),
            'token' => null,
            'approval_status' => $user->alumni_approval_status,
        ], 201);
    }

    /**
     * Alumni authenticate with NISN; admins use email or phone.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nisn' => 'required_without:login|string|size:10',
            'login' => 'required_without:nisn|string',
            'password' => 'required|string',
        ]);

        $user = isset($validated['nisn'])
            ? User::where('nisn', $validated['nisn'])
                ->where('role', 'alumni')
                ->first()
            : User::where('role', 'admin')
                ->where(function ($query) use ($validated) {
                    $query->where('email', $validated['login'])
                        ->orWhere('phone_number', $validated['login']);
                })
                ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Kredensial tidak valid.',
            ], 401);
        }

        if ($user->role === 'alumni' && $user->alumni_approval_status !== 'approved') {
            return response()->json([
                'message' => $user->alumni_approval_status === 'rejected'
                    ? 'Pendaftaran alumni Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.'
                    : 'Pendaftaran alumni Anda masih menunggu verifikasi admin sekolah.',
                'approval_status' => $user->alumni_approval_status,
            ], 403);
        }

        // Revoke previous tokens
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $user->load('alumniProfile'),
            'token' => $token,
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
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|unique:users,email,'.$user->id,
            'phone_number' => 'sometimes|string|unique:users,phone_number,'.$user->id,
            'nisn' => ['sometimes', 'required', 'string', 'regex:/^\d{10}$/', Rule::unique('users', 'nisn')->ignore($user->id)],
            'is_wa_active' => 'sometimes|boolean',
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|string|min:8|confirmed',
            // Alumni profile fields
            'current_status' => ['sometimes', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
            'campus_name' => 'sometimes|nullable|string|max:255',
            'major_name' => 'sometimes|nullable|string|max:255',
            'company_name' => 'sometimes|nullable|string|max:255',
            'job_title' => 'sometimes|nullable|string|max:255',
        ]);

        // Update user fields
        $userFields = collect($validated)->only([
            'name', 'email', 'phone_number', 'nisn', 'is_wa_active',
        ])->toArray();

        if (! empty($validated['password'])) {
            if (! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Kata sandi saat ini tidak sesuai.',
                ], 422);
            }
            $userFields['password'] = Hash::make($validated['password']);
        }

        if (! empty($userFields)) {
            $user->update($userFields);
        }

        // Update alumni profile fields
        $profileFields = collect($validated)->only([
            'current_status', 'campus_name', 'major_name', 'company_name', 'job_title',
        ])->toArray();

        if (! empty($profileFields) && $user->alumniProfile) {
            $user->alumniProfile->update($profileFields);
        }

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user->fresh()->load('alumniProfile'),
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
