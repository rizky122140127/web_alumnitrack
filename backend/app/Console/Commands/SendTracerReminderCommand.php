<?php

namespace App\Console\Commands;

use App\Jobs\SendWaNotificationJob;
use App\Models\MagicLink;
use App\Models\User;
use App\Models\WaNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SendTracerReminderCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alumni:send-tracer-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send WhatsApp reminder and Magic Link to alumni who have not filled the tracer study questionnaire.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Finding alumni who have not completed the tracer study...');

        // Find alumni with active WA and no tracer answers
        $unresponsiveAlumni = User::where('role', 'alumni')
            ->where('is_wa_active', true)
            ->whereDoesntHave('tracerAnswers')
            ->get();

        $count = $unresponsiveAlumni->count();
        $this->info("Found {$count} alumni needing tracer study reminders.");

        if ($count === 0) {
            return Command::SUCCESS;
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        foreach ($unresponsiveAlumni as $alumni) {
            // Generate 24h magic link
            $token = Str::random(64);
            MagicLink::create([
                'user_id'    => $alumni->id,
                'token'      => $token,
                'expires_at' => now()->addHours(24),
                'is_used'    => false,
            ]);

            $magicLink = "{$frontendUrl}/auth/magic-link?token={$token}";

            $message = "Halo {$alumni->name}! 👋\n\n";
            $message .= "Kami dari Tim Bimbingan Konseling (BK) SMAN 1 Talang Padang memohon bantuan Anda untuk melengkapi *Survei Tracer Study Alumni*.\n\n";
            $message .= "Data ini sangat penting untuk pelaporan akreditasi dan evaluasi peningkatan mutu sekolah kita.\n\n";
            $message .= "🚀 *Klik tautan ini untuk masuk & mengisi kuesioner tanpa password*:\n";
            $message .= "{$magicLink}\n\n";
            $message .= "Tautan di atas aman dan berlaku selama 24 jam.\n\n";
            $message .= "Terima kasih atas kontribusi Anda untuk almamater!\n";
            $message .= "— Tim BK SMAN 1 Talang Padang";

            $notification = WaNotification::create([
                'user_id'           => $alumni->id,
                'career_post_id'    => null,
                'notification_type' => 'reminder_tracer',
                'message_content'   => $message,
                'status'            => 'queued',
            ]);

            SendWaNotificationJob::dispatch($notification);
        }

        $this->info("Successfully queued {$count} WhatsApp reminders!");

        return Command::SUCCESS;
    }
}
