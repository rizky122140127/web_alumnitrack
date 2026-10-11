<?php

namespace Tests\Feature;

use App\Jobs\SendWaNotificationJob;
use App\Models\AlumniProfile;
use App\Models\TracerAnswer;
use App\Models\TracerQuestion;
use App\Models\User;
use App\Models\WaNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TracerReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_queue_login_reminders_only_for_active_unanswered_alumni(): void
    {
        Queue::fake();
        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281000000000',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $eligible = $this->createAlumni('6281000000001', '0012345671', true);
        $this->createAlumni('6281000000002', '0012345672', false);
        $responded = $this->createAlumni('6281000000003', '0012345673', true);
        $question = TracerQuestion::create([
            'question_text' => 'Pertanyaan tracer',
            'question_type' => 'text',
            'is_required' => true,
            'order_number' => 1,
        ]);
        TracerAnswer::create([
            'user_id' => $responded->id,
            'question_id' => $question->id,
            'answer_value' => 'Sudah mengisi',
        ]);

        $this->postJson('/api/wa-notifications/send-tracer-reminders')
            ->assertOk()
            ->assertJsonPath('queued_count', 1);

        $this->assertDatabaseHas('wa_notifications', [
            'user_id' => $eligible->id,
            'notification_type' => 'reminder_tracer',
            'status' => 'queued',
        ]);
        $this->assertDatabaseMissing('wa_notifications', ['user_id' => $responded->id]);
        $this->assertDatabaseMissing('wa_notifications', ['user_id' => User::where('phone_number', '6281000000002')->value('id')]);
        $message = WaNotification::where('user_id', $eligible->id)->value('message_content');
        $this->assertStringContainsString('https://alumni.sman1talangpadang.sch.id/login', $message);
        Queue::assertPushed(SendWaNotificationJob::class, 1);
    }

    private function createAlumni(string $phone, string $nisn, bool $waActive): User
    {
        $user = User::create([
            'name' => "Alumni {$nisn}",
            'phone_number' => $phone,
            'nisn' => $nisn,
            'password' => 'password123',
            'role' => 'alumni',
            'is_wa_active' => $waActive,
        ]);
        AlumniProfile::create([
            'user_id' => $user->id,
            'graduation_year' => 2024,
            'current_status' => 'belum_kerja',
        ]);

        return $user;
    }
}
