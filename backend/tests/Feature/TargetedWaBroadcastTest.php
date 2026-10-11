<?php

namespace Tests\Feature;

use App\Jobs\SendWaNotificationJob;
use App\Models\AlumniProfile;
use App\Models\CareerPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TargetedWaBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_queue_broadcast_for_selected_active_approved_alumni_statuses(): void
    {
        Queue::fake();
        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281000000000',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $student = $this->createAlumni('6281000000001', '0012345671', 'mahasiswa');
        $worker = $this->createAlumni('6281000000002', '0012345672', 'bekerja');
        $this->createAlumni('6281000000003', '0012345673', 'gap_year');
        $inactive = $this->createAlumni('6281000000004', '0012345674', 'mahasiswa', false);
        $rejected = $this->createAlumni('6281000000005', '0012345675', 'mahasiswa', true, 'rejected');

        $this->postJson('/api/wa-notifications/send-targeted', [
            'statuses' => ['mahasiswa', 'bekerja'],
            'message' => 'Informasi kegiatan alumni.',
        ])
            ->assertOk()
            ->assertJsonPath('queued_count', 2);

        foreach ([$student, $worker] as $recipient) {
            $this->assertDatabaseHas('wa_notifications', [
                'user_id' => $recipient->id,
                'notification_type' => 'targeted_push',
                'message_content' => 'Informasi kegiatan alumni.',
                'status' => 'queued',
            ]);
        }

        foreach ([$inactive, $rejected] as $excluded) {
            $this->assertDatabaseMissing('wa_notifications', ['user_id' => $excluded->id]);
        }

        Queue::assertPushed(SendWaNotificationJob::class, 2);
    }

    public function test_targeted_broadcast_requires_valid_statuses_and_message(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281000000000',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/wa-notifications/send-targeted', [
            'statuses' => ['admin'],
            'message' => '',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['statuses.0', 'message']);
    }

    public function test_events_never_queue_whatsapp_notifications_when_published_or_approved(): void
    {
        Queue::fake();
        $admin = User::create([
            'name' => 'Admin',
            'phone_number' => '6281000000000',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);
        foreach (['event_mahasiswa', 'event_umum'] as $category) {
            $this->postJson('/api/career-posts', [
                'title' => "Agenda {$category}",
                'category' => $category,
                'event_phase' => 'upcoming',
                'company_or_institution' => 'SMAN 1 Talang Padang',
                'description' => 'Informasi acara sekolah.',
            ])->assertCreated();
        }

        $this->assertDatabaseCount('wa_notifications', 0);
        Queue::assertNothingPushed();

        $alumni = $this->createAlumni('6281000000001', '0012345671', 'mahasiswa');
        Sanctum::actingAs($alumni);
        $this->postJson('/api/career-posts', [
            'title' => 'Event Alumni',
            'category' => 'event_umum',
            'company_or_institution' => 'SMAN 1 Talang Padang',
            'description' => 'Reuni alumni.',
        ])->assertCreated()->assertJsonPath('post.status', 'pending');

        Sanctum::actingAs($admin);
        $pendingPost = CareerPost::where('author_id', $alumni->getKey())->firstOrFail();
        $this->putJson("/api/career-posts/{$pendingPost->getKey()}", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseCount('wa_notifications', 0);
        Queue::assertNothingPushed();
    }

    private function createAlumni(
        string $phone,
        string $nisn,
        string $status,
        bool $waActive = true,
        string $approvalStatus = 'approved',
    ): User {
        $user = User::create([
            'name' => "Alumni {$nisn}",
            'phone_number' => $phone,
            'nisn' => $nisn,
            'password' => 'password123',
            'role' => 'alumni',
            'alumni_approval_status' => $approvalStatus,
            'is_wa_active' => $waActive,
        ]);

        AlumniProfile::create([
            'user_id' => $user->getKey(),
            'graduation_year' => 2024,
            'current_status' => $status,
        ]);

        return $user;
    }
}
