<?php

namespace App\Jobs;

use App\Models\WaNotification;
use App\Services\FonnteService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWaNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying.
     */
    public int $backoff = 60;

    public function __construct(
        public WaNotification $notification,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(FonnteService $fonnteService): void
    {
        $user = $this->notification->user;

        if (!$user || !$user->phone_number) {
            $this->notification->update([
                'status'  => 'failed',
                'sent_at' => now(),
            ]);
            return;
        }

        $result = $fonnteService->sendMessage(
            $user->phone_number,
            $this->notification->message_content,
        );

        $this->notification->update([
            'status'  => $result['success'] ? 'sent' : 'failed',
            'sent_at' => now(),
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $this->notification->update([
            'status'  => 'failed',
            'sent_at' => now(),
        ]);
    }
}
