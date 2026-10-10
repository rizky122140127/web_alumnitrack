<?php

namespace App\Http\Controllers;

use App\Models\WaNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaNotificationController extends Controller
{
    /**
     * List WA notification logs (Admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = WaNotification::with(['user:id,name,phone_number', 'careerPost:id,title']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('notification_type')) {
            $query->where('notification_type', $request->notification_type);
        }

        $notifications = $query->latest()->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Get notification statistics.
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total'  => WaNotification::count(),
            'queued' => WaNotification::queued()->count(),
            'sent'   => WaNotification::where('status', 'sent')->count(),
            'failed' => WaNotification::failed()->count(),
        ];

        return response()->json(['stats' => $stats]);
    }
}
