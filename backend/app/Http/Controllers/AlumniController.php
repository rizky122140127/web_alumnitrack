<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AlumniController extends Controller
{
    /**
     * List all alumni with profile and tracer status (Admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'alumni')
            ->where('alumni_approval_status', 'approved')
            ->with(['alumniProfile', 'tracerAnswers']);

        // Search by name, phone, or nisn
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%")
                    ->orWhereHas('alumniProfile', function ($p) use ($search) {
                        $p->where('campus_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by graduation year
        if ($request->filled('graduation_year')) {
            $query->whereHas('alumniProfile', function ($p) use ($request) {
                $p->where('graduation_year', $request->input('graduation_year'));
            });
        }

        // Filter by current status
        if ($request->filled('current_status')) {
            $query->whereHas('alumniProfile', function ($p) use ($request) {
                $p->where('current_status', $request->input('current_status'));
            });
        }

        $alumni = $query->latest()->paginate(20);

        return response()->json($alumni);
    }

    public function show(User $user): JsonResponse
    {
        abort_unless($user->role === 'alumni' && $user->alumni_approval_status === 'approved', 404);

        return response()->json([
            'user' => $user->load([
                'alumniProfile',
                'tracerAnswers.question',
            ]),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless($user->role === 'alumni' && $user->alumni_approval_status === 'approved', 404);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone_number' => ['required', 'string', 'max:30', Rule::unique('users', 'phone_number')->ignore($user->id)],
            'is_wa_active' => 'required|boolean',
            'nisn' => ['required', 'string', 'size:10', Rule::unique('users', 'nisn')->ignore($user->id)],
            'graduation_year' => 'required|integer|min:2000|max:2099',
            'current_status' => ['required', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
            'campus_name' => 'nullable|string|max:255',
            'major_name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
        ]);

        if (! $user->alumniProfile) {
            return response()->json([
                'message' => 'Profil alumni tidak ditemukan dan tidak dapat diperbarui.',
            ], 422);
        }

        DB::transaction(function () use ($user, $validated) {
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone_number' => $validated['phone_number'],
                'nisn' => $validated['nisn'],
                'is_wa_active' => $validated['is_wa_active'],
            ]);

            $user->alumniProfile->update([
                'graduation_year' => $validated['graduation_year'],
                'current_status' => $validated['current_status'],
                'campus_name' => $validated['campus_name'] ?? null,
                'major_name' => $validated['major_name'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Data alumni berhasil diperbarui.',
            'user' => $user->fresh()->load('alumniProfile'),
        ]);
    }
}
