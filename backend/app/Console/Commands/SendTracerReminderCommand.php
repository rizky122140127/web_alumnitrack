<?php

namespace App\Console\Commands;

use App\Services\TracerReminderService;
use Illuminate\Console\Command;

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
    protected $description = 'Send WhatsApp reminders to alumni who have not filled the tracer study questionnaire.';

    /**
     * Execute the console command.
     */
    public function handle(TracerReminderService $reminderService): int
    {
        $this->info('Finding alumni who have not completed the tracer study...');
        $count = $reminderService->queueReminders();
        $this->info("Queued {$count} WhatsApp reminders.");

        if ($count === 0) {
            return Command::SUCCESS;
        }

        return Command::SUCCESS;
    }
}
