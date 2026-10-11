<?php

namespace Tests\Feature;

use App\Models\CareerPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_only_view_approved_event_posts(): void
    {
        $author = User::create([
            'name' => 'Admin Sekolah',
            'phone_number' => '6281000000090',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $approvedEvent = $this->createPost($author, 'Event Terbuka', 'event_umum', 'approved', 'completed');
        $this->createPost($author, 'Event Menunggu', 'event_mahasiswa', 'pending');
        $this->createPost($author, 'Lowongan Terbuka', 'magang', 'approved');
        $this->createPost($author, 'Event Akan Datang', 'event_umum', 'approved', 'upcoming');

        $this->getJson('/api/public/events')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approvedEvent->id)
            ->assertJsonPath('data.0.title', 'Event Terbuka')
            ->assertJsonPath('data.0.author.name', 'Admin Sekolah');
    }

    private function createPost(User $author, string $title, string $category, string $status, ?string $eventPhase = null): CareerPost
    {
        return CareerPost::create([
            'author_id' => $author->id,
            'title' => $title,
            'category' => $category,
            'event_phase' => $eventPhase,
            'company_or_institution' => 'SMAN 1 Talang Padang',
            'description' => 'Informasi acara untuk alumni.',
            'status' => $status,
        ]);
    }
}
