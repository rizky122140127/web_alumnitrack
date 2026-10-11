<?php

namespace App\Http\Controllers;

use App\Jobs\SendWaNotificationJob;
use App\Models\User;
use App\Models\WaNotification;
use App\Services\TracerReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'total' => WaNotification::count(),
            'queued' => WaNotification::queued()->count(),
            'sent' => WaNotification::where('status', 'sent')->count(),
            'failed' => WaNotification::failed()->count(),
        ];

        return response()->json(['stats' => $stats]);
    }

    public function sendTracerReminders(TracerReminderService $reminderService): JsonResponse
    {
        $queuedCount = $reminderService->queueReminders();

        return response()->json([
            'message' => $queuedCount > 0
                ? "{$queuedCount} pengingat tracer study masuk ke antrean WhatsApp."
                : 'Tidak ada alumni yang memerlukan pengingat saat ini.',
            'queued_count' => $queuedCount,
        ]);
    }

    public function sendTargetedBroadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'statuses' => ['required', 'array', 'min:1'],
            'statuses.*' => ['required', 'string', 'distinct', Rule::in([
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja',
            ])],
            'message' => ['required', 'string', 'max:4096'],
        ]);

        $queuedCount = 0;

        User::query()
            ->where('role', 'alumni')
            ->where('alumni_approval_status', 'approved')
            ->where('is_wa_active', true)
            ->whereHas('alumniProfile', function ($query) use ($validated) {
                $query->whereIn('current_status', $validated['statuses']);
            })
            ->chunkById(100, function ($alumniList) use (&$queuedCount, $validated) {
                foreach ($alumniList as $alumni) {
                    $notification = WaNotification::create([
                        'user_id' => $alumni->id,
                        'career_post_id' => null,
                        'notification_type' => 'targeted_push',
                        'message_content' => $validated['message'],
                        'status' => 'queued',
                    ]);

                    SendWaNotificationJob::dispatch($notification);
                    $queuedCount++;
                }
            });

        return response()->json([
            'message' => $queuedCount > 0
                ? "{$queuedCount} notifikasi masuk ke antrean WhatsApp."
                : 'Tidak ada alumni aktif dengan status tersebut yang dapat menerima notifikasi.',
            'queued_count' => $queuedCount,
        ]);
    }
}
