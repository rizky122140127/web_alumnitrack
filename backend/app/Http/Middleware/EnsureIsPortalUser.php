<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsPortalUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->user()?->role, ['admin', 'alumni'], true)) {
            return response()->json([
                'message' => 'Akun ini tidak memiliki akses ke portal.',
            ], 403);
        }

        return $next($request);
    }
}
