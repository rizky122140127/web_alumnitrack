<?php

namespace App\Services;

use App\Jobs\SendWaNotificationJob;
use App\Models\CareerPost;
use App\Models\User;
use App\Models\WaNotification;

class TargetedPushService
{
    /**
     * Filter recipients and queue WA notifications based on career post category.
     *
     * Business Rules:
     * - magang     → mahasiswa, gap_year, belum_kerja
     * - full_time  → belum_kerja, gap_year (EXCLUDE mahasiswa)
     * - part_time  → mahasiswa, belum_kerja, gap_year
     * Events do not send WhatsApp notifications.
     */
    public function dispatchForCareerPost(CareerPost $post): void
    {
        if (in_array($post->category, ['event_mahasiswa', 'event_umum'], true)) {
            return;
        }

        $recipientStatuses = $this->getTargetStatuses($post->category);

        $query = User::where('is_wa_active', true)
            ->where('role', 'alumni')
            ->where('alumni_approval_status', 'approved');

        if ($post->category !== 'beasiswa') {
            $query->whereHas('alumniProfile', function ($q) use ($recipientStatuses) {
                $q->whereIn('current_status', $recipientStatuses);
            });
        }

        $recipients = $query->get();

        foreach ($recipients as $user) {
            $notification = WaNotification::create([
                'user_id' => $user->id,
                'career_post_id' => $post->id,
                'notification_type' => 'targeted_push',
                'message_content' => $this->buildMessage($post, $user),
                'status' => 'queued',
            ]);

            SendWaNotificationJob::dispatch($notification);
        }
    }

    /**
     * Get target alumni statuses for a given career post category.
     */
    protected function getTargetStatuses(string $category): array
    {
        return match ($category) {
            'magang' => ['mahasiswa', 'gap_year', 'belum_kerja'],
            'full_time' => ['belum_kerja', 'gap_year'],
            'part_time' => ['mahasiswa', 'belum_kerja', 'gap_year'],
            'beasiswa' => [],
            default => [],
        };
    }

    /**
     * Build WA notification message.
     */
    protected function buildMessage(CareerPost $post, User $user): string
    {
        $categoryLabels = [
            'magang' => '📋 Magang',
            'full_time' => '💼 Full-Time',
            'part_time' => '⏰ Part-Time',
            'beasiswa' => '🎓 Beasiswa',
        ];

        $label = $categoryLabels[$post->category] ?? $post->category;

        $message = "Halo {$user->name}! 👋\n\n";
        $message .= "Ada informasi {$label} baru dari Alumni Tracker SMAN 1 Talang Padang:\n\n";
        $message .= "📌 *{$post->title}*\n";
        $message .= "🏢 {$post->company_or_institution}\n\n";
        $message .= "{$post->description}\n";

        if ($post->registration_link) {
            $message .= "\n🔗 Link Pendaftaran: {$post->registration_link}";
        }

        $message .= "\n\n— Alumni Tracker SMAN 1 Talang Padang";

        return $message;
    }
}
