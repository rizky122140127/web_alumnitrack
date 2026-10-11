<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => User::where('role', 'admin')
                ->latest()
                ->get(['id', 'name', 'email', 'phone_number', 'created_at']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email',
            'phone_number' => 'required|string|max:30|unique:users,phone_number',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone_number' => $validated['phone_number'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'alumni_approval_status' => 'approved',
        ]);

        return response()->json([
            'message' => 'Akun admin berhasil ditambahkan.',
            'admin' => $admin->only(['id', 'name', 'email', 'phone_number', 'role', 'created_at']),
        ], 201);
    }
}
