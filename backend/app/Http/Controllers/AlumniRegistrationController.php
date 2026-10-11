<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AlumniRegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected', 'all'])],
        ]);

        $query = User::where('role', 'alumni')
            ->with('alumniProfile')
            ->latest();

        $status = $validated['status'] ?? 'pending';
        if ($status !== 'all') {
            $query->where('alumni_approval_status', $status);
        }

        return response()->json($query->paginate(20));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
        ]);

        if ($user->role !== 'alumni') {
            return response()->json([
                'message' => 'Hanya pendaftaran akun alumni yang dapat dimoderasi.',
            ], 422);
        }

        $user->update(['alumni_approval_status' => $validated['status']]);
        if ($validated['status'] === 'rejected') {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Pendaftaran alumni berhasil disetujui.'
                : 'Pendaftaran alumni ditolak.',
            'user' => $user->fresh()->load('alumniProfile'),
        ]);
    }
}
