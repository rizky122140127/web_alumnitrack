<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniController extends Controller
{
    /**
     * List all alumni with profile and tracer status (Admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'alumni')
            ->with(['alumniProfile', 'tracerAnswers']);

        // Search by name, phone, or nisn
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhereHas('alumniProfile', function ($p) use ($search) {
                      $p->where('nisn', 'like', "%{$search}%")
                        ->orWhere('campus_name', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by graduation year
        if ($request->filled('graduation_year')) {
            $query->whereHas('alumniProfile', function ($p) use ($request) {
                $p->where('graduation_year', $request->graduation_year);
            });
        }

        // Filter by current status
        if ($request->filled('current_status')) {
            $query->whereHas('alumniProfile', function ($p) use ($request) {
                $p->where('current_status', $request->current_status);
            });
        }

        $alumni = $query->latest()->paginate(20);

        return response()->json($alumni);
    }
}
