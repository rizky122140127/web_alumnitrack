<?php

namespace App\Services;

use App\Jobs\SendWaNotificationJob;
use App\Models\User;
use App\Models\WaNotification;

class TracerReminderService
{
    public function queueReminders(): int
    {
        $queuedCount = 0;

        User::where('role', 'alumni')
            ->where('alumni_approval_status', 'approved')
            ->where('is_wa_active', true)
            ->whereDoesntHave('tracerAnswers')
            ->chunkById(100, function ($alumniList) use (&$queuedCount) {
                foreach ($alumniList as $alumni) {
                    $message = "Halo {$alumni->name}!\n\n";
                    $message .= "Kami dari Admin SMAN 1 Talang Padang mengingatkan Anda untuk melengkapi Survei Tracer Study Alumni.\n\n";
                    $message .= "Silakan masuk menggunakan NISN dan password melalui tautan resmi berikut:\n";
                    $message .= "https://alumni.sman1talangpadang.sch.id/login\n\n";
                    $message .= "Terima kasih atas kontribusi Anda untuk almamater.\n";
                    $message .= '— Admin SMAN 1 Talang Padang';

                    $notification = WaNotification::create([
                        'user_id' => $alumni->id,
                        'career_post_id' => null,
                        'notification_type' => 'reminder_tracer',
                        'message_content' => $message,
                        'status' => 'queued',
                    ]);

                    SendWaNotificationJob::dispatch($notification);
                    $queuedCount++;
                }
            });

        return $queuedCount;
    }
}
